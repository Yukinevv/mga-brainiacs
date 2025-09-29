import {Routes} from '@angular/router';
import {Home} from './home/home';

export const routes: Routes = [
  {path: '', component: Home, title: 'Home'},
  {
    path: 'people',
    loadChildren: () =>
      import('./features/people/people.routes').then(m => m.routes)
  },
  {path: '**', redirectTo: ''}
];
