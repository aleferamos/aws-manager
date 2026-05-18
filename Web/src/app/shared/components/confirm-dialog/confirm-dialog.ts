import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Button } from '../button/button';
import { Dialog } from '../dialog/dialog';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [Dialog, Button],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialog {
  @Input() open = false;
  @Input() title = '';
  @Input() message = '';
  @Input() icon = 'help';
  @Input() closeAriaLabel = 'Close dialog';
  @Input() cancelLabel = 'No';
  @Input() confirmLabel = 'Yes';
  @Input() confirmIcon = 'check';
  @Input() loading = false;

  @Output() cancelled = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<void>();

  cancel(): void {
    if (!this.loading) {
      this.cancelled.emit();
    }
  }

  confirm(): void {
    if (!this.loading) {
      this.confirmed.emit();
    }
  }
}
