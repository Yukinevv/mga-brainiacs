import {Component} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {provideRouter} from '@angular/router';
import {Navbar} from './navbar';

// Komponent dummy do zarejestrowania tras
@Component({
  standalone: true,
  template: '<div>dummy</div>',
})
class DummyCmp {
}

describe('Navbar', () => {
  let fixture: ComponentFixture<Navbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [
        provideRouter([
          {path: '', component: DummyCmp},
          {path: 'people', component: DummyCmp},
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();
  });

  const q = <T extends HTMLElement = HTMLElement>(sel: string) =>
    fixture.debugElement.query(By.css(sel))?.nativeElement as T;
  const qAll = (sel: string) => fixture.debugElement.queryAll(By.css(sel));

  it('renderuje navbar z marką i obrazkiem logo', async () => {
    const nav = q<HTMLElement>('nav.navbar.navbar-expand-lg.navbar-dark.topbar.bg-primary.fixed-top');
    expect(nav).toBeTruthy();

    const brand = q<HTMLAnchorElement>('.navbar-brand');
    expect(brand).toBeTruthy();

    const img = q<HTMLImageElement>('.navbar-brand img');
    expect(img).toBeTruthy();
    expect(img.getAttribute('alt')).toBe('Brainiacs logo');
    expect(img.width).toBe(48);
    expect(img.height).toBe(48);

    await fixture.whenStable();
    const src = img.getAttribute('src');
    expect(src).toBeTruthy();
    expect(src as string).toContain('/img/logo.png');
  });

  it('ma link Home do "/" i link do "/people"', () => {
    const links = qAll('a.nav-link');
    expect(links.length).toBeGreaterThan(0);

    const homeLink = links.find(de => (de.nativeElement as HTMLAnchorElement).textContent.trim() === 'Home')!
      .nativeElement as HTMLAnchorElement;
    const peopleLink = links.find(de => (de.nativeElement as HTMLAnchorElement).textContent.trim().includes('List of smart guys'))!
      .nativeElement as HTMLAnchorElement;

    expect(homeLink.pathname).toBe('/');
    expect(peopleLink.pathname).toBe('/people');
  });

  it('przycisk hamburgera przełącza aria-expanded i klasę ".show" na .navbar-collapse', () => {
    const toggler = q<HTMLButtonElement>('.navbar-toggler');
    const collapse = q<HTMLDivElement>('#mainNav');

    // domyślnie zamknięte
    expect(toggler.getAttribute('aria-expanded')).toBe('false');
    expect(collapse.classList.contains('show')).toBeFalse();

    // kliknięcie powinno otworzyć
    toggler.click();
    fixture.detectChanges();

    expect(toggler.getAttribute('aria-expanded')).toBe('true');
    expect(collapse.classList.contains('show')).toBeTrue();

    // kliknięcie ponownie zamyka
    toggler.click();
    fixture.detectChanges();

    expect(toggler.getAttribute('aria-expanded')).toBe('false');
    expect(collapse.classList.contains('show')).toBeFalse();
  });

  it('renderuje element Help jako nieklikalny (nav-link disabled)', () => {
    const help = q<HTMLSpanElement>('li.nav-item > span.nav-link.disabled[aria-disabled="true"]');
    expect(help).toBeTruthy();
    expect(help.textContent?.trim()).toBe('Help');
  });

  it('lista nawigacji ma oczekiwane klasy układu (ms-auto, align-items, pe-*)', () => {
    const ul = q<HTMLUListElement>('ul.navbar-nav');
    expect(ul).toBeTruthy();
    const cls = ul.classList;
    expect(cls.contains('ms-auto')).toBeTrue();
    expect(cls.contains('mb-2')).toBeTrue();
    expect(cls.contains('mb-lg-0')).toBeTrue();
    expect(cls.contains('align-items-end')).toBeTrue();
    expect(cls.contains('align-items-lg-center')).toBeTrue();
    expect(cls.contains('text-end')).toBeTrue();
    expect(cls.contains('text-lg-start')).toBeTrue();
    expect(cls.contains('pe-3')).toBeTrue();
    expect(cls.contains('pe-lg-0')).toBeTrue();
  });
});
