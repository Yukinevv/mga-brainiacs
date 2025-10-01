import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';

@Component({
  selector: 'confirm',
  templateUrl: './confirm.html',
  styleUrl: './confirm.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Confirm {
  message = input.required<string>();

  confirm = output<void>();
  cancel = output<void>();
}
