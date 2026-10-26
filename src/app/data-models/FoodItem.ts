import { FoodNutrient } from './FoodNutrient';

export interface FoodItem {
  fdcId: number;
  description?: string;
  commonNames?: string;
  additionalDescriptions?: string;
  derivationCode?: string;
  scientificName?: string;
  ndbNumber?: number;
  dataType?: string;
  foodCode?: number;
  publishedDate?: string;
  foodCategory?: string;
  foodCategoryId?: number;
  allHighlightFields?: string;
  mostRecentAcquisitionDate?: string;
  score?: number;
  foodNutrients?: FoodNutrient[];
  quantity?: number;
}
