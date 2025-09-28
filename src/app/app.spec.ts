import {Component} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {provideRouter, Router} from '@angular/router';
import {App} from './app';

// Komponenty dummy do tras
@Component({
  standalone: true,
  template: '<div data-testid="home">Home works</div>',
})
class HomeDummy {
}

@Component({
  standalone: true,
  template: '<div data-testid="people">People works</div>',
})
class PeopleDummy {
}

describe('App (root)', () => {
  let fixture: ComponentFixture<App>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          {path: '', component: HomeDummy},
          {path: 'people', component: PeopleDummy},
        ]),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(App);
    fixture.detectChanges();
  });

  const q = <T extends HTMLElement = HTMLElement>(sel: string) =>
    fixture.debugElement.query(By.css(sel))?.nativeElement as T;

  it('renderuje navbar na górze', () => {
    const nav = q('navbar');
    expect(nav).toBeTruthy();
  });

  it('renderuje main z klasami "container py-4"', () => {
    const main = q<HTMLDivElement>('main.container.py-4');
    expect(main).toBeTruthy();
  });

  it('router-outlet renderuje komponent docelowy po nawigacji', async () => {
    await router.navigateByUrl('/people');
    fixture.detectChanges();
    await fixture.whenStable();

    const people = q('[data-testid="people"]');
    expect(people).toBeTruthy();
    expect(people.textContent?.trim()).toBe('People works');
  });

  it('router-outlet renderuje komponent domyślny dla ścieżki ""', async () => {
    await router.navigateByUrl('/');
    fixture.detectChanges();
    await fixture.whenStable();

    const home = q('[data-testid="home"]');
    expect(home).toBeTruthy();
    expect(home.textContent?.trim()).toBe('Home works');
  });
});
