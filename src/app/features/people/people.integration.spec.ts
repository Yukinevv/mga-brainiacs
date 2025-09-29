import {Component} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {provideRouter, Router} from '@angular/router';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';

import {People} from './people';
import {PEOPLE_API_URL} from '../../shared/api/people.api.token';
import {ListResponse, Person} from '../../shared/api/people.models';

// Komponent domyślny do routingu
@Component({
  standalone: true,
  template: '<div>home</div>',
})
class HomeDummy {
}

describe('People (integracja)', () => {
  let fixture: ComponentFixture<People>;
  let router: Router;
  let httpMock: HttpTestingController;

  const BASE = 'https://example.test/api';

  const DATA: Person[] = [
    {id: 1, first_name: 'Ada', last_name: 'Lovelace', email: 'ada@example.com', avatar: 'a.png'},
    {id: 2, first_name: 'Alan', last_name: 'Turing', email: 'alan@example.com', avatar: 'b.png'},
    {id: 3, first_name: 'Grace', last_name: 'Hopper', email: 'grace@example.com', avatar: 'c.png'},
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [People],
      providers: [
        provideRouter([
          {path: '', component: HomeDummy},
          {path: 'people', component: People},
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {provide: PEOPLE_API_URL, useValue: BASE},
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    httpMock = TestBed.inject(HttpTestingController);
  });

  const q = <T extends HTMLElement = HTMLElement>(sel: string) =>
    fixture.debugElement.query(By.css(sel))?.nativeElement as T;
  const qAll = (sel: string) => fixture.debugElement.queryAll(By.css(sel));

  it('Pomyślne ładowanie listy: spinner i tabela, zebra i no-bottom dla ostatniego wiersza', async () => {
    // Nawigacja na /people
    await router.navigateByUrl('/people');
    fixture = TestBed.createComponent(People);
    fixture.detectChanges();

    // Spinner przed danymi
    expect(q('.spinner-border')).toBeTruthy();

    // Żądanie listy
    const req = httpMock.expectOne(r => r.method === 'GET' && r.url === `${BASE}/users`);
    const payload: ListResponse<Person> = {
      page: 1,
      per_page: 6,
      total: DATA.length,
      total_pages: 1,
      data: DATA,
    };
    req.flush(payload);
    fixture.detectChanges();

    // Spinner znika, tabela obecna, zebra (table-striped)
    expect(q('.spinner-border')).toBeFalsy();
    const table = q<HTMLTableElement>('table.table.align-middle.people-table.w-100.table-striped');
    expect(table).toBeTruthy();

    const rows = qAll('tbody tr[people-row]');
    expect(rows.length).toBe(DATA.length);

    // Ostatni wiersz bez dolnego bordera
    const lastTr = rows[rows.length - 1].nativeElement as HTMLTableRowElement;
    expect(lastTr.classList.contains('no-bottom')).toBeTrue();

    httpMock.verify();
  });

  it('Błąd ładowania listy: pokazuje alert, brak tabeli i brak spinnera', async () => {
    await router.navigateByUrl('/people');
    fixture = TestBed.createComponent(People);
    fixture.detectChanges();

    // Spinner widoczny na starcie
    expect(q('.spinner-border')).toBeTruthy();

    // Zwracamy błąd z list()
    const req = httpMock.expectOne(r => r.method === 'GET' && r.url === `${BASE}/users`);
    req.flush({message: 'boom'}, {status: 500, statusText: 'Server Error'});
    fixture.detectChanges();

    // Alert widoczny
    const alert = q('.alert.alert-danger');
    expect(alert).toBeTruthy();
    expect(alert.textContent?.trim()).toContain('Failed to load people');

    // Brak tabeli i brak spinnera
    expect(q('people-table')).toBeFalsy();
    expect(q('.spinner-border')).toBeFalsy();

    httpMock.verify();
  });

  it('Pusty wynik: tabela renderuje "No data" w tbody', async () => {
    await router.navigateByUrl('/people');
    fixture = TestBed.createComponent(People);
    fixture.detectChanges();

    // Spinner widoczny
    expect(q('.spinner-border')).toBeTruthy();

    // Pusty wynik
    const req = httpMock.expectOne(r => r.method === 'GET' && r.url === `${BASE}/users`);
    const payload: ListResponse<Person> = {
      page: 1,
      per_page: 6,
      total: 0,
      total_pages: 0,
      data: [],
    };
    req.flush(payload);
    fixture.detectChanges();

    // Spinner znika, tabela jest
    expect(q('.spinner-border')).toBeFalsy();
    const table = q('table.table.align-middle.people-table.w-100.table-striped');
    expect(table).toBeTruthy();

    // "No data" w tbody
    const emptyTd = q<HTMLTableCellElement>('tbody tr td[colspan="6"]');
    expect(emptyTd).toBeTruthy();
    expect(emptyTd.classList.contains('text-center')).toBeTrue();
    expect(emptyTd.textContent?.trim()).toBe('No data');

    httpMock.verify();
  });
});
