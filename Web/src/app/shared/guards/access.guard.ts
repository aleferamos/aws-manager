import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AccessRule } from '../config/access.config';
import { AccessControlService } from '../services/access-control.service';

export const accessGuard: CanActivateFn = (route) => {
  const accessControl = inject(AccessControlService);
  const router = inject(Router);
  const accessRule = route.data['accessRule'] as AccessRule | undefined;

  return accessControl.canAccess(accessRule).pipe(
    map((canAccess) => {
      if (canAccess) {
        return true;
      }

      return router.createUrlTree(['/home']);
    }),
  );
};
