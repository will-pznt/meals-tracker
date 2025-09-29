import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { from, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { FoodItem } from '../data-models/FoodItem';
import { Meal } from '../data-models/Meal';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MealService {
  private http = inject(HttpClient);
  private auth = inject(Auth);

  private apiUrl = environment.apiUrl;

  constructor() {}

  private getAuthHeaders(): Observable<HttpHeaders> {
    return from(this.auth.currentUser?.getIdToken() ?? Promise.resolve('')).pipe(
      switchMap((token) => {
        if (!token) throw new Error('User not authenticated');
        return [new HttpHeaders({ Authorization: `Bearer ${token}` })];
      }),
    );
  }

  saveMeal(meal: Meal): Observable<Meal> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) => this.http.post<Meal>(`${this.apiUrl}/meals`, { meal }, { headers })),
    );
  }

  getMealsByDate(date: string): Observable<Record<'breakfast' | 'lunch' | 'dinner', FoodItem[]>> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) => this.http.get<Meal[]>(`${this.apiUrl}/meals/${date}`, { headers })),
      // transform API response → mealFoodItems structure
      map((meals) => {
        const mealFoodItems: Record<'breakfast' | 'lunch' | 'dinner', FoodItem[]> = {
          breakfast: [],
          lunch: [],
          dinner: [],
        };

        meals.forEach((meal) => {
          const key = meal.name as 'breakfast' | 'lunch' | 'dinner';
          mealFoodItems[key] = (meal.items || []).map((f) => ({
            fdcId: f.fdcId,
            description: f.description || '',
            quantity: f.quantity,
            foodNutrients: f.essentialNutrients || [],
            mealId: meal.id,
          }));
        });

        return mealFoodItems;
      }),
    );
  }

  deleteFoodItemMeal(mealId: string, fdcId: number): Observable<void> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) => this.http.delete<void>(`${this.apiUrl}/meals/${mealId}/food-items/${fdcId}`, { headers })),
    );
  }
}
