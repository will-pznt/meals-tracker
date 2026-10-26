import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NutrientsComponent } from './nutrients.component';
import { FoodNutrientParsed } from '../../data-models/FoodNutrientParsed';
import { GenderService } from '../../service/gender.service';

describe('NutrientsComponent', () => {
  let fixture: ComponentFixture<NutrientsComponent>;

  const nutrients: FoodNutrientParsed[] = [
    {
      nutrientName: 'Energy',
      label: 'Energy',
      unitName: 'kcal',
      nutrientNumbers: ['208'],
      value: 1250,
      dailyValueMen: 2500,
      dailyValueWomen: 2000,
    },
    {
      nutrientName: 'Iron, Fe',
      label: 'Iron',
      unitName: 'mg',
      nutrientNumbers: ['303'],
      value: 20,
      dailyValueMen: 8,
      dailyValueWomen: 18,
    },
    { nutrientName: 'Unknown', label: 'Other', unitName: 'g', nutrientNumbers: [], value: 3 },
    {
      nutrientName: 'Sodium, Na',
      label: 'Sodium',
      unitName: 'mg',
      nutrientNumbers: ['307'],
      value: 100,
      dailyValueMen: 2000,
      dailyValueWomen: 2000,
      isLimit: true,
    },
  ];

  beforeEach(async () => {
    fixture = TestBed.createComponent(NutrientsComponent);
    fixture.componentRef.setInput('nutrients', nutrients);
    await fixture.whenStable();
  });

  it('computes percentages, caps them at 100 and flags excess intake', () => {
    const [energy, iron, other, sodium] = fixture.componentInstance.rows();
    expect(energy).toEqual(expect.objectContaining({ percent: 50, target: 2500, over: false, low: false, icon: '⚡' }));
    expect(iron).toEqual(expect.objectContaining({ percent: 100, over: true }));
    expect(other).toEqual(expect.objectContaining({ percent: 0, target: 0, over: false, icon: '❓' }));
    expect(sodium).toEqual(expect.objectContaining({ percent: 5, low: false, isLimit: true }));
  });

  it('switches targets with the selected profile', async () => {
    TestBed.inject(GenderService).setGender('women');
    await fixture.whenStable();
    expect(fixture.componentInstance.rows()[0].percent).toBe(63);
    expect(fixture.nativeElement.textContent).toContain('1250 / 2000');
  });

  it('labels limits and exposes each bar as an accessible progress bar', () => {
    const bars = fixture.nativeElement.querySelectorAll('[role="progressbar"]');
    expect(bars).toHaveLength(4);
    expect(bars[0].getAttribute('aria-valuenow')).toBe('50');
    expect(fixture.nativeElement.textContent).toContain('(mg, max)');
  });
});
