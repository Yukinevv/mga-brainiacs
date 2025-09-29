import {HttpInterceptorFn} from '@angular/common/http';
import {USE_API_KEY} from './api-key.context';

const API_KEY_HEADER = 'x-api-key';
const API_KEY_VALUE = 'reqres-free-v1';

/**
 * Interceptor dodaje nagłówek "x-api-key" tylko wtedy, gdy w HttpContext ustawiono USE_API_KEY
 * i nagłówek nie jest jeszcze obecny w żądaniu.
 *
 * @param req Oryginalne żądanie HTTP
 * @param next Funkcja przekazująca żądanie dalej
 * @returns Strumień zdarzeń HTTP (oryginalne lub sklonowane żądanie)
 */

export const apiKeyInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.context.get(USE_API_KEY)) {
    return next(req);
  }

  if (req.headers.has(API_KEY_HEADER)) {
    return next(req);
  }

  const withKey = req.clone({
    setHeaders: {[API_KEY_HEADER]: API_KEY_VALUE}
  });
  return next(withKey);
};
