import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.me().pipe(
    map((session) => {
      if (session.authenticated === false) {
        return router.createUrlTree(['/login']);
      }

      return true;
    }),
    catchError(() => {
      return of(router.createUrlTree(['/login']));
    }),
  );
};
