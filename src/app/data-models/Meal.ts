export type MealName = 'breakfast' | 'lunch' | 'dinner';

export const MEAL_NAMES: readonly MealName[] = ['breakfast', 'lunch', 'dinner'];

export interface Meal {
  id: string;
  name: MealName;
  date: string;
  items: FoodItemStored[];
}

export interface FoodItemStored {
  fdcId: number;
  quantity: number;
}
