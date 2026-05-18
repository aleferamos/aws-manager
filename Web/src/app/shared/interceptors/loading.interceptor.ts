import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';

import { LoadingService } from '../services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  const shouldSkipLoading = req.headers.get('X-Skip-Loading') === 'true';

  if (shouldSkipLoading) {
    const cleanReq = req.clone({
      headers: req.headers.delete('X-Skip-Loading'),
    });

    return next(cleanReq);
  }

  loadingService.show();

  return next(req).pipe(
    finalize(() => {
      loadingService.hide();
    }),
  );
};
