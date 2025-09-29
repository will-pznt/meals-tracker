import { FoodNutrient } from './FoodNutrient';

export interface Meal {
  id: string; // Firestore document id
  userId: string; // Firebase user id (who owns the meal)
  name: string; // e.g. "Daily meals" or a label
  date: string; // stored as "YYYY-MM-DD" for easy querying
  items: FoodItemStored[]; // list of FDC food items
}

export interface FoodItemStored {
  fdcId: number; // USDA FoodData Central id
  quantity?: number; // optional: grams, servings, etc.
  description?: string;
  essentialNutrients?: FoodNutrient[]; // stored nutrients for the food item
}
