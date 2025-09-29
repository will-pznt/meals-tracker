import { FoodNutrientParsed } from './FoodNutrientParsed';

export interface NutrientRecommendation {
  nutrient: FoodNutrientParsed;
  foods: string[];
}
