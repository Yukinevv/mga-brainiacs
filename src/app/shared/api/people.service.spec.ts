import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';

import {PeopleService} from './people.service';
import {PEOPLE_API_URL} from './people.api.token';
import {ListResponse, Person, PersonCreateDto, PersonUpdateDto} from './people.models';
import {USE_API_KEY} from '../../core/http/api-key.context';

describe('PeopleService', () => {
  let service: PeopleService;
  let httpMock: HttpTestingController;

  const BASE = 'https://example.test/api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PeopleService,
        {provide: PEOPLE_API_URL, useValue: BASE},
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(PeopleService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('list() powinno wykonać GET na /users z parametrami i zwrócić tablicę osób', () => {
    const page = 2;
    const perPage = 6;

    const payload: ListResponse<Person> = {
      page, per_page: perPage, total: 12, total_pages: 2,
      data: [
        {id: 10, first_name: 'Ada', last_name: 'Lovelace', email: 'ada@example.com', avatar: 'a.png'},
        {id: 11, first_name: 'Alan', last_name: 'Turing', email: 'alan@example.com', avatar: 'b.png'},
      ]
    };

    let result: Person[] | undefined;
    service.list(page, perPage).subscribe(res => (result = res));

    const req = httpMock.expectOne(r =>
      r.method === 'GET' &&
      r.url === `${BASE}/users` &&
      r.params.get('page') === String(page) &&
      r.params.get('per_page') === String(perPage)
    );

    expect(req.request.context.get(USE_API_KEY)).toBeTrue();

    req.flush(payload);
    expect(result).toEqual(payload.data);
  });

  it('create() powinno wykonać POST na /users z body dto i zwrócić id/createdAt', () => {
    const dto: PersonCreateDto = {first_name: 'New', last_name: 'Person', email: 'new@example.com'};
    const response = {id: 'xyz', createdAt: '2025-01-01T00:00:00.000Z'};

    let result: typeof response | undefined;
    service.create(dto).subscribe(res => (result = res));

    const req = httpMock.expectOne(r => r.method === 'POST' && r.url === `${BASE}/users`);
    expect(req.request.body).toEqual(dto);
    expect(req.request.context.get(USE_API_KEY)).toBeTrue();

    req.flush(response);
    expect(result).toEqual(response);
  });

  it('update() powinno wykonać PUT na /users/:id z body dto i zwrócić updatedAt', () => {
    const id = 42;
    const dto: PersonUpdateDto = {first_name: 'Updated', last_name: 'User', email: 'upd@example.com'};
    const response = {updatedAt: '2025-01-02T00:00:00.000Z'};

    let result: typeof response | undefined;
    service.update(id, dto).subscribe(res => (result = res));

    const req = httpMock.expectOne(r => r.method === 'PUT' && r.url === `${BASE}/users/${id}`);
    expect(req.request.body).toEqual(dto);
    expect(req.request.context.get(USE_API_KEY)).toBeTrue();

    req.flush(response);
    expect(result).toEqual(response);
  });

  it('delete() powinno wykonać DELETE na /users/:id', () => {
    const id = 7;
    let completed = false;

    service.delete(id).subscribe({complete: () => (completed = true)});

    const req = httpMock.expectOne(r => r.method === 'DELETE' && r.url === `${BASE}/users/${id}`);
    expect(req.request.context.get(USE_API_KEY)).toBeTrue();

    req.flush(null); // 200 / 204
    expect(completed).toBeTrue();
  });

  it('list() propaguje błąd jeśli backend zwróci błąd', () => {
    const page = 1, perPage = 6;
    let error: any;

    service.list(page, perPage).subscribe({
      next: () => fail('Expected error'),
      error: e => (error = e),
    });

    const req = httpMock.expectOne(r =>
      r.method === 'GET' &&
      r.url === `${BASE}/users` &&
      r.params.get('page') === String(page) &&
      r.params.get('per_page') === String(perPage)
    );

    req.flush({message: 'oops'}, {status: 500, statusText: 'Server Error'});

    expect(error).toBeTruthy();
    expect(error.status).toBe(500);
  });
});
