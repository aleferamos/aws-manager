import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private readonly loadingCountSubject = new BehaviorSubject<number>(0);

  readonly isLoading$ = this.loadingCountSubject.asObservable();

  show(): void {
    this.loadingCountSubject.next(this.loadingCountSubject.value + 1);
  }

  hide(): void {
    const currentValue = this.loadingCountSubject.value;

    if (currentValue <= 0) {
      this.loadingCountSubject.next(0);
      return;
    }

    this.loadingCountSubject.next(currentValue - 1);
  }

  reset(): void {
    this.loadingCountSubject.next(0);
  }
}
