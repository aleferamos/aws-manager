import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';

import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-global-loading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './global-loading.html',
  styleUrl: './global-loading.scss',
})
export class GlobalLoading {
  private readonly loadingService = inject(LoadingService);

  readonly isLoading$ = this.loadingService.isLoading$;
}
