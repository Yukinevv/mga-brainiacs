import {ChangeDetectionStrategy, Component, effect, inject, input, output} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';

type FormValue = {
  first_name: string;
  last_name: string;
  email: string;
};

@Component({
  selector: 'add-edit',
  imports: [ReactiveFormsModule],
  templateUrl: './add-edit.html',
  styleUrl: './add-edit.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEdit {
  title = input.required<string>();
  initial = input<FormValue | null>(null);

  save = output<FormValue>();
  close = output<void>();

  private fb = inject(FormBuilder);
  protected form: FormGroup = this.fb.nonNullable.group({
    first_name: this.fb.nonNullable.control('', {validators: [Validators.required]}),
    last_name: this.fb.nonNullable.control('', {validators: [Validators.required]}),
    email: this.fb.nonNullable.control('', {validators: [Validators.required]})
  });

  protected readonly fc = this.form.controls as {
    first_name: any;
    last_name: any;
    email: any;
  };

  constructor() {
    effect(() => {
      const val = this.initial();
      if (val) {
        this.form.reset(val, {emitEvent: false});
      } else {
        this.form.reset({first_name: '', last_name: '', email: ''}, {emitEvent: false});
      }
    });
  }

  /**
   * Sprawdza, czy kontrolka jest nieprawidłowa i została dotknięta (touched).
   * @param name Nazwa kontrolki formularza
   */
  protected isInvalid<K extends keyof FormValue>(name: K): boolean {
    const c = this.fc[name];
    return !!c && c.invalid && c.touched;
  }

  /**
   * Waliduje formularz; jeśli poprawny emituje `save` z wartościami,
   * w przeciwnym razie oznacza wszystkie pola jako dotknięte.
   */
  onSave() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue() as FormValue;
    this.save.emit(value);
  }
}
