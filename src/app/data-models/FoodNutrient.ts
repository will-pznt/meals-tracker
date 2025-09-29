export interface FoodNutrient {
  nutrientId: number;
  nutrientName: string;
  nutrientNumber: string;
  derivationCode?: string;
  derivationDescription?: string;
  derivationId?: number;
  foodNutrientSourceId?: number;
  foodNutrientSourceCode?: string;
  foodNutrientSourceDescription?: string;
  rank: number;
  indentLevel: number;
  foodNutrientId: number;
  unitName: string;
  value: number;
  dataPoints?: number;
  min?: number;
  max?: number;
  median?: number;
}
