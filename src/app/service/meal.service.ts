import { Service, inject } from '@angular/core';
import { Database } from '@angular/fire/database';
import { equalTo, get, orderByChild, push, query, ref, remove, set, update } from 'firebase/database';
import { forkJoin, from, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { FoodItem } from '../data-models/FoodItem';
import { Meal } from '../data-models/Meal';
import { AuthService } from './auth-service.service';
import { FoodService } from './food.service';

@Service()
export class MealService {
  private db = inject(Database);
  private authService = inject(AuthService);
  private foodService = inject(FoodService);

  /**
   * Save a meal directly to Firebase Realtime Database, scoped to the current user.
   * Updates the existing meal if `meal.id` is set, otherwise creates a new one.
   * @param meal Meal object to be saved
   * @returns
   */
  saveMeal(meal: Meal): Observable<Meal> {
    const uid = this.authService.currentUserId;
    if (!uid) return throwError(() => new Error('User not authenticated'));

    if (meal.id) {
      const mealRef = ref(this.db, `meals/${uid}/${meal.id}`);
      return from(set(mealRef, meal)).pipe(map(() => meal));
    }

    const newMealRef = push(ref(this.db, `meals/${uid}`));
    const mealWithId: Meal = { ...meal, id: newMealRef.key! };
    return from(set(newMealRef, mealWithId)).pipe(map(() => mealWithId));
  }

  /**
   * Fetch meals for a specific date, enrich each stored food item with its USDA details,
   * and transform the response into a structured format.
   * @param date in 'YYYY-MM-DD' format
   * @returns
   */
  getMealsByDate(date: string): Observable<Record<'breakfast' | 'lunch' | 'dinner', FoodItem[]>> {
    const emptyResult: Record<'breakfast' | 'lunch' | 'dinner', FoodItem[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
    };

    const uid = this.authService.currentUserId;
    if (!uid) return of(emptyResult);

    const mealsQuery = query(ref(this.db, `meals/${uid}`), orderByChild('date'), equalTo(date));

    return from(get(mealsQuery)).pipe(
      switchMap((snapshot) => {
        const meals: Meal[] = snapshot.exists() ? Object.values(snapshot.val()) : [];
        if (!meals.length) return of(emptyResult);

        return forkJoin(meals.map((meal) => this.enrichMealItems(meal))).pipe(
          map((enrichedMeals) => {
            const mealFoodItems = { ...emptyResult };
            for (const meal of enrichedMeals) {
              if (meal.name === 'breakfast' || meal.name === 'lunch' || meal.name === 'dinner') {
                mealFoodItems[meal.name] = meal.items;
              }
            }
            return mealFoodItems;
          }),
        );
      }),
    );
  }

  /**
   * Delete a food item from a specific meal. Removes the whole meal if it becomes empty.
   * @param mealId
   * @param fdcId
   * @returns
   */
  deleteFoodItemMeal(mealId: string, fdcId: number): Observable<void> {
    const uid = this.authService.currentUserId;
    if (!uid) return throwError(() => new Error('User not authenticated'));

    const mealRef = ref(this.db, `meals/${uid}/${mealId}`);

    return from(get(mealRef)).pipe(
      switchMap((snapshot) => {
        if (!snapshot.exists()) return of(undefined);

        const meal = snapshot.val() as Meal;
        const updatedItems = (meal.items || []).filter((item) => String(item.fdcId) !== String(fdcId));

        if (updatedItems.length === 0) {
          return from(remove(mealRef)).pipe(map(() => undefined));
        }
        return from(update(mealRef, { items: updatedItems })).pipe(map(() => undefined));
      }),
    );
  }

  /**
   * Fetch USDA details for each stored food item ({fdcId, quantity}) in a meal.
   * A failed lookup for one item falls back to a blank description/nutrients instead of
   * failing the whole meal load.
   * @param meal
   */
  private enrichMealItems(meal: Meal): Observable<{ name: string; items: FoodItem[] }> {
    const itemRequests = (meal.items || []).map((item) =>
      this.foodService.getFoodDetails(item.fdcId).pipe(
        map(
          (detail): FoodItem => ({
            fdcId: item.fdcId,
            description: detail?.description || '',
            quantity: item.quantity,
            foodNutrients: detail?.foodNutrients || [],
            mealId: meal.id,
          }),
        ),
        catchError(() =>
          of<FoodItem>({
            fdcId: item.fdcId,
            description: '',
            quantity: item.quantity,
            foodNutrients: [],
            mealId: meal.id,
          }),
        ),
      ),
    );

    if (!itemRequests.length) return of({ name: meal.name, items: [] });
    return forkJoin(itemRequests).pipe(map((items) => ({ name: meal.name, items })));
  }
}
