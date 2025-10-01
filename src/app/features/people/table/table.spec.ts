import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {PeopleTable} from './table';
import {Person} from '../../../shared/api/people.models';

describe('PeopleTable', () => {
  let fixture: ComponentFixture<PeopleTable>;
  let component: PeopleTable;

  const PEOPLE: Person[] = [
    {id: 1, first_name: 'Ada', last_name: 'Lovelace', email: 'ada@example.com', avatar: 'https://example.com/1.png'},
    {id: 2, first_name: 'Alan', last_name: 'Turing', email: 'alan@example.com', avatar: 'https://example.com/2.png'},
    {id: 3, first_name: 'Grace', last_name: 'Hopper', email: 'grace@example.com', avatar: 'https://example.com/3.png'}
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PeopleTable]
    }).compileComponents();

    fixture = TestBed.createComponent(PeopleTable);
    component = fixture.componentInstance;
  });

  const query = <T extends HTMLElement = HTMLElement>(sel: string) =>
    fixture.debugElement.query(By.css(sel))?.nativeElement as T;

  const queryAll = (sel: string) => fixture.debugElement.queryAll(By.css(sel));

  it('renderuje tabelę z poprawnymi klasami i nagłówkami', () => {
    fixture.componentRef.setInput('people', PEOPLE);
    fixture.detectChanges();

    const table = query<HTMLTableElement>('table.table.align-middle.people-table.w-100.table-striped');
    expect(table).toBeTruthy();

    const headers = queryAll('thead th').map(de => (de.nativeElement as HTMLElement).textContent?.trim());
    expect(headers).toEqual(['Id', 'Avatar', 'First name', 'Last name', 'E-mail', '']);
  });

  it('renderuje po jednym <tr people-row> na osobę i ustawia isLast dla ostatniego wiersza', () => {
    fixture.componentRef.setInput('people', PEOPLE);
    fixture.detectChanges();

    const rows = queryAll('tbody tr[people-row]');
    expect(rows.length).toBe(PEOPLE.length);

    const lastTr = rows[rows.length - 1].nativeElement as HTMLTableRowElement;
    expect(lastTr.classList.contains('no-bottom')).toBeTrue();

    const prevTr = rows[rows.length - 2].nativeElement as HTMLTableRowElement;
    expect(prevTr.classList.contains('no-bottom')).toBeFalse();
  });

  it('pokazuje stan "No data" gdy lista jest pusta', () => {
    fixture.componentRef.setInput('people', []);
    fixture.detectChanges();

    const emptyTd = query<HTMLTableCellElement>('tbody tr td[colspan="6"]');
    expect(emptyTd).toBeTruthy();
    expect(emptyTd.classList.contains('text-center')).toBeTrue();
    expect(emptyTd.textContent?.trim()).toBe('No data');
  });

  it('propaguje zdarzenie (edit) z wiersza do wyjścia komponentu', () => {
    const spy = jasmine.createSpy('edit');
    component.edit.subscribe(spy);

    fixture.componentRef.setInput('people', PEOPLE);
    fixture.detectChanges();

    const firstRowEditBtn = query<HTMLButtonElement>('tbody tr[people-row]:nth-child(1) button[aria-label="Edit person"]');
    expect(firstRowEditBtn).toBeTruthy();

    firstRowEditBtn.click();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(PEOPLE[0]);
  });

  it('propaguje zdarzenie (remove) z wiersza do wyjścia komponentu', () => {
    const spy = jasmine.createSpy('remove');
    component.remove.subscribe(spy);

    fixture.componentRef.setInput('people', PEOPLE);
    fixture.detectChanges();

    const firstRowDeleteBtn = query<HTMLButtonElement>('tbody tr[people-row]:nth-child(1) button[aria-label="Delete person"]');
    expect(firstRowDeleteBtn).toBeTruthy();

    firstRowDeleteBtn.click();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(PEOPLE[0]);
  });

  it('wyświetla pomocniczy tekst "Avatar" w nagłówku jako element visually-hidden', () => {
    fixture.componentRef.setInput('people', PEOPLE);
    fixture.detectChanges();

    const avatarHeader = query<HTMLSpanElement>('thead th:nth-child(2) .visually-hidden');
    expect(avatarHeader).toBeTruthy();
    expect(avatarHeader.textContent?.trim().toLowerCase()).toBe('avatar');
  });
});
