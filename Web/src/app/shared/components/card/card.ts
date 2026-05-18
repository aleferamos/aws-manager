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
   * Define uma faixa/ícone com cor semântica.
   */
  @Input() severity: CardSeverity = 'default';

  /**
   * Padding interno do card.
   */
  @Input() padding: CardPadding = 'md';

  /**
   * Card com sombra.
   */
  @Input() elevated = false;

  /**
   * Card com borda mais visível.
   */
  @Input() outlined = true;

  /**
   * Efeito hover.
   */
  @Input() hoverable = false;

  /**
   * Card compacto, bom para dashboards.
   */
  @Input() compact = false;

  /**
   * Mostra uma barrinha colorida no topo.
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
