import {HttpContextToken} from '@angular/common/http';

export const USE_API_KEY = new HttpContextToken<boolean>(() => false);
