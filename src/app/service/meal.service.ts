import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { FoodItem } from '../data-models/FoodItem';
import { Meal } from '../data-models/Meal';
import { AuthService } from './auth-service.service';
import { environment } from '../../environments/environment';

@Service()
export class MealService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private apiUrl = environment.apiUrl;

  constructor() { }

  /** Helper method to get authorization headers with the current user's ID token.
   * @returns Observable emitting HttpHeaders with Authorization token
   */
  private getAuthHeaders(): Observable<HttpHeaders> {
    return this.authService.getIdToken().pipe(
      switchMap((token) => {
        if (!token) throw new Error('User not authenticated');
        return [new HttpHeaders({ Authorization: `Bearer ${token}` })];
      }),
    );
  }

  /**
   * Save a meal to the backend.
   * @param meal Meal object to be saved
   * @returns
   */
  saveMeal(meal: Meal): Observable<Meal> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) => this.http.post<Meal>(`${this.apiUrl}/meals`, { meal }, { headers })),
    );
  }

  /**
   * Fetch meals for a specific date and transform the response into a structured format.
   * @param date in 'YYYY-MM-DD' format
   * @returns
   */
  getMealsByDate(date: string): Observable<Record<'breakfast' | 'lunch' | 'dinner', FoodItem[]>> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) => this.http.get<Meal[]>(`${this.apiUrl}/meals/${date}`, { headers })),
      // transform API response → mealFoodItems structure
      map((meals: any[]) => {
        const mealFoodItems: Record<'breakfast' | 'lunch' | 'dinner', FoodItem[]> = {
          breakfast: [],
          lunch: [],
          dinner: [],
        };

        meals.forEach((meal) => {
          const key = meal.name as 'breakfast' | 'lunch' | 'dinner';
          mealFoodItems[key] = (meal.items || []).map((f: { fdcId: any; description: any; quantity: any; essentialNutrients: any; }) => ({
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

  /**
   * Delete a food item from a specific meal.
   * @param mealId
   * @param fdcId
   * @returns
   */
  deleteFoodItemMeal(mealId: string, fdcId: number): Observable<void> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) => this.http.delete<void>(`${this.apiUrl}/meals/${mealId}/food-items/${fdcId}`, { headers })),
    );
  }
}
