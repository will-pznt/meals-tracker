import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { FoodItem } from '../../data-models/FoodItem';
import { FoodNutrientParsed } from '../../data-models/FoodNutrientParsed';
import { Meal } from '../../data-models/Meal';
import { AuthService } from '../../service/auth-service.service';
import { FoodService } from '../../service/food.service';
import { GenderService } from '../../service/gender.service';
import { MealService } from '../../service/meal.service';
import { DailyRequirementsComponent } from '../daily-requirements/daily-requirements.component';
import { MealDisplayComponent } from '../meal-display/meal-display.component';

@Component({
  selector: 'app-meal-selector',
  standalone: true,
  imports: [
    MealDisplayComponent,
    DailyRequirementsComponent,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatButtonToggleModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './meal-planner.component.html',
  styleUrl: './meal-planner.component.scss',
})
export class MealPlannerComponent implements OnInit, OnDestroy {
  private mealService = inject(MealService);
  private authService = inject(AuthService);
  private genderService = inject(GenderService);
  private foodService = inject(FoodService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  selectedMeal: 'breakfast' | 'lunch' | 'dinner' | 'daily' = 'breakfast';
  selectedDate: Date = new Date();
  gender: 'men' | 'women' = 'men';
  sumEssentialNutrients: FoodNutrientParsed[] = [];

  loading = false;

  mealFoodItems: Record<'breakfast' | 'lunch' | 'dinner', FoodItem[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
  };

  private loadSub?: Subscription;
  constructor() {}

  get foodItems(): FoodItem[] {
    if (this.selectedMeal === 'daily') {
      return [];
    }
    return this.mealFoodItems[this.selectedMeal] || [];
  }

  ngOnInit(): void {
    this.loadMeals();
  }

  ngOnDestroy(): void {
    this.loadSub?.unsubscribe();
  }

  /**
   * Select meal
   * @param meal
   */
  selectMeal(meal: 'breakfast' | 'lunch' | 'dinner' | 'daily'): void {
    this.selectedMeal = meal;
    this.recalculateNutrients();
  }

  /**
   * Handle date change
   * @param newValue
   */
  onDateChange(newValue: Date): void {
    this.selectedDate = newValue ? new Date(newValue) : new Date();
    this.loadMeals();
  }

  /**
   * Handle food added
   * @param food
   */
  onFoodAdded(food: FoodItem): void {
    if (this.selectedMeal !== 'daily') {
      this.mealFoodItems[this.selectedMeal] = [...this.mealFoodItems[this.selectedMeal], food];
    }
    this.recalculateNutrients();
    this.saveMeal();
  }

  /**
   *
   * @param updatedFood
   */
  onQuantityChanged(updatedFood: FoodItem): void {
    if (this.selectedMeal !== 'daily') {
      this.mealFoodItems[this.selectedMeal] = this.mealFoodItems[this.selectedMeal].map((f) =>
        f.fdcId === updatedFood.fdcId ? { ...f, quantity: updatedFood.quantity } : f,
      );
    }
    this.recalculateNutrients();
    this.saveMeal();
  }

  private recalculateNutrients(): void {
    this.sumEssentialNutrients = this.foodService.sumEssentialNutrients(this.foodItems);
  }

  /**
   * Save meal to backend
   * @returns
   */
  private saveMeal(): void {
    if (!this.selectedDate) return;

    const dateIso = this.formatDateLocal(this.selectedDate);
    const meal: Meal = {
      id: this.foodItems[0]?.mealId || '', // ✅ keep existing id if available
      userId: this.authService.currentUserId!,
      name: this.selectedMeal,
      date: dateIso,
      items: this.foodItems.map((f) => ({
        fdcId: f.fdcId,
        quantity: f.quantity,
      })),
    };

    this.mealService.saveMeal(meal).subscribe({
      next: (savedMeal) => {
        if (
          savedMeal.id &&
          (this.selectedMeal === 'breakfast' || this.selectedMeal === 'lunch' || this.selectedMeal === 'dinner')
        ) {
          this.mealFoodItems[this.selectedMeal] = this.foodItems.map((f) => ({
            ...f,
            mealId: savedMeal.id,
          }));
        }
      },
      error: () => this.snackBar.open('❌ Failed to save meal', 'Close', { duration: 3000 }),
    });
  }

  /**
   * Format date to 'YYYY-MM-DD'
   * @param date
   * @returns
   */
  private formatDateLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Load meals for selected date
   */
  private loadMeals(): void {
    this.loading = true;
    const dateIso = this.formatDateLocal(this.selectedDate);

    this.loadSub?.unsubscribe();
    this.loadSub = this.mealService.getMealsByDate(dateIso).subscribe({
      next: (meals) => {
        this.mealFoodItems = meals;
        this.loading = false;
        this.recalculateNutrients();
      },
      error: () => {
        this.mealFoodItems = { breakfast: [], lunch: [], dinner: [] };
        this.loading = false;
      },
    });
  }

  /**
   * Set gender
   * @param value
   */
  setGender(value: 'men' | 'women'): void {
    this.gender = value;
    this.genderService.setGender(this.gender);
  }

  /**
   * Logout user
   */
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => this.snackBar.open('❌ Logout failed', 'Close', { duration: 3000 }),
    });
  }
}
