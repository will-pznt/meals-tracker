export interface FoodNutrientParsed {
  nutrientName: string;
  label: string;
  value: number;
  unitName: string;
  aliases: string[];
  dailyValueMen?: number;
  dailyValueWomen?: number;
  legacyConversion?: {
    fromUnit: string;
    toUnit: string;
    formula: (val: number) => number;
  };
}
