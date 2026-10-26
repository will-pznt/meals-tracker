import { Service, inject } from '@angular/core';
import { equalTo, get, orderByChild, query, ref, remove, set, update } from 'firebase/database';
import { forkJoin, from, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { AuthService } from './auth-service.service';
import { DemoService } from './demo.service';
import { FoodService } from './food.service';
import { DEMO_MEAL_DATA } from '../data-models/DEMO_MEAL_DATA';
import { FoodItem } from '../data-models/FoodItem';
import { FoodNutrient } from '../data-models/FoodNutrient';
import { FoodItemStored, Meal, MEAL_NAMES, MealName } from '../data-models/Meal';
import { UsdaDetailNutrient } from '../data-models/UsdaApi';
import { FIREBASE_DB } from '../firebase';
import { DEFAULT_QUANTITY_GRAMS } from '../nutrition/nutrient-totals';

export type DayMeals = Readonly<Record<MealName, FoodItem[]>>;

export const EMPTY_DAY: DayMeals = { breakfast: [], lunch: [], dinner: [] };

export function mealKey(date: string, name: MealName): string {
  return `${date}_${name}`;
}

export function isMealName(value: unknown): value is MealName {
  return MEAL_NAMES.includes(value as MealName);
}

export function toFoodNutrients(rawNutrients: readonly UsdaDetailNutrient[] | undefined): FoodNutrient[] {
  return (rawNutrients ?? [])
    .filter((n) => n?.nutrient)
    .map((n) => ({
      nutrientId: n.nutrient.id,
      nutrientName: n.nutrient.name,
      nutrientNumber: n.nutrient.number,
      unitName: n.nutrient.unitName,
      value: n.amount ?? 0,
      rank: n.nutrient.rank,
      indentLevel: 0,
      foodNutrientId: n.id,
    }));
}

export function groupStoredMeals(
  date: string,
  records: Readonly<Record<string, Partial<Meal>>>,
): { items: Record<MealName, FoodItemStored[]>; legacyKeys: string[] } {
  const items: Record<MealName, FoodItemStored[]> = { breakfast: [], lunch: [], dinner: [] };
  const legacyKeys: string[] = [];

  for (const [key, meal] of Object.entries(records)) {
    if (!isMealName(meal?.name)) continue;
    if (key !== mealKey(date, meal.name)) legacyKeys.push(key);
    for (const stored of meal.items ?? []) {
      if (items[meal.name].some((existing) => existing.fdcId === stored.fdcId)) continue;
      items[meal.name].push({ fdcId: stored.fdcId, quantity: stored.quantity ?? DEFAULT_QUANTITY_GRAMS });
    }
  }

  return { items, legacyKeys };
}

@Service()
export class MealService {
  private db = inject(FIREBASE_DB);
  private authService = inject(AuthService);
  private foodService = inject(FoodService);
  private demoService = inject(DemoService);

  saveMeal(date: string, name: MealName, items: readonly FoodItemStored[]): Observable<void> {
    if (this.demoService.isDemoMode()) return of(undefined);

    const uid = this.authService.currentUserId;
    if (!uid) return throwError(() => new Error('User not authenticated'));

    const id = mealKey(date, name);
    const mealRef = ref(this.db, `meals/${uid}/${id}`);
    if (!items.length) return from(remove(mealRef));

    const meal: Meal = { id, name, date, items: [...items] };
    return from(set(mealRef, meal));
  }

  getMealsByDate(date: string): Observable<DayMeals> {
    if (this.demoService.isDemoMode()) return of(DEMO_MEAL_DATA);

    const uid = this.authService.currentUserId;
    if (!uid) return of(EMPTY_DAY);

    const mealsQuery = query(ref(this.db, `meals/${uid}`), orderByChild('date'), equalTo(date));

    return from(get(mealsQuery)).pipe(
      switchMap((snapshot) => {
        const records: Record<string, Partial<Meal>> = snapshot.exists() ? snapshot.val() : {};
        const { items, legacyKeys } = groupStoredMeals(date, records);
        return this.migrateLegacyMeals(uid, date, items, legacyKeys).pipe(map(() => items));
      }),
      switchMap((items) =>
        forkJoin({
          breakfast: this.enrichItems(items.breakfast),
          lunch: this.enrichItems(items.lunch),
          dinner: this.enrichItems(items.dinner),
        }),
      ),
    );
  }

  private migrateLegacyMeals(
    uid: string,
    date: string,
    items: Record<MealName, FoodItemStored[]>,
    legacyKeys: readonly string[],
  ): Observable<void> {
    if (!legacyKeys.length) return of(undefined);

    const updates: Record<string, Meal | null> = {};
    for (const key of legacyKeys) updates[key] = null;
    for (const name of MEAL_NAMES) {
      const id = mealKey(date, name);
      updates[id] = items[name].length ? { id, name, date, items: items[name] } : null;
    }

    return from(update(ref(this.db, `meals/${uid}`), updates)).pipe(catchError(() => of(undefined)));
  }

  private enrichItems(stored: readonly FoodItemStored[]): Observable<FoodItem[]> {
    if (!stored.length) return of([]);
    return forkJoin(
      stored.map((item) =>
        this.foodService.getFoodDetails(item.fdcId).pipe(
          map((detail): FoodItem => ({
            fdcId: item.fdcId,
            description: detail?.description ?? '',
            quantity: item.quantity,
            foodNutrients: toFoodNutrients(detail?.foodNutrients),
          })),
          catchError(() =>
            of<FoodItem>({ fdcId: item.fdcId, description: '', quantity: item.quantity, foodNutrients: [] }),
          ),
        ),
      ),
    );
  }
}
