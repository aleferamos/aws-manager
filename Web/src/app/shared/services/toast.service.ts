import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

export type ToastSeverity = 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast';

export type ToastPosition =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'bottom-center';

export interface ToastMessage {
  id: string;
  severity: ToastSeverity;
  summary: string;
  detail?: string;
  life?: number;
  sticky?: boolean;
  closable?: boolean;
}

export class ToastRef {
  private readonly afterClosedSubject = new Subject<void>();

  readonly afterClosed$ = this.afterClosedSubject.asObservable();

  close(): void {
    this.afterClosedSubject.next();
    this.afterClosedSubject.complete();
  }
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly messagesSubject = new BehaviorSubject<ToastMessage[]>([]);
  private readonly refs = new Map<string, ToastRef>();

  readonly messages$ = this.messagesSubject.asObservable();

  show(message: Omit<ToastMessage, 'id'>): ToastRef {
    const id = crypto.randomUUID();

    const toast: ToastMessage = {
      id,
      life: 4000,
      sticky: false,
      closable: true,
      ...message,
    };

    const ref = new ToastRef();
    this.refs.set(id, ref);

    this.messagesSubject.next([...this.messagesSubject.value, toast]);

    if (!toast.sticky) {
      window.setTimeout(() => {
        this.remove(id);
      }, toast.life);
    }

    return ref;
  }

  success(summary: string, detail?: string, life = 4000): ToastRef {
    return this.show({
      severity: 'success',
      summary,
      detail,
      life,
    });
  }

  info(summary: string, detail?: string, life = 4000): ToastRef {
    return this.show({
      severity: 'info',
      summary,
      detail,
      life,
    });
  }

  warn(summary: string, detail?: string, life = 4000): ToastRef {
    return this.show({
      severity: 'warn',
      summary,
      detail,
      life,
    });
  }

  error(summary: string, detail?: string, life = 5000): ToastRef {
    return this.show({
      severity: 'error',
      summary,
      detail,
      life,
    });
  }

  secondary(summary: string, detail?: string, life = 4000): ToastRef {
    return this.show({
      severity: 'secondary',
      summary,
      detail,
      life,
    });
  }

  contrast(summary: string, detail?: string, life = 4000): ToastRef {
    return this.show({
      severity: 'contrast',
      summary,
      detail,
      life,
    });
  }

  remove(id: string): void {
    const currentMessages = this.messagesSubject.value;
    const exists = currentMessages.some((message) => message.id === id);

    if (!exists) {
      return;
    }

    this.messagesSubject.next(currentMessages.filter((message) => message.id !== id));

    const ref = this.refs.get(id);

    if (ref) {
      ref.close();
      this.refs.delete(id);
    }
  }

  clear(): void {
    const ids = this.messagesSubject.value.map((message) => message.id);

    this.messagesSubject.next([]);

    ids.forEach((id) => {
      const ref = this.refs.get(id);

      if (ref) {
        ref.close();
        this.refs.delete(id);
      }
    });
  }
}
