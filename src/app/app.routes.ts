import { Routes } from '@angular/router';

import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';
import { LoginComponent } from './login/login.component';
import { MealPlannerComponent } from './meals/meal-planner/meal-planner.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard]
  },
  {
    path: 'home',
    component: MealPlannerComponent,
    canActivate: [authGuard],
  },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' },
];
