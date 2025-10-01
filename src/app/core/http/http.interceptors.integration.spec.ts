import {TestBed} from '@angular/core/testing';
import {HttpClient, HttpContext, provideHttpClient, withInterceptors} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {ErrorHandler} from '@angular/core';

import {PeopleService} from '../../shared/api/people.service';
import {PEOPLE_API_URL} from '../../shared/api/people.api.token';
import {ListResponse, Person} from '../../shared/api/people.models';

import {apiKeyInterceptor} from './api-key.interceptor';
import {httpErrorInterceptor} from './http-error.interceptor';
import {ERROR_LOG_LABEL, SKIP_ERROR_LOG} from './http-error.context';

class ErrorHandlerSpy implements ErrorHandler {
  calls: string[] = [];

  handleError(error: any): void {
    // Interceptor przekazuje Error z komunikatem - zapisuje sam message dla czytelnych asercji
    const msg = error instanceof Error ? error.message : String(error);
    this.calls.push(msg);
  }
}

describe('Interceptory + serwis (integracja)', () => {
  let http: HttpClient;
  let api: PeopleService;
  let httpMock: HttpTestingController;
  let errSpy: ErrorHandlerSpy;

  const BASE = 'https://reqres.in/api';
  const API_KEY_HEADER = 'x-api-key';
  const API_KEY_VALUE = 'reqres-free-v1';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {provide: PEOPLE_API_URL, useValue: BASE},
        {provide: ErrorHandler, useClass: ErrorHandlerSpy},
        provideHttpClient(withInterceptors([apiKeyInterceptor, httpErrorInterceptor])),
        provideHttpClientTesting(),
        PeopleService,
      ],
    });

    http = TestBed.inject(HttpClient);
    api = TestBed.inject(PeopleService);
    httpMock = TestBed.inject(HttpTestingController);
    errSpy = TestBed.inject(ErrorHandler) as unknown as ErrorHandlerSpy;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('apiKeyInterceptor (opt-in przez HttpContext): PeopleService.list() ma nagłówek x-api-key, zwykły HttpClient.get bez contextu nie ma', () => {
    // PeopleService.list() - serwis ustawia kontekst USE_API_KEY
    let result: Person[] | undefined;
    api.list(1, 6).subscribe(res => (result = res));

    const req1 = httpMock.expectOne(r => r.method === 'GET' && r.url === `${BASE}/users`);
    expect(req1.request.headers.get(API_KEY_HEADER)).toBe(API_KEY_VALUE);

    const payload: ListResponse<Person> = {
      page: 1, per_page: 6, total: 0, total_pages: 0, data: []
    };
    req1.flush(payload);
    expect(result).toEqual([]);

    // 2) Zwykłe żądanie bez contextu - brak nagłówka
    let ok = false;
    http.get('https://example.test/ping').subscribe(() => (ok = true));
    const req2 = httpMock.expectOne('https://example.test/ping');
    expect(req2.request.headers.has(API_KEY_HEADER)).toBeFalse();
    req2.flush({pong: true});
    expect(ok).toBeTrue();
  });

  it('httpErrorInterceptor: błąd z list() trafia do subskrybenta i jest zalogowany przez ErrorHandler (z etykietą)', () => {
    let caught: any;
    api.list(1, 6).subscribe({
      next: () => fail('Expected error'),
      error: e => (caught = e),
    });

    // list() wysyła GET z parametrami ?page=1&per_page=6
    const req = httpMock.expectOne(r =>
      r.method === 'GET' &&
      r.url === `${BASE}/users` &&
      r.params.get('page') === '1' &&
      r.params.get('per_page') === '6'
    );

    // Dodaje etykietę przez interceptor
    req.flush({message: 'boom'}, {status: 500, statusText: 'Server Error'});

    // Błąd przeszedł do subskrybenta
    expect(caught).toBeTruthy();
    expect(caught.status).toBe(500);

    // ErrorHandler zalogował komunikat z metodą, URL-em (z parametrami) i statusem
    const joined = errSpy.calls.join('\n');
    expect(joined).toContain('HTTP 500');
    expect(joined).toContain('[GET] https://reqres.in/api/users?page=1&per_page=6');

    // Teraz osobno sprawdzam label wykonując świadomie żądanie z contextem
    let caught2: any;
    const ctx = new HttpContext()
      .set(ERROR_LOG_LABEL, 'people-load');

    http.get(`${BASE}/users`, {context: ctx}).subscribe({
      next: () => fail('Expected error'),
      error: e => (caught2 = e),
    });
    const reqWithLabel = httpMock.expectOne(`${BASE}/users`);
    reqWithLabel.flush({message: 'oops'}, {status: 500, statusText: 'Server Error'});

    expect(caught2.status).toBe(500);
    const joined2 = errSpy.calls.join('\n');
    expect(joined2).toContain('(people-load)'); // label w komunikacie
  });

  it('httpErrorInterceptor: SKIP_ERROR_LOG wycisza logowanie do ErrorHandler', () => {
    const ctx = new HttpContext()
      .set(SKIP_ERROR_LOG, true)
      .set(ERROR_LOG_LABEL, 'silent-call');

    let caught: any;
    http.get(`${BASE}/users`, {context: ctx}).subscribe({
      next: () => fail('Expected error'),
      error: e => (caught = e),
    });

    const req = httpMock.expectOne(`${BASE}/users`);
    req.flush({message: 'nope'}, {status: 500, statusText: 'Server Error'});

    expect(caught.status).toBe(500);
    expect(errSpy.calls.length).toBe(0);
  });
});
