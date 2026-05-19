import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type CardSeverity =
  | 'default'
  | 'brand'
  | 'success'
  | 'info'
  | 'warning'
  | 'danger'
  | 'contrast';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.html',
  styleUrl: './card.scss',
})
export class AppCard {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() icon?: string;

  /**
   * Defines a stripe/icon with semantic color.
   */
  @Input() severity: CardSeverity = 'default';

  /**
   * Internal card padding.
   */
  @Input() padding: CardPadding = 'md';

  /**
   * Card with shadow.
   */
  @Input() elevated = false;

  /**
   * Card with a more visible border.
   */
  @Input() outlined = true;

  /**
   * Hover effect.
   */
  @Input() hoverable = false;

  /**
   * Compact card, useful for dashboards.
   */
  @Input() compact = false;

  /**
   * Shows a colored bar at the top.
   */
  @Input() accent = false;

  get classes(): string[] {
    return [
      'card',
      `card-${this.severity}`,
      `card-padding-${this.padding}`,
      this.elevated ? 'card-elevated' : '',
      this.outlined ? 'card-outlined' : '',
      this.hoverable ? 'card-hoverable' : '',
      this.compact ? 'card-compact' : '',
      this.accent ? 'card-accent' : '',
    ].filter(Boolean);
  }

  get hasHeader(): boolean {
    return !!this.title || !!this.subtitle || !!this.icon;
  }
}
