import { NgZone, Service, inject } from '@angular/core';
import { Database } from '@angular/fire/database';
import { equalTo, get, orderByChild, push, query, ref, remove, set, update } from 'firebase/database';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { DEMO_MEAL_DATA } from '../data-models/DEMO_MEAL_DATA';
import { FoodItem } from '../data-models/FoodItem';
import { Meal } from '../data-models/Meal';
import { AuthService } from './auth-service.service';
import { DemoService } from './demo.service';
import { FoodService } from './food.service';

@Service()
export class MealService {
  private db = inject(Database);
  private authService = inject(AuthService);
  private foodService = inject(FoodService);
  private demoService = inject(DemoService);
  private zone = inject(NgZone);

  /**
   * Save a meal directly to Firebase Realtime Database, scoped to the current user.
   * Updates the existing meal if `meal.id` is set, otherwise creates a new one.
   * In demo mode, this is a no-op success — nothing is persisted.
   * @param meal Meal object to be saved
   * @returns
   */
  saveMeal(meal: Meal): Observable<Meal> {
    if (this.demoService.isDemoMode()) {
      // Always return a truthy id, even for a first save, so a freshly-added demo item can
      // still be deleted afterward (deletion requires a mealId).
      return of({ ...meal, id: meal.id || `demo-${meal.name}` });
    }

    const uid = this.authService.currentUserId;
    if (!uid) return throwError(() => new Error('User not authenticated'));

    if (meal.id) {
      const mealRef = ref(this.db, `meals/${uid}/${meal.id}`);
      return this.fromFirebase(set(mealRef, meal)).pipe(map(() => meal));
    }

    const newMealRef = push(ref(this.db, `meals/${uid}`));
    const mealWithId: Meal = { ...meal, id: newMealRef.key! };
    return this.fromFirebase(set(newMealRef, mealWithId)).pipe(map(() => mealWithId));
  }

  /**
   * Fetch meals for a specific date, enrich each stored food item with its USDA details,
   * and transform the response into a structured format.
   * In demo mode, returns the same sample meals regardless of date.
   * @param date in 'YYYY-MM-DD' format
   * @returns
   */
  getMealsByDate(date: string): Observable<Record<'breakfast' | 'lunch' | 'dinner', FoodItem[]>> {
    const emptyResult: Record<'breakfast' | 'lunch' | 'dinner', FoodItem[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
    };

    if (this.demoService.isDemoMode()) return of(DEMO_MEAL_DATA);

    const uid = this.authService.currentUserId;
    if (!uid) return of(emptyResult);

    const mealsQuery = query(ref(this.db, `meals/${uid}`), orderByChild('date'), equalTo(date));

    return this.fromFirebase(get(mealsQuery)).pipe(
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
   * In demo mode, this is a no-op success — nothing is persisted.
   * @param mealId
   * @param fdcId
   * @returns
   */
  deleteFoodItemMeal(mealId: string, fdcId: number): Observable<void> {
    if (this.demoService.isDemoMode()) return of(undefined);

    const uid = this.authService.currentUserId;
    if (!uid) return throwError(() => new Error('User not authenticated'));

    const mealRef = ref(this.db, `meals/${uid}/${mealId}`);

    return this.fromFirebase(get(mealRef)).pipe(
      switchMap((snapshot) => {
        if (!snapshot.exists()) return of(undefined);

        const meal = snapshot.val() as Meal;
        const updatedItems = (meal.items || []).filter((item) => String(item.fdcId) !== String(fdcId));

        if (updatedItems.length === 0) {
          return this.fromFirebase(remove(mealRef)).pipe(map(() => undefined));
        }
        return this.fromFirebase(update(mealRef, { items: updatedItems })).pipe(map(() => undefined));
      }),
    );
  }

  /**
   * Wrap a raw Firebase SDK promise so its resolution is delivered inside the Angular zone.
   * Firebase's modular SDK resolves its promises via its own internal (non-zone-patched)
   * scheduling, so without this, subscribers receive the value correctly but Angular never
   * schedules a change-detection pass for it — the data updates but the view doesn't.
   * Same fix already applied in AuthService for the same reason.
   */
  private fromFirebase<T>(promise: Promise<T>): Observable<T> {
    return new Observable<T>((subscriber) => {
      promise.then(
        (value) => this.zone.run(() => { subscriber.next(value); subscriber.complete(); }),
        (error) => this.zone.run(() => subscriber.error(error)),
      );
    });
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
