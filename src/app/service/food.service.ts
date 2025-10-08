import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';

import { ESSENTIAL_NUTRIENTS_DATA } from '../data-models/ESSENTIAL_NUTRIENTS_DATA';
import { FoodItem } from '../data-models/FoodItem';
import { FoodNutrientParsed } from '../data-models/FoodNutrientParsed';

@Injectable({
  providedIn: 'root',
})
export class FoodService {
  private http = inject(HttpClient);

  private BASE = '/api/foods';

  constructor() {}

  /** Searches for foods using the provided query string.
   * Each returned food item is assigned a default quantity of 100 grams.
   * @param query The search query string.
   * @returns An Observable emitting an array of FoodItem objects.
   */
  searchFoods(query: string): Observable<FoodItem[]> {
    return this.http.get<any>(`${this.BASE}/search`, { params: { q: query } }).pipe(
      map((res) =>
        res.foods.map((food: any) => ({
          ...food,
          quantity: 100,
        })),
      ),
    );
  }

  /** Fetches detailed information for a specific food item by its FDC ID.
   * @param fdcId The FDC ID of the food item.
   * @returns An Observable emitting the detailed food item data.
   */
  getFoodDetails(fdcId: number): Observable<any> {
    return this.http.get<any>(`${this.BASE}/${fdcId}`);
  }

  /**
   * Normalizes a nutrient value to the unit defined in ESSENTIAL_NUTRIENTS_DATA.
   * Automatically handles:
   * - Legacy conversions (IU → µg/mg) if legacyConversion is defined
   * - Energy units (kJ → kcal)
   * - Mass units (mg ↔ µg, g ↔ g)
   * - Ensures numeric output
   */
  private normalizeNutrientValue(
    value: number,
    unit: string | undefined,
    nutrientDef: FoodNutrientParsed,
  ): { value: number; unit: string } {
    if (!value || !unit) return { value: 0, unit: nutrientDef.unitName };

    unit = unit.trim();

    // --- Apply legacy conversion formula if defined and units match ---
    if (nutrientDef.legacyConversion && unit === nutrientDef.legacyConversion.fromUnit) {
      value = nutrientDef.legacyConversion.formula(value);
      unit = nutrientDef.legacyConversion.toUnit;
    }

    // --- Energy: kJ → kcal ---
    if (unit.toLowerCase() === 'kj' && nutrientDef.unitName.toLowerCase() === 'kcal') {
      value = value / 4.184;
      unit = 'kcal';
    }

    // --- Mass normalization (mg ↔ µg) ---
    const unitLower = unit.toLowerCase();
    const targetLower = nutrientDef.unitName.toLowerCase();

    if (unitLower === 'mg' && targetLower === 'µg') value *= 1000;
    else if (unitLower === 'µg' && targetLower === 'mg') value /= 1000;
    else if (unitLower === 'g' && targetLower === 'g')
      value = value; // g → g no change
    else if (unitLower === 'kg' && targetLower === 'g') value *= 1000;

    // Return normalized value with the target unit
    return { value, unit: nutrientDef.unitName };
  }

  /** Sums the essential nutrients across a list of food items, scaling each nutrient by the food item's quantity.
   * If a food item does not specify a quantity, it defaults to 100 grams.
   * @param foodItems An array of FoodItem objects to sum nutrients from.
   * @returns An array of FoodNutrientParsed objects representing the summed essential nutrients.
   */
  sumEssentialNutrients(foodItems: FoodItem[]): FoodNutrientParsed[] {
    const summedNutrients = ESSENTIAL_NUTRIENTS_DATA.map((n) => ({ ...n, value: 0 }));

    for (const item of foodItems) {
      const quantity = item.quantity ?? 100;

      const exactMatches: { nutrient: any; match: FoodNutrientParsed }[] = [];
      const aliasCandidates: { nutrient: any; match: FoodNutrientParsed }[] = [];

      for (const nutrient of item.foodNutrients || []) {
        if (!nutrient.nutrientName) continue;

        // --- Only take kcal for Energy, skip kJ ---
        if (nutrient.nutrientName.toLowerCase().includes('energy') && nutrient.unitName?.toLowerCase() === 'kj') {
          continue;
        }

        const nutrientNameLower = nutrient.nutrientName.toLowerCase().trim();

        const exactMatch = summedNutrients.find((en) => en.nutrientName.toLowerCase().trim() === nutrientNameLower);
        if (exactMatch) {
          exactMatches.push({ nutrient, match: exactMatch });
          continue;
        }

        const aliasMatch = summedNutrients.find((en) =>
          (en.aliases ?? []).some((alias) => alias.toLowerCase().trim() === nutrientNameLower),
        );
        if (aliasMatch) aliasCandidates.push({ nutrient, match: aliasMatch });
      }

      // --- Apply exact matches first ---
      for (const { nutrient, match } of exactMatches) {
        const { value } = this.normalizeNutrientValue(nutrient.value || 0, nutrient.unitName, match);
        const increment = (value * quantity) / 100;
        match.value += increment;
      }

      // --- Apply aliases only if no exact match exists ---
      for (const { nutrient, match } of aliasCandidates) {
        const alreadyMatched = exactMatches.some((em) => em.match.nutrientName === match.nutrientName);
        if (alreadyMatched) continue;

        const { value } = this.normalizeNutrientValue(nutrient.value || 0, nutrient.unitName, match);
        const increment = (value * quantity) / 100;
        match.value += increment;
      }
    }

    // --- Round values ---
    for (const nutrient of summedNutrients) {
      nutrient.value = parseFloat(nutrient.value.toFixed(2));
    }

    return summedNutrients;
  }
}
