import {HttpContextToken} from '@angular/common/http';

export const SKIP_ERROR_LOG = new HttpContextToken<boolean>(() => false);

export const ERROR_LOG_LABEL = new HttpContextToken<string | null>(() => null);
