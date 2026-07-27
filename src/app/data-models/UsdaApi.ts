import { FoodItem } from './FoodItem';

/** Raw response shape from the USDA `/foods/search` endpoint. */
export interface UsdaSearchResponse {
  foods: FoodItem[];
}

/** A single nutrient entry as returned by the USDA `/food/{fdcId}` detail endpoint. */
export interface UsdaDetailNutrient {
  id: number;
  amount?: number;
  nutrient: {
    id: number;
    name: string;
    number: string;
    rank: number;
    unitName: string;
  };
}

/** Raw response shape from the USDA `/food/{fdcId}` detail endpoint. */
export interface UsdaFoodDetail {
  fdcId: number;
  description?: string;
  foodNutrients?: UsdaDetailNutrient[];
}
