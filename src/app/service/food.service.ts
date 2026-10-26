import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { map, Observable } from 'rxjs';

import { FoodItem } from '../data-models/FoodItem';
import { UsdaFoodDetail, UsdaSearchResponse } from '../data-models/UsdaApi';
import { DEFAULT_QUANTITY_GRAMS } from '../nutrition/nutrient-totals';

@Service()
export class FoodService {
  private http = inject(HttpClient);

  private readonly baseUrl = '/api/foods';

  searchFoods(query: string): Observable<FoodItem[]> {
    return this.http
      .get<UsdaSearchResponse>(`${this.baseUrl}/search`, { params: { q: query } })
      .pipe(map((res) => (res.foods ?? []).map((food) => ({ ...food, quantity: DEFAULT_QUANTITY_GRAMS }))));
  }

  getFoodDetails(fdcId: number): Observable<UsdaFoodDetail> {
    return this.http.get<UsdaFoodDetail>(`${this.baseUrl}/${fdcId}`);
  }
}
