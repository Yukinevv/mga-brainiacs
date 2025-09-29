import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {of, Subject, throwError} from 'rxjs';
import {People} from './people';
import {PeopleService} from '../../shared/api/people.service';
import {Person, PersonCreateDto, PersonUpdateDto} from '../../shared/api/people.models';

describe('People (feature component)', () => {
  let fixture: ComponentFixture<People>;
  let component: People;

  // Prosty mock serwisu z możliwością podmiany zachowań per test
  let peopleServiceMock: jasmine.SpyObj<PeopleService>;

  const PEOPLE: Person[] = [
    {id: 1, first_name: 'Ada', last_name: 'Lovelace', email: 'ada@example.com', avatar: 'https://example.com/1.png'},
    {id: 2, first_name: 'Alan', last_name: 'Turing', email: 'alan@example.com', avatar: 'https://example.com/2.png'},
    {id: 3, first_name: 'Grace', last_name: 'Hopper', email: 'grace@example.com', avatar: 'https://example.com/3.png'},
  ];

  beforeEach(async () => {
    peopleServiceMock = jasmine.createSpyObj<PeopleService>('PeopleService', [
      'list', 'create', 'update', 'delete'
    ]);

    await TestBed.configureTestingModule({
      imports: [People], // standalone komponent, importuje PeopleTable/AddEdit/Confirm
      providers: [
        {provide: PeopleService, useValue: peopleServiceMock}
      ]
    }).compileComponents();
  });

  function create(initialList$: Subject<Person[]> | null = null) {
    if (initialList$) {
      peopleServiceMock.list.and.returnValue(initialList$.asObservable());
    } else {
      peopleServiceMock.list.and.returnValue(of(PEOPLE));
    }
    fixture = TestBed.createComponent(People);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  const q = <T extends HTMLElement = HTMLElement>(sel: string) =>
    fixture.debugElement.query(By.css(sel))?.nativeElement as T;

  it('na starcie pokazuje spinner, a po załadowaniu listy – tabelę i ukrywa spinner', () => {
    const subj = new Subject<Person[]>();
    create(subj);

    // spinner widoczny podczas ładowania
    expect(q('.spinner-border')).toBeTruthy();

    // dostarcz dane
    subj.next(PEOPLE);
    subj.complete();
    fixture.detectChanges();

    // spinner znika, tabela jest
    expect(q('.spinner-border')).toBeFalsy();
    expect(q('people-table')).toBeTruthy();
  });

  it('gdy list() zwróci błąd, pokazuje alert z komunikatem i nie renderuje tabeli', () => {
    peopleServiceMock.list.and.returnValue(throwError(() => new Error('boom')));
    fixture = TestBed.createComponent(People);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const alert = q('.alert.alert-danger');
    expect(alert).toBeTruthy();
    expect(alert.textContent?.trim()).toContain('Failed to load people');

    expect(q('people-table')).toBeFalsy();
  });

  it('kliknięcie "Add brainiac" otwiera modal dodawania', () => {
    create();
    const addBtn = q('button.btn.btn-primary.btn-sm');
    expect(addBtn.textContent).toContain('Add brainiac');

    addBtn.click();
    fixture.detectChanges();

    // pojawia się komponent add-edit z tytułem dodawania
    const addEdit = q('add-edit');
    expect(addEdit).toBeTruthy();
    expect(addEdit.textContent).toContain('Add new brainiac');
  });

  it('openEdit(p) otwiera modal edycji z przekazanym selected', () => {
    create();
    component.openEdit(PEOPLE[1]);
    fixture.detectChanges();

    const addEdit = q('add-edit');
    expect(addEdit).toBeTruthy();
    expect(addEdit.textContent).toContain('Edit brainiac');
  });

  it('openDelete(p) otwiera modal potwierdzenia usunięcia', () => {
    create();
    component.openDelete(PEOPLE[0]);
    fixture.detectChanges();

    const confirm = q('confirm');
    expect(confirm).toBeTruthy();
    expect(confirm.textContent?.toLowerCase()).toContain('are you sure');
  });

  it('create(dto): po sukcesie dodaje osobę na początek listy i zamyka modal', () => {
    create();
    // upewnij się, że modal jest w trybie add
    component.openAdd();
    fixture.detectChanges();

    peopleServiceMock.create.and.returnValue(of({id: 'xyz', createdAt: 'now'}));

    const dto: PersonCreateDto = {
      first_name: 'New',
      last_name: 'Person',
      email: 'new@example.com'
    };

    component.create(dto);
    fixture.detectChanges();

    // lista w komponencie powinna być zaktualizowana
    const list = component['people']();
    expect(list[0].first_name).toBe('New');
    expect(list.length).toBe(PEOPLE.length + 1);

    // modal zamknięty
    expect(component['modalKind']()).toBe('none');
    expect(component['selected']()).toBeNull();
  });

  it('create(dto): po błędzie ustawia komunikat błędu i nie zamyka modala', () => {
    create();
    component.openAdd();
    fixture.detectChanges();

    peopleServiceMock.create.and.returnValue(throwError(() => new Error('create failed')));

    component.create({first_name: 'X', last_name: 'Y', email: 'x@y.com'});
    fixture.detectChanges();

    expect(component['error']()).toBe('Failed to create person.');
    expect(component['modalKind']()).toBe('add');
  });

  it('saveEdit(dto): po sukcesie aktualizuje osobę i zamyka modal', () => {
    create();
    const target = PEOPLE[1]; // Alan
    component.openEdit(target);
    fixture.detectChanges();

    peopleServiceMock.update.and.returnValue(of({updatedAt: 'now'}));

    const dto: PersonUpdateDto = {
      first_name: 'Alan M.',
      last_name: 'Turing',
      email: 'alanm@example.com'
    };

    component.saveEdit(dto);
    fixture.detectChanges();

    const updated = component['people']().find(p => p.id === target.id)!;
    expect(updated.first_name).toBe('Alan M.');
    expect(updated.email).toBe('alanm@example.com');

    expect(component['modalKind']()).toBe('none');
    expect(component['selected']()).toBeNull();
  });

  it('saveEdit(dto): po błędzie ustawia komunikat i pozostaje w modalu', () => {
    create();
    const target = PEOPLE[0];
    component.openEdit(target);
    fixture.detectChanges();

    peopleServiceMock.update.and.returnValue(throwError(() => new Error('update failed')));

    component.saveEdit({first_name: 'A', last_name: 'B', email: 'a@b.com'});
    fixture.detectChanges();

    expect(component['error']()).toBe('Failed to update person.');
    expect(component['modalKind']()).toBe('edit');
  });

  it('confirmDelete(): po sukcesie usuwa wybraną osobę i zamyka modal', () => {
    create();
    const target = PEOPLE[2]; // Grace
    component.openDelete(target);
    fixture.detectChanges();

    peopleServiceMock.delete.and.returnValue(of(void 0));

    component.confirmDelete();
    fixture.detectChanges();

    const list = component['people']();
    expect(list.find(p => p.id === target.id)).toBeUndefined();
    expect(component['modalKind']()).toBe('none');
  });

  it('confirmDelete(): po błędzie ustawia komunikat błędu i nie zamyka modala', () => {
    create();
    const target = PEOPLE[1];
    component.openDelete(target);
    fixture.detectChanges();

    peopleServiceMock.delete.and.returnValue(throwError(() => new Error('delete failed')));

    component.confirmDelete();
    fixture.detectChanges();

    expect(component['error']()).toBe('Failed to delete person.');
    expect(component['modalKind']()).toBe('delete');
  });

  it('closeModal() resetuje stan modala i selected', () => {
    create();
    component.openEdit(PEOPLE[0]);
    fixture.detectChanges();

    component.closeModal();
    fixture.detectChanges();

    expect(component['modalKind']()).toBe('none');
    expect(component['selected']()).toBeNull();
  });
});
