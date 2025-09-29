import { Routes } from '@angular/router';

import { authGuard } from './guards/auth.guard';
import { LoginComponent } from './login/login.component';
import { MealPlannerComponent } from './meals/meal-planner/meal-planner.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'home',
    component: MealPlannerComponent,
    canActivate: [authGuard],
  },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' },
];
