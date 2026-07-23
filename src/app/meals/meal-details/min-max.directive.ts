import { Directive, ElementRef, HostListener, inject, input } from '@angular/core';

@Directive({
  selector: '[minMax]',
})
export class MinMaxDirective {
  private ref = inject(ElementRef);

  public readonly min = input.required<number>();

  public readonly max = input.required<number>();

  @HostListener('input')
  public onInput(): void {
    let val = parseInt(this.ref.nativeElement.value);
    const max = this.max();
    const min = this.min();
    if (max !== null && max !== undefined && val >= max) this.ref.nativeElement.value = max.toString();
    else if (min !== null && min !== undefined && val <= min) this.ref.nativeElement.value = min.toString();
  }
}
