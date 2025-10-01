import { Directive, Input, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[minMax]',
  standalone: true,
})
export class MinMaxDirective {
  @Input()
  public min!: number;

  @Input()
  public max!: number;

  constructor(private ref: ElementRef) {}

  @HostListener('input', ['$event'])
  public onInput(): void {
    let val = parseInt(this.ref.nativeElement.value);
    if (this.max !== null && this.max !== undefined && val >= this.max)
      this.ref.nativeElement.value = this.max.toString();
    else if (this.min !== null && this.min !== undefined && val <= this.min)
      this.ref.nativeElement.value = this.min.toString();
  }
}
