import { ESSENTIAL_NUTRIENTS_DATA } from '../data-models/ESSENTIAL_NUTRIENTS_DATA';
import { FoodItem } from '../data-models/FoodItem';
import { FoodNutrient } from '../data-models/FoodNutrient';
import { FoodNutrientParsed } from '../data-models/FoodNutrientParsed';

export const DEFAULT_QUANTITY_GRAMS = 100;

const UNIT_ALIASES: Record<string, string> = {
  ug: 'µg',
  mcg: 'µg',
  µg: 'µg',
  μg: 'µg',
};

const MASS_IN_MG: Record<string, number> = {
  µg: 0.001,
  mg: 1,
  g: 1000,
  kg: 1_000_000,
};

const KJ_PER_KCAL = 4.184;

export function normalizeUnit(unit: string): string {
  const lower = unit.trim().toLowerCase();
  return UNIT_ALIASES[lower] ?? lower;
}

export function convertNutrientValue(value: number, unit: string | undefined, definition: FoodNutrientParsed): number {
  if (!value || !unit) return 0;

  let amount = value;
  let from = normalizeUnit(unit);
  const legacy = definition.legacyConversion;
  if (legacy && from === normalizeUnit(legacy.fromUnit)) {
    amount = legacy.formula(amount);
    from = normalizeUnit(legacy.toUnit);
  }

  const to = normalizeUnit(definition.unitName);
  if (from === to) return amount;
  if (from === 'kj' && to === 'kcal') return amount / KJ_PER_KCAL;
  if (from === 'kcal' && to === 'kj') return amount * KJ_PER_KCAL;
  if (from in MASS_IN_MG && to in MASS_IN_MG) return (amount * MASS_IN_MG[from]) / MASS_IN_MG[to];
  return 0;
}

export function findNutrient(
  nutrients: readonly FoodNutrient[],
  definition: FoodNutrientParsed,
): FoodNutrient | undefined {
  for (const number of definition.nutrientNumbers) {
    const match = nutrients.find((n) => n.nutrientNumber === number);
    if (match) return match;
  }
  return undefined;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function sumEssentialNutrients(
  foodItems: readonly FoodItem[],
  definitions: readonly FoodNutrientParsed[] = ESSENTIAL_NUTRIENTS_DATA,
): FoodNutrientParsed[] {
  return definitions.map((definition) => {
    let total = 0;
    for (const item of foodItems) {
      const nutrient = findNutrient(item.foodNutrients ?? [], definition);
      if (!nutrient) continue;
      const per100g = convertNutrientValue(nutrient.value, nutrient.unitName, definition);
      total += (per100g * (item.quantity ?? DEFAULT_QUANTITY_GRAMS)) / 100;
    }
    return { ...definition, value: round2(total) };
  });
}

export function dailyTarget(nutrient: FoodNutrientParsed, gender: 'men' | 'women'): number {
  return (gender === 'men' ? nutrient.dailyValueMen : nutrient.dailyValueWomen) ?? 0;
}
