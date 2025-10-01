import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {AddEdit} from './add-edit';
import {ReactiveFormsModule} from '@angular/forms';

describe('AddEdit', () => {
  let fixture: ComponentFixture<AddEdit>;
  let component: AddEdit;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEdit, ReactiveFormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(AddEdit);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('title', 'Add new brainiac');
    fixture.detectChanges();
  });

  function getEl(selector: string): HTMLElement {
    return fixture.debugElement.query(By.css(selector))?.nativeElement as HTMLElement;
  }

  function setInputValue(selector: string, value: string) {
    const input = getEl(selector) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input', {bubbles: true}));
  }

  it('powinien wyrenderować tytuł', () => {
    const titleEl = getEl('.modal-title');
    expect(titleEl?.textContent?.trim()).toBe('Add new brainiac');
  });

  it('kliknięcie X w headerze emituje close', () => {
    const closeSpy = jasmine.createSpy('close');
    component.close.subscribe(closeSpy);

    const headerCloseBtn = fixture.debugElement.query(
      By.css('.modal-header [aria-label="Close"]')
    );
    (headerCloseBtn.nativeElement as HTMLButtonElement).click();
    expect(closeSpy).toHaveBeenCalledTimes(1);
  });

  it('kliknięcie przycisku Close w stopce emituje close', () => {
    const closeSpy = jasmine.createSpy('close');
    component.close.subscribe(closeSpy);

    const footerCloseBtn = fixture.debugElement.queryAll(By.css('.modal-footer .btn'))[0];
    (footerCloseBtn.nativeElement as HTMLButtonElement).click();

    expect(closeSpy).toHaveBeenCalledTimes(1);
  });

  it('początkowo przycisk Save jest zablokowany (form.invalid)', () => {
    const saveBtn = fixture.debugElement.queryAll(By.css('.modal-footer .btn'))[1]
      .nativeElement as HTMLButtonElement;
    expect(saveBtn.disabled).toBeTrue();
  });

  it('submit na pustym formularzu zaznacza pola jako touched i pokazuje komunikaty Required', () => {
    // submit
    const form = fixture.debugElement.query(By.css('form')).nativeElement as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    // komunikaty
    const errors = fixture.debugElement.queryAll(By.css('.text-danger.small'));
    expect(errors.length).toBe(3);
    expect(errors.every(e => e.nativeElement.textContent.trim() === 'Required')).toBeTrue();

    // aria-invalid = true na każdym polu
    const f = getEl('#first_name');
    const l = getEl('#last_name');
    const e = getEl('#email');
    expect(f.getAttribute('aria-invalid')).toBe('true');
    expect(l.getAttribute('aria-invalid')).toBe('true');
    expect(e.getAttribute('aria-invalid')).toBe('true');
  });

  it('ustawienie inputu initial wypełnia formularz wartościami', () => {
    fixture.componentRef.setInput('initial', {
      first_name: 'Ada',
      last_name: 'Lovelace',
      email: 'ada@example.com'
    });
    fixture.detectChanges();

    const fn = (getEl('#first_name') as HTMLInputElement).value;
    const ln = (getEl('#last_name') as HTMLInputElement).value;
    const em = (getEl('#email') as HTMLInputElement).value;

    expect(fn).toBe('Ada');
    expect(ln).toBe('Lovelace');
    expect(em).toBe('ada@example.com');
  });

  it('wypełnienie poprawnymi danymi odblokowuje Save i submit emituje save z wartością', () => {
    const saveSpy = jasmine.createSpy('save');
    component.save.subscribe(saveSpy);

    setInputValue('#first_name', 'Grace');
    setInputValue('#last_name', 'Hopper');
    setInputValue('#email', 'grace@example.com');
    fixture.detectChanges();

    // Save powinien być aktywny
    const saveBtn = fixture.debugElement.queryAll(By.css('.modal-footer .btn'))[1]
      .nativeElement as HTMLButtonElement;
    expect(saveBtn.disabled).toBeFalse();

    // submit
    const form = fixture.debugElement.query(By.css('form')).nativeElement as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy).toHaveBeenCalledWith({
      first_name: 'Grace',
      last_name: 'Hopper',
      email: 'grace@example.com'
    });
  });

  it('aria-invalid jest false dla pola nie-dotkniętego i staje się true po submit przy błędzie', () => {
    // przed submit
    const firstNameInput = getEl('#first_name');
    expect(firstNameInput.getAttribute('aria-invalid')).toBe('false');

    // submit pustego
    const form = fixture.debugElement.query(By.css('form')).nativeElement as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(firstNameInput.getAttribute('aria-invalid')).toBe('true');
  });
});
