export interface FoodNutrientParsed {
  nutrientName: string;
  label: string;
  value: number;
  unitName: string;
  nutrientNumbers: string[];
  dailyValueMen?: number;
  dailyValueWomen?: number;
  isLimit?: boolean;
  legacyConversion?: {
    fromUnit: string;
    toUnit: string;
    formula: (val: number) => number;
  };
}
