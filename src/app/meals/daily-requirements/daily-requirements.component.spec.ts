import { TestBed } from '@angular/core/testing';

import { buildRecommendations, DailyRequirementsComponent } from './daily-requirements.component';
import { ESSENTIAL_NUTRIENTS_DATA } from '../../data-models/ESSENTIAL_NUTRIENTS_DATA';
import { FoodNutrientParsed } from '../../data-models/FoodNutrientParsed';
import { GenderService } from '../../service/gender.service';

function withValue(name: string, value: number): FoodNutrientParsed {
  return { ...ESSENTIAL_NUTRIENTS_DATA.find((n) => n.nutrientName === name)!, value };
}

describe('buildRecommendations', () => {
  const foods = [
    { nutrientName: 'Iron, Fe', foodName: 'Lentils' },
    { nutrientName: 'Protein', foodName: 'Eggs' },
  ];

  it('only recommends nutrients below 70% of the target', () => {
    const result = buildRecommendations([withValue('Protein', 90), withValue('Iron, Fe', 5)], 'men', foods);
    expect(result.map((r) => r.nutrient.nutrientName)).toEqual(['Iron, Fe']);
  });

  it('sorts the most lacking nutrients first', () => {
    const result = buildRecommendations([withValue('Protein', 50), withValue('Iron, Fe', 0)], 'men', foods);
    expect(result.map((r) => r.nutrient.nutrientName)).toEqual(['Iron, Fe', 'Protein']);
  });

  it('uses the gender-specific target', () => {
    const iron = [withValue('Iron, Fe', 7)];
    expect(buildRecommendations(iron, 'men', foods)).toHaveLength(0);
    expect(buildRecommendations(iron, 'women', foods)).toHaveLength(1);
  });

  it('attaches suggested foods for each nutrient', () => {
    const [rec] = buildRecommendations([withValue('Iron, Fe', 0)], 'men', foods);
    expect(rec.foods).toEqual(['Lentils']);
  });

  it('never recommends eating more of a nutrient that is a limit', () => {
    const result = buildRecommendations([withValue('Sodium, Na', 0), withValue('Sugars, Total', 0)], 'men', foods);
    expect(result).toEqual([]);
  });

  it('has suggested foods for every essential nutrient that is a target', () => {
    const empty = ESSENTIAL_NUTRIENTS_DATA.map((n) => ({ ...n, value: 0 }));
    const result = buildRecommendations(empty, 'men');
    expect(result.length).toBe(ESSENTIAL_NUTRIENTS_DATA.filter((n) => !n.isLimit).length);
    for (const rec of result) expect(rec.foods.length).toBeGreaterThan(0);
  });
});

describe('DailyRequirementsComponent', () => {
  it('sums all meals and reacts to the target profile', async () => {
    const fixture = TestBed.createComponent(DailyRequirementsComponent);
    const iron = [{ nutrientNumber: '303', unitName: 'MG', value: 5 } as never];
    fixture.componentRef.setInput('mealFoodItems', {
      breakfast: [{ fdcId: 1, quantity: 100, foodNutrients: iron }],
      lunch: [{ fdcId: 2, quantity: 50, foodNutrients: iron }],
      dinner: [],
    });
    await fixture.whenStable();

    const component = fixture.componentInstance;
    expect(component.dailyNutrients().find((n) => n.nutrientName === 'Iron, Fe')?.value).toBe(7.5);
    expect(component.lowNutrientsRecommendations().some((r) => r.nutrient.nutrientName === 'Iron, Fe')).toBe(false);

    TestBed.inject(GenderService).setGender('women');
    expect(component.lowNutrientsRecommendations().some((r) => r.nutrient.nutrientName === 'Iron, Fe')).toBe(true);
  });
});
