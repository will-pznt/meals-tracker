import { Component, computed, inject, output, resource, signal } from '@angular/core';
import { debounce, form, FormField } from '@angular/forms/signals';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom } from 'rxjs';

import { FoodItem } from '../../data-models/FoodItem';
import { FoodService } from '../../service/food.service';

interface SearchData {
  query: string;
}

@Component({
  selector: 'app-food-search',
  templateUrl: './food-search.component.html',
  styleUrls: ['./food-search.component.scss'],
  imports: [FormField, MatAutocompleteModule, MatFormFieldModule, MatProgressSpinnerModule, MatInputModule, MatIconModule],
})
export class FoodSearchComponent {
  private foodService = inject(FoodService);

  readonly foodSelected = output<FoodItem>();

  searchModel = signal<SearchData>({ query: '' });

  searchForm = form(this.searchModel, (s) => {
    debounce(s.query, 300);
  });

  private searchResource = resource({
    params: () => this.searchModel().query.trim(),
    loader: async ({ params: query }) => {
      if (!query) return [];
      try {
        return await firstValueFrom(this.foodService.searchFoods(query));
      } catch {
        return [];
      }
    },
  });

  readonly filteredFoods = computed(() => this.searchResource.value() ?? []);
  readonly loading = this.searchResource.isLoading;

  displayFn(food: FoodItem): string {
    return food.description || '';
  }

  /**
   * Handle food selection from autocomplete
   * @param food
   */
  selectFood(food: FoodItem): void {
    food.quantity = 100;
    this.foodSelected.emit(food);
    this.searchModel.set({ query: '' });
  }
}
