import { TitleCasePipe } from '@angular/common';
import { Component, computed, effect, inject, linkedSignal, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, concatMap, EMPTY, Subject } from 'rxjs';

import { FoodItem } from '../../data-models/FoodItem';
import { FoodItemStored, MEAL_NAMES, MealName } from '../../data-models/Meal';
import { DEFAULT_QUANTITY_GRAMS, sumEssentialNutrients } from '../../nutrition/nutrient-totals';
import { GenderService } from '../../service/gender.service';
import { DayMeals, EMPTY_DAY, MealService } from '../../service/meal.service';
import { DailyRequirementsComponent } from '../daily-requirements/daily-requirements.component';
import { MealDisplayComponent } from '../meal-display/meal-display.component';

export type MealTab = MealName | 'daily';

interface PendingSave {
  date: string;
  name: MealName;
  items: FoodItemStored[];
}

export function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Component({
  selector: 'app-meal-selector',
  imports: [
    MealDisplayComponent,
    DailyRequirementsComponent,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    MatProgressSpinnerModule,
    TitleCasePipe,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './meal-planner.component.html',
  styleUrl: './meal-planner.component.scss',
})
export class MealPlannerComponent {
  private mealService = inject(MealService);
  private genderService = inject(GenderService);
  private snackBar = inject(MatSnackBar);

  protected readonly mealTabs: readonly MealTab[] = [...MEAL_NAMES, 'daily'];

  readonly selectedMeal = signal<MealTab>('breakfast');
  readonly selectedDate = signal(new Date());
  readonly gender = this.genderService.gender;
  readonly dateKey = computed(() => formatDateLocal(this.selectedDate()));

  private readonly mealsResource = rxResource({
    params: () => this.dateKey(),
    stream: ({ params }) => this.mealService.getMealsByDate(params),
  });

  readonly mealFoodItems = linkedSignal<DayMeals>(() =>
    this.mealsResource.hasValue() ? this.mealsResource.value() : EMPTY_DAY,
  );

  readonly loading = this.mealsResource.isLoading;

  readonly currentItems = computed<FoodItem[]>(() => {
    const meal = this.selectedMeal();
    return meal === 'daily' ? [] : this.mealFoodItems()[meal];
  });

  readonly mealNutrients = computed(() => sumEssentialNutrients(this.currentItems()));

  private readonly saves = new Subject<PendingSave>();

  constructor() {
    this.saves
      .pipe(
        concatMap(({ date, name, items }) =>
          this.mealService.saveMeal(date, name, items).pipe(
            catchError(() => {
              this.notify('❌ Failed to save meal');
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe();

    effect(() => {
      if (this.mealsResource.error()) this.notify('❌ Failed to load meals');
    });
  }

  selectMeal(meal: MealTab): void {
    this.selectedMeal.set(meal);
  }

  onDateChange(newValue: Date | null): void {
    this.selectedDate.set(newValue ? new Date(newValue) : new Date());
  }

  setGender(value: 'men' | 'women'): void {
    this.genderService.setGender(value);
  }

  onFoodAdded(food: FoodItem): void {
    const meal = this.selectedMeal();
    if (meal === 'daily') return;

    if (this.mealFoodItems()[meal].some((f) => f.fdcId === food.fdcId)) {
      this.notify('ℹ️ This food is already in the meal');
      return;
    }

    this.updateMeal(meal, (items) => [...items, { ...food, quantity: food.quantity ?? DEFAULT_QUANTITY_GRAMS }]);
  }

  onQuantityChanged(updatedFood: FoodItem): void {
    const meal = this.selectedMeal();
    if (meal === 'daily') return;
    if (!this.mealFoodItems()[meal].some((f) => f.fdcId === updatedFood.fdcId)) return;

    this.updateMeal(meal, (items) =>
      items.map((f) => (f.fdcId === updatedFood.fdcId ? { ...f, quantity: updatedFood.quantity } : f)),
    );
  }

  onFoodDeleted(food: FoodItem): void {
    const meal = this.selectedMeal();
    if (meal === 'daily') return;

    this.updateMeal(meal, (items) => items.filter((f) => f.fdcId !== food.fdcId));
  }

  private updateMeal(meal: MealName, change: (items: FoodItem[]) => FoodItem[]): void {
    const items = change(this.mealFoodItems()[meal]);
    this.mealFoodItems.update((all) => ({ ...all, [meal]: items }));
    this.saves.next({
      date: this.dateKey(),
      name: meal,
      items: items.map((f) => ({ fdcId: f.fdcId, quantity: f.quantity ?? DEFAULT_QUANTITY_GRAMS })),
    });
  }

  private notify(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }
}
