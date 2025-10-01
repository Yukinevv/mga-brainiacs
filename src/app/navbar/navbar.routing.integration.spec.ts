import {Component} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {provideRouter, Router, RouterLink} from '@angular/router';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';

import {App} from '../app';
import {ListResponse, Person} from '../shared/api/people.models';
import {People} from '../features/people/people';
import {PEOPLE_API_URL} from '../shared/api/people.api.token';

// Komponent dla trasy domyślnej
@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="py-5 text-center">
      <h1>Home</h1>
      <p>Przejdź do <a routerLink="/people">List of smart guys</a>.</p>
    </section>
  `
})
class HomeDummy {
}

describe('Navbar + routing (integracja)', () => {
  let fixture: ComponentFixture<App>;
  let router: Router;
  let httpMock: HttpTestingController;

  const BASE = 'https://example.test/api';

  const DATA: Person[] = [
    {id: 1, first_name: 'Ada', last_name: 'Lovelace', email: 'ada@example.com', avatar: 'a.png'},
    {id: 2, first_name: 'Alan', last_name: 'Turing', email: 'alan@example.com', avatar: 'b.png'},
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App, People, HomeDummy],
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

    await router.navigateByUrl('/');
    fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  const q = <T extends HTMLElement = HTMLElement>(sel: string) =>
    fixture.debugElement.query(By.css(sel))?.nativeElement as T;

  it('Nawigacja z Home do People przez link w navbarze lub na stronie', async () => {
    // Navbar jest widoczny
    const nav = q<HTMLElement>('nav.navbar');
    expect(nav).toBeTruthy();

    // Kliknięcie link "List of smart guys" z Navbara
    const aInNavbarDe = fixture.debugElement.queryAll(By.css('nav a.nav-link'))
      .find(de => (de.nativeElement as HTMLAnchorElement).textContent.trim().includes('List of smart guys'))!;
    (aInNavbarDe.nativeElement as HTMLAnchorElement).click();
    fixture.detectChanges();

    // Poczekaj aż Router zakończy nawigację i People się zainicjalizuje
    await fixture.whenStable();
    fixture.detectChanges();

    const req = httpMock.expectOne(r => r.method === 'GET' && r.url === `${BASE}/users`);
    const payload: ListResponse<Person> = {
      page: 1, per_page: 6, total: DATA.length, total_pages: 1, data: DATA
    };
    req.flush(payload);
    fixture.detectChanges();

    // Render People: obecność tabeli, Navbar nadal widoczny
    expect(q('people-table')).toBeTruthy();
    expect(q('nav.navbar')).toBeTruthy();

    httpMock.verify();
  });

  it('Hamburger: toggle ustawia aria-expanded i .show na #mainNav, po kliknięciu linku działa nawigacja', async () => {
    const toggler = q<HTMLButtonElement>('nav .navbar-toggler');
    const collapse = q<HTMLDivElement>('#mainNav');
    expect(toggler).toBeTruthy();
    expect(collapse).toBeTruthy();
    expect(toggler.getAttribute('aria-expanded')).toBe('false');
    expect(collapse.classList.contains('show')).toBeFalse();

    // Otwórz menu
    toggler.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(toggler.getAttribute('aria-expanded')).toBe('true');
    expect(collapse.classList.contains('show')).toBeTrue();

    // Kliknij "List of smart guys" w rozwiniętym menu
    const linkPeopleDe = fixture.debugElement.queryAll(By.css('#mainNav a.nav-link'))
      .find(de => (de.nativeElement as HTMLAnchorElement).textContent.trim().includes('List of smart guys'))!;
    (linkPeopleDe.nativeElement as HTMLAnchorElement).click();
    fixture.detectChanges();

    // Poczekaj na zakończenie nawigacji
    await fixture.whenStable();
    fixture.detectChanges();

    // Serwer zwraca listę
    const req = httpMock.expectOne(r => r.method === 'GET' && r.url === `${BASE}/users`);
    req.flush({
      page: 1, per_page: 6, total: DATA.length, total_pages: 1, data: DATA
    } as ListResponse<Person>);
    fixture.detectChanges();

    // Widok People jest wyrenderowany
    expect(q('people-table')).toBeTruthy();

    httpMock.verify();
  });
});
