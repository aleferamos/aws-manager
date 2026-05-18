import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { UserService } from '../services/user.service';

export const adminHasPasswordGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const router = inject(Router);

  return userService.isFirstAdminUser().pipe(
    map((response) => {
      if (!response.adminHasPassword) {
        return router.createUrlTree(['/set-password-admin-area']);
      }

      return true;
    }),
    catchError(() => {
      return of(router.createUrlTree(['/set-password-admin-area']));
    }),
  );
};
