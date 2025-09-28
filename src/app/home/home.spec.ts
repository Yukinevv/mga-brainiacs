import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {provideRouter} from '@angular/router';
import {Home} from './home';

describe('Home', () => {
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
  });

  const q = <T extends HTMLElement = HTMLElement>(sel: string) =>
    fixture.debugElement.query(By.css(sel))?.nativeElement as T;

  it('renderuje sekcję z klasami py-5 i text-center', () => {
    const section = q<HTMLElement>('section');
    expect(section).toBeTruthy();
    expect(section.classList.contains('py-5')).toBeTrue();
    expect(section.classList.contains('text-center')).toBeTrue();
  });

  it('renderuje nagłówek H1 z klasami i tekstem "Welcome to Brainiacs"', () => {
    const h1 = q<HTMLHeadingElement>('h1.display-5.app-brand');
    expect(h1).toBeTruthy();
    expect(h1.textContent?.trim()).toBe('Welcome to Brainiacs');
  });

  it('renderuje akapit z linkiem do /people i poprawnym tekstem', () => {
    const p = q<HTMLParagraphElement>('p.lead');
    expect(p).toBeTruthy();
    expect(p.textContent).toContain('Przejdź do');

    const aEl = fixture.debugElement.query(By.css('a')).nativeElement as HTMLAnchorElement;
    expect(aEl).toBeTruthy();
    expect(aEl.textContent.trim()).toBe('List of smart guys');
    expect(aEl.pathname).toBe('/people');
  });
});
