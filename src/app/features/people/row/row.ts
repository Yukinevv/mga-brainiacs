import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {Person} from '../../../shared/api/people.models';

@Component({
  selector: 'tr[people-row]',
  imports: [NgOptimizedImage],
  templateUrl: './row.html',
  styleUrl: './row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.no-bottom]': 'isLast()'
  }
})
export class PeopleRow {
  person = input.required<Person>();
  isLast = input<boolean>(false);

  edit = output<Person>();
  remove = output<Person>();

  onEdit(): void {
    this.edit.emit(this.person());
  }

  onRemove(): void {
    this.remove.emit(this.person());
  }
}
