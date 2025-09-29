import {ErrorHandler, inject} from '@angular/core';
import {HttpErrorResponse, HttpInterceptorFn} from '@angular/common/http';
import {catchError} from 'rxjs/operators';
import {throwError} from 'rxjs';
import {ERROR_LOG_LABEL, SKIP_ERROR_LOG} from './http-error.context';

/**
 * Interceptor logujący błędy HTTP przez Angularowy ErrorHandler.
 * - nie zmienia obiektu błędu,
 * - można wyciszyć log przez HttpContext (SKIP_ERROR_LOG),
 * - można dodać etykietę logu (ERROR_LOG_LABEL).
 */
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorHandler = inject(ErrorHandler);

  return next(req).pipe(
    catchError((err: unknown) => {
      const skipLog = req.context.get(SKIP_ERROR_LOG);
      const label = req.context.get(ERROR_LOG_LABEL);

      const httpErr = err instanceof HttpErrorResponse ? err : new HttpErrorResponse({error: err});

      if (!skipLog) {
        const meta = `[${req.method}] ${req.urlWithParams}${label ? ` (${label})` : ''}`;

        if (httpErr.status === 0) {
          errorHandler.handleError(new Error(`HTTP network error: ${meta}`));
        } else {
          errorHandler.handleError(
            new Error(`HTTP ${httpErr.status} ${httpErr.statusText || ''}: ${meta}`.trim())
          );
        }
      }

      return throwError(() => httpErr);
    })
  );
};
