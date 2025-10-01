import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {Person} from '../../../shared/api/people.models';
import {PeopleRow} from '../row/row';

@Component({
  selector: 'people-table',
  imports: [PeopleRow],
  templateUrl: './table.html',
  styleUrl: './table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PeopleTable {
  people = input.required<Person[]>();

  edit = output<Person>();
  remove = output<Person>();

  onEdit(p: Person): void {
    this.edit.emit(p);
  }

  onRemove(p: Person): void {
    this.remove.emit(p);
  }
}
