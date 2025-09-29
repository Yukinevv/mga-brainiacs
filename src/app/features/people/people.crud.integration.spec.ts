import {Component} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {provideRouter, Router} from '@angular/router';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';

import {People} from './people';
import {PEOPLE_API_URL} from '../../shared/api/people.api.token';
import {ListResponse, Person, PersonCreateDto, PersonUpdateDto} from '../../shared/api/people.models';

@Component({standalone: true, template: '<div>home</div>'})
class HomeDummy {
}

describe('People (integracja): Modale i CRUD', () => {
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

  async function goToPeopleAndFlushList(data: Person[] = DATA) {
    await router.navigateByUrl('/people');
    fixture = TestBed.createComponent(People);
    fixture.detectChanges();

    const req = httpMock.expectOne(r => r.method === 'GET' && r.url === `${BASE}/users`);
    const payload: ListResponse<Person> = {
      page: 1, per_page: 6, total: data.length, total_pages: 1, data
    };
    req.flush(payload);
    fixture.detectChanges();
  }

  function setInputValue(selector: string, val: string) {
    const el = q<HTMLInputElement>(selector);
    el.value = val;
    el.dispatchEvent(new Event('input', {bubbles: true}));
  }

  it('Dodawanie osoby (happy path): modal -> Save -> dodanie na początku listy z poprawnym ID i avatarem', async () => {
    await goToPeopleAndFlushList();

    const addBtn = q<HTMLButtonElement>('button.btn.btn-primary.btn-sm');
    addBtn.click();
    fixture.detectChanges();

    expect(q('add-edit')).toBeTruthy();
    expect(q('.modal-title')?.textContent?.trim()).toBe('Add new brainiac');

    const dto: PersonCreateDto = {first_name: 'New', last_name: 'Person', email: 'new@example.com'};
    setInputValue('#first_name', dto.first_name);
    setInputValue('#last_name', dto.last_name);
    setInputValue('#email', dto.email);
    fixture.detectChanges();

    const saveBtn = qAll('.modal-footer .btn')[1].nativeElement as HTMLButtonElement;
    expect(saveBtn.disabled).toBeFalse();

    saveBtn.click();
    fixture.detectChanges();

    const postReq = httpMock.expectOne(r => r.method === 'POST' && r.url === `${BASE}/users`);
    postReq.flush({id: 'xyz', createdAt: 'now'});
    fixture.detectChanges();

    expect(q('add-edit')).toBeFalsy();

    const rows = qAll('tbody tr[people-row]');
    expect(rows.length).toBe(DATA.length + 1);

    const firstTds = qAll('tbody tr[people-row]:first-child td')
      .map(de => (de.nativeElement as HTMLElement).textContent?.trim());
    expect(firstTds[2]).toBe(dto.first_name);
    expect(firstTds[3]).toBe(dto.last_name);
    expect(firstTds[4]).toBe(dto.email);

    const expectedId = Math.max(...DATA.map(p => p.id)) + 1;
    expect(firstTds[0]).toBe(String(expectedId));

    const img = q<HTMLImageElement>('tbody tr[people-row]:first-child td:nth-child(2) img');
    await fixture.whenStable();
    const src = img.getAttribute('src') || '';
    const expectedImgIdx = (expectedId % 70) + 1;
    expect(src).toContain(`https://i.pravatar.cc/150?img=${expectedImgIdx}`);

    httpMock.verify();
  });

  it('Dodawanie - walidacja: klik Save na pustym formularzu pokazuje 3 komunikaty "Required" i Save jest zablokowany', async () => {
    await goToPeopleAndFlushList();

    q<HTMLButtonElement>('button.btn.btn-primary.btn-sm').click();
    fixture.detectChanges();
    expect(q('add-edit')).toBeTruthy();

    const form = q<HTMLFormElement>('form');
    form.dispatchEvent(new Event('submit', {bubbles: true}));
    fixture.detectChanges();

    const errors = qAll('.text-danger.small');
    expect(errors.length).toBe(3);
    expect(errors.every(e => (e.nativeElement as HTMLElement).textContent?.trim() === 'Required')).toBeTrue();

    const saveBtn = qAll('.modal-footer .btn')[1].nativeElement as HTMLButtonElement;
    expect(saveBtn.disabled).toBeTrue();

    httpMock.verify();
  });

  it('Dodawanie - błąd: create() zwraca błąd -> modal pozostaje, alert w widoku, tabela nie renderuje się przy błędzie', async () => {
    await goToPeopleAndFlushList();

    q<HTMLButtonElement>('button.btn.btn-primary.btn-sm').click();
    fixture.detectChanges();

    setInputValue('#first_name', 'X');
    setInputValue('#last_name', 'Y');
    setInputValue('#email', 'x@y.com');
    fixture.detectChanges();

    qAll('.modal-footer .btn')[1].nativeElement.click();
    fixture.detectChanges();

    const postReq = httpMock.expectOne(r => r.method === 'POST' && r.url === `${BASE}/users`);
    postReq.flush({message: 'fail'}, {status: 500, statusText: 'Server Error'});
    fixture.detectChanges();

    // Modal nadal widoczny
    expect(q('add-edit')).toBeTruthy();

    // Alert widoczny
    const alert = q('.alert.alert-danger');
    expect(alert).toBeTruthy();
    expect(alert.textContent?.trim()).toContain('Failed to create person.');

    // Tabela nie jest renderowana przy błędzie
    expect(q('people-table')).toBeFalsy();

    httpMock.verify();
  });

  it('Edycja osoby (happy path): Edit -> Save -> update OK -> modal zamknięty, wartości w tabeli zaktualizowane', async () => {
    await goToPeopleAndFlushList();

    const editBtn = q<HTMLButtonElement>('tbody tr[people-row]:nth-child(2) button[aria-label="Edit person"]');
    editBtn.click();
    fixture.detectChanges();

    expect(q('add-edit')).toBeTruthy();
    expect(q('.modal-title')?.textContent?.trim()).toBe('Edit brainiac');

    const dto: PersonUpdateDto = {first_name: 'Alan M.', last_name: 'Turing', email: 'alanm@example.com'};
    setInputValue('#first_name', dto.first_name);
    setInputValue('#email', dto.email);
    fixture.detectChanges();

    qAll('.modal-footer .btn')[1].nativeElement.click();
    fixture.detectChanges();

    const putReq = httpMock.expectOne(r => r.method === 'PUT' && r.url === `${BASE}/users/2`);
    putReq.flush({updatedAt: 'now'});
    fixture.detectChanges();

    expect(q('add-edit')).toBeFalsy();

    const cells = qAll('tbody tr[people-row]:nth-child(2) td')
      .map(de => (de.nativeElement as HTMLElement).textContent?.trim());
    expect(cells[2]).toBe(dto.first_name);
    expect(cells[4]).toBe(dto.email);

    httpMock.verify();
  });

  it('Edycja - błąd: update() zwraca błąd -> modal pozostaje, alert, a tabela nie renderuje się przy błędzie', async () => {
    await goToPeopleAndFlushList();

    q<HTMLButtonElement>('tbody tr[people-row]:nth-child(2) button[aria-label="Edit person"]').click();
    fixture.detectChanges();

    setInputValue('#first_name', 'Changed');
    setInputValue('#email', 'changed@example.com');
    fixture.detectChanges();

    qAll('.modal-footer .btn')[1].nativeElement.click();
    fixture.detectChanges();

    const putReq = httpMock.expectOne(r => r.method === 'PUT' && r.url === `${BASE}/users/2`);
    putReq.flush({message: 'fail'}, {status: 500, statusText: 'Server Error'});
    fixture.detectChanges();

    // Modal nadal widoczny
    expect(q('add-edit')).toBeTruthy();

    // Alert
    const alert = q('.alert.alert-danger');
    expect(alert).toBeTruthy();
    expect(alert.textContent?.trim()).toContain('Failed to update person.');

    expect(q('people-table')).toBeFalsy();

    httpMock.verify();
  });

  it('Usuwanie (happy path): Delete -> Confirm -> delete OK -> modal znika, wiersz znika', async () => {
    await goToPeopleAndFlushList();

    q<HTMLButtonElement>('tbody tr[people-row]:nth-child(3) button[aria-label="Delete person"]').click();
    fixture.detectChanges();
    expect(q('confirm')).toBeTruthy();

    const confirmDeleteBtn = qAll('confirm .modal-footer .btn')[1].nativeElement as HTMLButtonElement;
    confirmDeleteBtn.click();
    fixture.detectChanges();

    const delReq = httpMock.expectOne(r => r.method === 'DELETE' && r.url === `${BASE}/users/3`);
    delReq.flush(null);
    fixture.detectChanges();

    expect(q('confirm')).toBeFalsy();

    const rows = qAll('tbody tr[people-row]');
    expect(rows.length).toBe(DATA.length - 1);

    httpMock.verify();
  });

  it('Usuwanie - błąd: delete() zwraca błąd i Confirm pozostaje, alert, a tabela nie renderuje się przy błędzie', async () => {
    await goToPeopleAndFlushList();

    q<HTMLButtonElement>('tbody tr[people-row]:nth-child(2) button[aria-label="Delete person"]').click();
    fixture.detectChanges();
    expect(q('confirm')).toBeTruthy();

    qAll('confirm .modal-footer .btn')[1].nativeElement.click();
    fixture.detectChanges();

    const delReq = httpMock.expectOne(r => r.method === 'DELETE' && r.url === `${BASE}/users/2`);
    delReq.flush({message: 'fail'}, {status: 500, statusText: 'Server Error'});
    fixture.detectChanges();

    // Confirm nadal widoczny
    expect(q('confirm')).toBeTruthy();

    // Alert
    const alert = q('.alert.alert-danger');
    expect(alert).toBeTruthy();
    expect(alert.textContent?.trim()).toContain('Failed to delete person.');

    expect(q('people-table')).toBeFalsy();

    httpMock.verify();
  });
});
