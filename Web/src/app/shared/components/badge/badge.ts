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
   * Nome do ícone do Material Symbols.
   * Exemplos: 'person', 'check', 'warning', 'error', 'cloud'
   */
  @Input() icon?: string;

  /**
   * Posição do ícone.
   */
  @Input() iconPos: BadgeIconPosition = 'left';

  /**
   * Variação visual.
   */
  @Input() severity: BadgeSeverity = 'brand';

  /**
   * Tamanho do badge.
   */
  @Input() size: BadgeSize = 'md';

  /**
   * Badge com borda.
   */
  @Input() outlined = false;

  /**
   * Badge com formato circular/pill.
   */
  @Input() rounded = true;

  /**
   * Para quando quiser usar apenas ícone.
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
