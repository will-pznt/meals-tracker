import { FoodItem } from './FoodItem';
import { FoodNutrient } from './FoodNutrient';

/** Minimal FoodNutrient builder — only nutrientName/unitName/value are read by the app's nutrient logic. */
function n(nutrientName: string, unitName: string, value: number): FoodNutrient {
  return {
    nutrientId: 0,
    nutrientName,
    nutrientNumber: '',
    rank: 0,
    indentLevel: 0,
    foodNutrientId: 0,
    unitName,
    value,
  };
}

/**
 * Realistic sample meals shown in demo mode, so visitors see a fully populated app.
 */
export const DEMO_MEAL_DATA: Record<'breakfast' | 'lunch' | 'dinner', FoodItem[]> = {
  breakfast: [
    {
      fdcId: 1001,
      description: 'Oatmeal, cooked with water',
      quantity: 200,
      mealId: 'demo-breakfast',
      foodNutrients: [
        n('Energy', 'kcal', 71),
        n('Protein', 'g', 2.5),
        n('Total lipid (fat)', 'g', 1.5),
        n('Carbohydrate, by difference', 'g', 12),
        n('Fiber, total dietary', 'g', 1.7),
        n('Iron, Fe', 'mg', 0.9),
        n('Magnesium, Mg', 'mg', 27),
      ],
    },
    {
      fdcId: 1002,
      description: 'Banana, raw',
      quantity: 120,
      mealId: 'demo-breakfast',
      foodNutrients: [
        n('Energy', 'kcal', 89),
        n('Potassium, K', 'mg', 358),
        n('Vitamin C, total ascorbic acid', 'mg', 8.7),
        n('Vitamin B-6', 'mg', 0.4),
        n('Carbohydrate, by difference', 'g', 23),
        n('Sugars, Total', 'g', 12),
      ],
    },
    {
      fdcId: 1003,
      description: 'Almonds, raw',
      quantity: 20,
      mealId: 'demo-breakfast',
      foodNutrients: [
        n('Energy', 'kcal', 116),
        n('Protein', 'g', 4.3),
        n('Total lipid (fat)', 'g', 10),
        n('Calcium, Ca', 'mg', 51),
        n('Magnesium, Mg', 'mg', 54),
        n('Vitamin E (alpha-tocopherol)', 'mg', 5),
      ],
    },
  ],
  lunch: [
    {
      fdcId: 2001,
      description: 'Chicken breast, grilled, skinless',
      quantity: 150,
      mealId: 'demo-lunch',
      foodNutrients: [
        n('Energy', 'kcal', 248),
        n('Protein', 'g', 46.5),
        n('Total lipid (fat)', 'g', 5.4),
        n('Iron, Fe', 'mg', 1.2),
        n('Zinc, Zn', 'mg', 1.4),
        n('Vitamin B-6', 'mg', 0.9),
        n('Vitamin B-12', 'µg', 0.5),
      ],
    },
    {
      fdcId: 2002,
      description: 'Brown rice, cooked',
      quantity: 150,
      mealId: 'demo-lunch',
      foodNutrients: [
        n('Energy', 'kcal', 165),
        n('Protein', 'g', 3.9),
        n('Carbohydrate, by difference', 'g', 34.5),
        n('Fiber, total dietary', 'g', 2.7),
        n('Magnesium, Mg', 'mg', 63),
      ],
    },
    {
      fdcId: 2003,
      description: 'Broccoli, steamed',
      quantity: 120,
      mealId: 'demo-lunch',
      foodNutrients: [
        n('Energy', 'kcal', 41),
        n('Fiber, total dietary', 'g', 3.3),
        n('Vitamin C, total ascorbic acid', 'mg', 74),
        n('Vitamin A, RAE', 'µg', 45),
        n('Vitamin K (phylloquinone)', 'µg', 141),
        n('Calcium, Ca', 'mg', 56),
        n('Potassium, K', 'mg', 361),
      ],
    },
  ],
  dinner: [
    {
      fdcId: 3001,
      description: 'Salmon, baked',
      quantity: 150,
      mealId: 'demo-dinner',
      foodNutrients: [
        n('Energy', 'kcal', 280),
        n('Protein', 'g', 39),
        n('Total lipid (fat)', 'g', 13),
        n('Vitamin D (D2 + D3)', 'µg', 14.5),
        n('Vitamin B-12', 'µg', 3.2),
        n('Potassium, K', 'mg', 490),
        n('Sodium, Na', 'mg', 75),
      ],
    },
    {
      fdcId: 3002,
      description: 'Sweet potato, roasted',
      quantity: 150,
      mealId: 'demo-dinner',
      foodNutrients: [
        n('Energy', 'kcal', 135),
        n('Carbohydrate, by difference', 'g', 31.5),
        n('Fiber, total dietary', 'g', 4.7),
        n('Vitamin A, RAE', 'µg', 1250),
        n('Vitamin C, total ascorbic acid', 'mg', 3.6),
        n('Potassium, K', 'mg', 543),
      ],
    },
    {
      fdcId: 3003,
      description: 'Spinach, sautéed',
      quantity: 90,
      mealId: 'demo-dinner',
      foodNutrients: [
        n('Energy', 'kcal', 23),
        n('Iron, Fe', 'mg', 3.6),
        n('Calcium, Ca', 'mg', 99),
        n('Magnesium, Mg', 'mg', 79),
        n('Vitamin A, RAE', 'µg', 469),
        n('Vitamin K (phylloquinone)', 'µg', 483),
        n('Sodium, Na', 'mg', 70),
      ],
    },
  ],
};
