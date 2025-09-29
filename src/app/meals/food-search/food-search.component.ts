import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  filter,
  Observable,
  of,
  tap,
  finalize,
  catchError,
  startWith,
} from 'rxjs';

import { FoodItem } from '../../data-models/FoodItem';
import { FoodService } from '../../service/food.service';

@Component({
  selector: 'app-food-search',
  templateUrl: './food-search.component.html',
  styleUrls: ['./food-search.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatIconModule,
  ],
})
export class FoodSearchComponent implements OnInit {
  private foodService = inject(FoodService);

  @Output() foodSelected = new EventEmitter<FoodItem>();

  searchControl = new FormControl('');
  filteredFoods$: Observable<FoodItem[]> = of([]);
  loading = false;

  constructor() {}

  ngOnInit(): void {
    this.filteredFoods$ = this.searchControl.valueChanges.pipe(
      filter((value): value is string => value !== null),
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => (this.loading = true)),
      switchMap((query) =>
        this.foodService.searchFoods(query.trim()).pipe(
          finalize(() => (this.loading = false)),
          catchError(() => {
            this.loading = false;
            return of([]);
          }),
        ),
      ),
      startWith([]),
    );
  }

  displayFn(food: FoodItem): string {
    return food.description || '';
  }

  selectFood(food: FoodItem): void {
    food.quantity = 100;
    this.foodSelected.emit(food);
    this.searchControl.setValue('');
  }
}
