import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {Confirm} from './confirm';

describe('Confirm', () => {
  let fixture: ComponentFixture<Confirm>;
  let component: Confirm;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Confirm]
    }).compileComponents();

    fixture = TestBed.createComponent(Confirm);
    component = fixture.componentInstance;

    // wymagany input
    fixture.componentRef.setInput('message', 'Are you sure?');
    fixture.detectChanges();
  });

  const getEl = (sel: string) =>
    fixture.debugElement.query(By.css(sel))?.nativeElement as HTMLElement;

  it('powinien wyrenderować tytuł modala "Confirm delete"', () => {
    const title = getEl('.modal-title');
    expect(title).toBeTruthy();
    expect(title.textContent?.trim()).toBe('Confirm delete');
  });

  it('powinien wyrenderować treść przekazaną przez input "message"', () => {
    const bodyP = getEl('.modal-body p');
    expect(bodyP).toBeTruthy();
    expect(bodyP.textContent?.trim()).toBe('Are you sure?');
  });

  it('kliknięcie X w headerze emituje "cancel"', () => {
    const cancelSpy = jasmine.createSpy('cancel');
    component.cancel.subscribe(cancelSpy);

    const headerCloseBtn = fixture.debugElement.query(
      By.css('.modal-header [aria-label="Close"]')
    ).nativeElement as HTMLButtonElement;

    headerCloseBtn.click();
    expect(cancelSpy).toHaveBeenCalledTimes(1);
  });

  it('kliknięcie przycisku "Cancel" w stopce emituje "cancel"', () => {
    const cancelSpy = jasmine.createSpy('cancel');
    component.cancel.subscribe(cancelSpy);

    const footerButtons = fixture.debugElement.queryAll(By.css('.modal-footer .btn'));
    const cancelBtn = footerButtons[0].nativeElement as HTMLButtonElement;
    expect(cancelBtn.textContent?.toLowerCase()).toContain('cancel');

    cancelBtn.click();
    expect(cancelSpy).toHaveBeenCalledTimes(1);
  });

  it('kliknięcie przycisku "Delete" w stopce emituje "confirm"', () => {
    const confirmSpy = jasmine.createSpy('confirm');
    component.confirm.subscribe(confirmSpy);

    const footerButtons = fixture.debugElement.queryAll(By.css('.modal-footer .btn'));
    const deleteBtn = footerButtons[1].nativeElement as HTMLButtonElement;
    expect(deleteBtn.textContent?.toLowerCase()).toContain('delete');

    deleteBtn.click();
    expect(confirmSpy).toHaveBeenCalledTimes(1);
  });

  it('zmiana inputu "message" po renderze aktualizuje treść', () => {
    fixture.componentRef.setInput('message', 'Really delete this item?');
    fixture.detectChanges();

    const bodyP = getEl('.modal-body p');
    expect(bodyP.textContent?.trim()).toBe('Really delete this item?');
  });

  it('powinien mieć widoczny backdrop', () => {
    const backdrop = getEl('.modal-backdrop.show');
    expect(backdrop).toBeTruthy();
  });
});
