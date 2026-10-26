import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';

import { AuthService } from '../service/auth-service.service';

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.user.pipe(
    take(1),
    map((user) => (user ? router.createUrlTree(['/home']) : true)),
  );
};
