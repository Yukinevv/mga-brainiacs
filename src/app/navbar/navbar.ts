import {ChangeDetectionStrategy, Component, signal} from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {NgOptimizedImage} from '@angular/common';

@Component({
  selector: 'navbar',
  imports: [RouterLink, RouterLinkActive, NgOptimizedImage],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'w-100 d-block'}
})
export class Navbar {
  private readonly _menuOpen = signal(false);
  readonly menuOpen = this._menuOpen.asReadonly();

  get isOpen(): boolean {
    return this.menuOpen();
  }

  toggleMenu = (): void => {
    this._menuOpen.update(v => !v);
  };
}
