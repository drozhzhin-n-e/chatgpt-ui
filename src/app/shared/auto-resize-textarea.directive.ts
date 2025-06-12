import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: 'textarea[appAutoResize]'
})
export class AutoResizeTextareaDirective {
  constructor(private el: ElementRef<HTMLTextAreaElement>) {}

  @HostListener('input') onInput() {
    const textarea = this.el.nativeElement;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  }
} 