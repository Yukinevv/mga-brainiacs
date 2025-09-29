import {Component} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {PeopleRow} from './row';
import {Person} from '../../../shared/api/people.models';

@Component({
  // Host do testów
  standalone: true,
  imports: [PeopleRow],
  template: `
    <table>
      <tbody>
      <tr
        people-row
        [person]="p"
        [isLast]="last"
        (edit)="onEdit($event)"
        (remove)="onRemove($event)">
      </tr>
      </tbody>
    </table>
  `
})
class HostTestComponent {
  p: Person = {
    id: 7,
    first_name: 'Ada',
    last_name: 'Lovelace',
    email: 'ada@example.com',
    avatar: 'https://example.com/ava.png'
  };

  last = false;

  edited?: Person;
  removed?: Person;

  onEdit(p: Person) {
    this.edited = p;
  }

  onRemove(p: Person) {
    this.removed = p;
  }
}

describe('PeopleRow', () => {
  let fixture: ComponentFixture<HostTestComponent>;
  let host: HostTestComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostTestComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HostTestComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function query<T extends HTMLElement = HTMLElement>(selector: string): T {
    return fixture.debugElement.query(By.css(selector))?.nativeElement as T;
  }

  function queryAll(selector: string) {
    return fixture.debugElement.queryAll(By.css(selector));
  }

  it('renderuje 6 komórek (td) i poprawne wartości tekstowe', () => {
    const tds = queryAll('td');
    expect(tds.length).toBe(6);

    // kolumna Id
    expect((tds[0].nativeElement as HTMLElement).textContent?.trim()).toBe(String(host.p.id));
    // first name
    expect((tds[2].nativeElement as HTMLElement).textContent?.trim()).toBe(host.p.first_name);
    // last name
    expect((tds[3].nativeElement as HTMLElement).textContent?.trim()).toBe(host.p.last_name);
    // email (tekst)
    expect((tds[4].nativeElement as HTMLElement).textContent?.trim()).toBe(host.p.email);
  });

  it('ustawia atrybuty obrazka: src, width, height, alt', async () => {
    // ngOptimizedImage ustawia finalny src asynchronicznie
    await fixture.whenStable();
    fixture.detectChanges();

    const img = query<HTMLImageElement>('img');
    expect(img).toBeTruthy();
    expect(img.width).toBe(56);
    expect(img.height).toBe(56);
    expect(img.getAttribute('alt'))
      .toBe(`Avatar of ${host.p.first_name} ${host.p.last_name}`);

    // src powinno zostać ustawione
    const src = img.getAttribute('src');
    expect(src).toBeTruthy();
    expect(src as string).toContain('https://example.com/ava.png');
  });

  it('link e-mail ma poprawne href mailto: i klasy Bootstrapowe', () => {
    const a = query<HTMLAnchorElement>('td:nth-child(5) a');
    expect(a).toBeTruthy();
    expect(a.textContent?.trim()).toBe(host.p.email);
    expect(a.getAttribute('href')).toBe(`mailto:${host.p.email}`);

    // klasy z szablonu
    expect(a.classList.contains('text-reset')).toBeTrue();
    expect(a.classList.contains('text-decoration-none')).toBeTrue();
    expect(a.className).toContain('link-underline');
    expect(a.className).toContain('link-underline-opacity-0');
    expect(a.className).toContain('link-underline-opacity-100-hover');
  });

  it('kliknięcie przycisku Edit emituje zdarzenie z aktualną osobą', () => {
    const editBtn = query<HTMLButtonElement>('button[aria-label="Edit person"]');
    editBtn.click();
    expect(host.edited).toEqual(host.p);
  });

  it('kliknięcie przycisku Delete emituje zdarzenie z aktualną osobą', () => {
    const delBtn = query<HTMLButtonElement>('button[aria-label="Delete person"]');
    delBtn.click();
    expect(host.removed).toEqual(host.p);
  });

  it('dodaje klasę "no-bottom" na <tr> gdy isLast = true', () => {
    host.last = true;
    fixture.detectChanges();

    const tr = query<HTMLTableRowElement>('tr[people-row]');
    expect(tr.classList.contains('no-bottom')).toBeTrue();
  });

  it('nie ma klasy "no-bottom" gdy isLast = false', () => {
    host.last = false;
    fixture.detectChanges();

    const tr = query<HTMLTableRowElement>('tr[people-row]');
    expect(tr.classList.contains('no-bottom')).toBeFalse();
  });

  it('zawiera odpowiednie klasy Bootstrap dla spacingu/align w komórkach akcji', () => {
    const actionsTd = query<HTMLTableCellElement>('td.text-end.pe-3');
    expect(actionsTd).toBeTruthy();

    const wrap = query<HTMLDivElement>('td.text-end.pe-3 > div');
    expect(wrap.classList.contains('d-inline-flex')).toBeTrue();
    expect(wrap.classList.contains('align-items-center')).toBeTrue();
    expect(wrap.classList.contains('gap-3')).toBeTrue();

    const btns = queryAll('td.text-end.pe-3 button');
    expect(btns.length).toBe(2);
    btns.forEach(b => {
      const el = b.nativeElement as HTMLButtonElement;
      expect(el.classList.contains('btn')).toBeTrue();
      expect(el.classList.contains('bg-transparent')).toBeTrue();
      expect(el.classList.contains('border-0')).toBeTrue();
      expect(el.classList.contains('p-0')).toBeTrue();
      expect(el.classList.contains('text-primary')).toBeTrue();
    });
  });
});
