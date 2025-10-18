import { Routes } from '@angular/router';

import { FormComponent } from './form/form.component';
import { ParentsComponent } from './parents/parents.component';
import { GiftsComponent } from './gifts/gifts.component';

export const routes: Routes = [
  { path: '', redirectTo: 'form', pathMatch: 'full' },
  { path: 'form', component: FormComponent },
  { path: 'parents', component: ParentsComponent },
  { path: 'gifts', component: GiftsComponent },
  { path: '**', redirectTo: 'form' }
];
