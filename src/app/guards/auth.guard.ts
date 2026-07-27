import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '../service/auth-service.service';
import { DemoService } from '../service/demo.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const demoService = inject(DemoService);
  const router = inject(Router);

  if (demoService.isDemoMode()) return true;

  return auth.user.pipe(
    map((user) => {
      if (user) return true;
      router.navigate(['/login']);
      return false;
    }),
  );
};
