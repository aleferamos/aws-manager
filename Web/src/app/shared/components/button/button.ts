import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonSeverity =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'info'
  | 'warn'
  | 'help'
  | 'danger'
  | 'contrast';

export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonIconPosition = 'left' | 'right';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.html',
  styleUrl: './button.scss',
})
export class Button {
  @Input() label?: string;
  @Input() icon?: string;
  @Input() iconPos: ButtonIconPosition = 'left';

  @Input() severity: ButtonSeverity = 'primary';
  @Input() size: ButtonSize = 'md';

  @Input() disabled = false;
  @Input() loading = false;
  @Input() fullWidth = false;

  /**
   * PrimeNG-like visual variant:
   * - false: filled button
   * - true: outlined button with transparent background
   */
  @Input() outlined = false;

  /**
   * PrimeNG-like visual variant:
   * - true: text button without border or background
   */
  @Input() text = false;

  /**
   * More rounded button.
   */
  @Input() rounded = false;

  @Input() ariaLabel?: string;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';

  @Output() pressed = new EventEmitter<Event>();

  get isIconOnly(): boolean {
    return !!this.icon && !this.label;
  }

  get classes(): string[] {
    return [
      'btn',
      `btn-${this.severity}`,
      `btn-${this.size}`,
      this.outlined ? 'btn-outlined' : '',
      this.text ? 'btn-text' : '',
      this.rounded ? 'btn-rounded' : '',
      this.fullWidth ? 'btn-full' : '',
      this.loading ? 'btn-loading' : '',
      this.isIconOnly ? 'btn-icon-only' : '',
    ].filter(Boolean);
  }

  onClick(event: Event): void {
    if (this.disabled || this.loading) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    this.pressed.emit(event);
  }
}
