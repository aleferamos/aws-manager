import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

import { Button } from '../button/button';

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [CommonModule, Button],
  templateUrl: './dialog.html',
  styleUrl: './dialog.scss',
})
export class Dialog {
  @Input() open = false;
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() icon?: string;
  @Input() size: DialogSize = 'md';
  @Input() closeOnBackdrop = true;
  @Input() closeAriaLabel = 'Close dialog';

  @Output() closed = new EventEmitter<void>();

  get classes(): string[] {
    return ['dialog', `dialog-${this.size}`];
  }

  close(): void {
    this.closed.emit();
  }

  onBackdropClick(): void {
    if (this.closeOnBackdrop) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    if (this.open) {
      this.close();
    }
  }
}
