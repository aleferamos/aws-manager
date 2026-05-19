import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { ToastMessage, ToastPosition, ToastService } from '../../services/toast.service';
import { AppLanguage } from '../../config/languages.config';
import { LanguageService } from '../../services/language.service';

const toastTranslations: Record<AppLanguage, {
  close: string;
}> = {
  'en-US': {
    close: 'Close notification',
  },
  'pt-BR': {
    close: 'Fechar notificacao',
  },
};

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class Toast {
  private readonly toastService = inject(ToastService);
  private readonly languageService = inject(LanguageService);

  @Input() position: ToastPosition = 'top-right';

  readonly messages$ = this.toastService.messages$;

  get t() {
    return toastTranslations[this.languageService.currentLanguage];
  }

  getContainerClasses(): string[] {
    return ['toast-container', `toast-${this.position}`];
  }

  getToastClasses(message: ToastMessage): string[] {
    return ['toast-message', `toast-${message.severity}`];
  }

  getIcon(message: ToastMessage): string {
    const icons: Record<ToastMessage['severity'], string> = {
      success: 'check_circle',
      info: 'info',
      warn: 'warning',
      error: 'error',
      secondary: 'notifications',
      contrast: 'bolt',
    };

    return icons[message.severity];
  }

  remove(id: string): void {
    this.toastService.remove(id);
  }
}
