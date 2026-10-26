import { Component, computed, inject, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { debounce, form, FormField } from '@angular/forms/signals';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { catchError, of } from 'rxjs';

import { FoodItem } from '../../data-models/FoodItem';
import { DEFAULT_QUANTITY_GRAMS } from '../../nutrition/nutrient-totals';
import { FoodService } from '../../service/food.service';

interface SearchData {
  query: string;
}

export const SEARCH_DEBOUNCE_MS = 300;

@Component({
  selector: 'app-food-search',
  templateUrl: './food-search.component.html',
  styleUrls: ['./food-search.component.scss'],
  imports: [
    FormField,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatIconModule,
  ],
})
export class FoodSearchComponent {
  private foodService = inject(FoodService);

  readonly foodSelected = output<FoodItem>();

  readonly searchModel = signal<SearchData>({ query: '' });

  readonly searchForm = form(this.searchModel, (s) => {
    debounce(s.query, SEARCH_DEBOUNCE_MS);
  });

  private readonly searchResource = rxResource({
    params: () => this.searchModel().query.trim() || undefined,
    stream: ({ params: query }) => this.foodService.searchFoods(query).pipe(catchError(() => of<FoodItem[]>([]))),
    defaultValue: [],
  });

  readonly filteredFoods = computed(() => this.searchResource.value());
  readonly loading = this.searchResource.isLoading;

  displayFn(food: FoodItem | string | null): string {
    return typeof food === 'string' ? food : (food?.description ?? '');
  }

  selectFood(food: FoodItem): void {
    this.foodSelected.emit({ ...food, quantity: DEFAULT_QUANTITY_GRAMS });
    this.searchModel.set({ query: '' });
  }
}
