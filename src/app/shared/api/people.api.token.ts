import {InjectionToken} from '@angular/core';

export const PEOPLE_API_URL = new InjectionToken<string>('PEOPLE_API_URL', {
  providedIn: 'root',
  factory: () => 'https://reqres.in/api'
});
