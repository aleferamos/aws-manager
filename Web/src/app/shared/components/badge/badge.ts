import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type BadgeSeverity =
  | 'brand'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'info'
  | 'warning'
  | 'warn'
  | 'danger'
  | 'contrast';

export type BadgeSize = 'sm' | 'md' | 'lg';
export type BadgeIconPosition = 'left' | 'right';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge.html',
  styleUrl: './badge.scss',
})
export class Badge {
  @Input() label?: string;

  /**
   * Material Symbols icon name.
   * Examples: 'person', 'check', 'warning', 'error', 'cloud'
   */
  @Input() icon?: string;

  /**
   * Icon position.
   */
  @Input() iconPos: BadgeIconPosition = 'left';

  /**
   * Visual variation.
   */
  @Input() severity: BadgeSeverity = 'brand';

  /**
   * Badge size.
   */
  @Input() size: BadgeSize = 'md';

  /**
   * Badge with border.
   */
  @Input() outlined = false;

  /**
   * Circular/pill badge shape.
   */
  @Input() rounded = true;

  /**
   * For icon-only usage.
   */
  @Input() ariaLabel?: string;

  get isIconOnly(): boolean {
    return !!this.icon && !this.label;
  }

  get normalizedSeverity(): BadgeSeverity {
    return this.severity === 'warn' ? 'warning' : this.severity;
  }

  get classes(): string[] {
    return [
      'badge',
      `badge-${this.normalizedSeverity}`,
      `badge-${this.size}`,
      this.outlined ? 'badge-outlined' : '',
      this.rounded ? 'badge-rounded' : '',
      this.isIconOnly ? 'badge-icon-only' : '',
    ].filter(Boolean);
  }
}
