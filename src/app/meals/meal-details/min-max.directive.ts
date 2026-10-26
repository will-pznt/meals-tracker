import { Directive, ElementRef, inject, input, output } from '@angular/core';

export function clampQuantity(raw: string, min: number, max: number): number | null {
  const value = Number.parseInt(raw, 10);
  if (Number.isNaN(value)) return null;
  return Math.min(max, Math.max(min, value));
}

@Directive({
  selector: 'input[appMinMax]',
  host: {
    '[attr.min]': 'min()',
    '[attr.max]': 'max()',
    '(input)': 'onInput()',
  },
})
export class MinMaxDirective {
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef);

  readonly min = input.required<number>();
  readonly max = input.required<number>();
  readonly clampedValue = output<number>();

  onInput(): void {
    const input = this.el.nativeElement;
    const clamped = clampQuantity(input.value, this.min(), this.max());
    if (clamped === null) return;
    if (String(clamped) !== input.value) input.value = String(clamped);
    this.clampedValue.emit(clamped);
  }
}
