import {
  convertNutrientValue,
  dailyTarget,
  findNutrient,
  normalizeUnit,
  sumEssentialNutrients,
} from './nutrient-totals';
import { FoodItem } from '../data-models/FoodItem';
import { FoodNutrient } from '../data-models/FoodNutrient';
import { FoodNutrientParsed } from '../data-models/FoodNutrientParsed';

function nutrient(nutrientNumber: string, unitName: string, value: number, nutrientName = ''): FoodNutrient {
  return { nutrientId: 0, nutrientName, nutrientNumber, unitName, value, rank: 0, indentLevel: 0, foodNutrientId: 0 };
}

function food(fdcId: number, quantity: number | undefined, foodNutrients: FoodNutrient[]): FoodItem {
  return { fdcId, quantity, foodNutrients };
}

function totalFor(result: FoodNutrientParsed[], name: string): number {
  return result.find((n) => n.nutrientName === name)!.value;
}

const vitaminD: FoodNutrientParsed = {
  nutrientName: 'Vitamin D',
  label: 'Vit D',
  unitName: 'µg',
  nutrientNumbers: ['328', '324'],
  value: 0,
  legacyConversion: { fromUnit: 'IU', toUnit: 'µg', formula: (v) => v * 0.025 },
};

const magnesium: FoodNutrientParsed = {
  nutrientName: 'Magnesium',
  label: 'Mg',
  unitName: 'mg',
  nutrientNumbers: ['304'],
  value: 0,
};

const energy: FoodNutrientParsed = {
  nutrientName: 'Energy',
  label: 'Energy',
  unitName: 'kcal',
  nutrientNumbers: ['208', '957', '958'],
  value: 0,
  dailyValueMen: 2500,
  dailyValueWomen: 2000,
};

describe('normalizeUnit', () => {
  it.each([
    ['UG', 'µg'],
    ['mcg', 'µg'],
    ['μg', 'µg'],
    [' MG ', 'mg'],
    ['KCAL', 'kcal'],
  ])('maps %s to %s', (input, expected) => {
    expect(normalizeUnit(input)).toBe(expected);
  });
});

describe('convertNutrientValue', () => {
  it('returns the value unchanged when units already match', () => {
    expect(convertNutrientValue(12, 'MG', magnesium)).toBe(12);
  });

  it('converts between mass units in both directions', () => {
    expect(convertNutrientValue(2, 'g', magnesium)).toBe(2000);
    expect(convertNutrientValue(500, 'UG', magnesium)).toBeCloseTo(0.5);
    expect(convertNutrientValue(0.01, 'mg', vitaminD)).toBeCloseTo(10);
  });

  it('converts kJ to kcal', () => {
    expect(convertNutrientValue(418.4, 'kJ', energy)).toBeCloseTo(100);
  });

  it('applies the legacy IU conversion when the unit matches', () => {
    expect(convertNutrientValue(400, 'IU', vitaminD)).toBeCloseTo(10);
  });

  it('returns 0 for missing values, missing units and incompatible units', () => {
    expect(convertNutrientValue(0, 'mg', magnesium)).toBe(0);
    expect(convertNutrientValue(5, undefined, magnesium)).toBe(0);
    expect(convertNutrientValue(5, 'IU', magnesium)).toBe(0);
    expect(convertNutrientValue(5, 'kcal', magnesium)).toBe(0);
  });
});

describe('findNutrient', () => {
  it('prefers nutrient numbers in definition order', () => {
    const nutrients = [nutrient('958', 'KCAL', 90), nutrient('957', 'KCAL', 95)];
    expect(findNutrient(nutrients, energy)?.value).toBe(95);
  });

  it('returns undefined when no number matches', () => {
    expect(findNutrient([nutrient('999', 'G', 1)], energy)).toBeUndefined();
  });

  it('ignores the kJ energy entry because it uses a different number', () => {
    const nutrients = [nutrient('268', 'KJ', 1000), nutrient('208', 'KCAL', 240)];
    expect(findNutrient(nutrients, energy)?.value).toBe(240);
  });
});

describe('sumEssentialNutrients', () => {
  it('returns every definition with a zero value for an empty meal', () => {
    const result = sumEssentialNutrients([], [energy, magnesium]);
    expect(result.map((n) => n.value)).toEqual([0, 0]);
  });

  it('scales per-100g values by quantity and sums across foods', () => {
    const items = [
      food(1, 200, [nutrient('208', 'KCAL', 50), nutrient('304', 'MG', 10)]),
      food(2, 50, [nutrient('208', 'KCAL', 300)]),
    ];
    const result = sumEssentialNutrients(items, [energy, magnesium]);
    expect(totalFor(result, 'Energy')).toBe(250);
    expect(totalFor(result, 'Magnesium')).toBe(20);
  });

  it('defaults to 100 g when the quantity is missing', () => {
    const result = sumEssentialNutrients([food(1, undefined, [nutrient('208', 'KCAL', 123)])], [energy]);
    expect(totalFor(result, 'Energy')).toBe(123);
  });

  it('uses Atwater energy for Foundation foods that have no 208 entry', () => {
    const result = sumEssentialNutrients([food(1, 100, [nutrient('957', 'KCAL', 61)])], [energy]);
    expect(totalFor(result, 'Energy')).toBe(61);
  });

  it('normalises units before summing', () => {
    const items = [food(1, 100, [nutrient('328', 'UG', 2)]), food(2, 100, [nutrient('324', 'IU', 400)])];
    const result = sumEssentialNutrients(items, [vitaminD]);
    expect(totalFor(result, 'Vitamin D')).toBe(12);
  });

  it('rounds totals to two decimals', () => {
    const result = sumEssentialNutrients([food(1, 33, [nutrient('304', 'MG', 1)])], [magnesium]);
    expect(totalFor(result, 'Magnesium')).toBe(0.33);
  });

  it('does not mutate the definitions it is given', () => {
    sumEssentialNutrients([food(1, 100, [nutrient('208', 'KCAL', 100)])], [energy]);
    expect(energy.value).toBe(0);
  });

  it('works with the built-in definitions', () => {
    const result = sumEssentialNutrients([food(1, 150, [nutrient('203', 'G', 31)])]);
    expect(totalFor(result, 'Protein')).toBe(46.5);
  });
});

describe('dailyTarget', () => {
  it('returns the gender-specific target', () => {
    expect(dailyTarget(energy, 'men')).toBe(2500);
    expect(dailyTarget(energy, 'women')).toBe(2000);
  });

  it('returns 0 when no target is defined', () => {
    expect(dailyTarget(magnesium, 'men')).toBe(0);
  });
});
