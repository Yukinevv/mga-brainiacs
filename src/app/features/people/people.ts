import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {PeopleService} from '../../shared/api/people.service';
import {Person, PersonCreateDto, PersonUpdateDto} from '../../shared/api/people.models';
import {catchError, finalize, map, of} from 'rxjs';
import {PeopleTable} from './table/table';
import {AddEdit} from './modals/add-edit/add-edit';
import {Confirm} from './modals/confirm/confirm';

type ModalKind = 'none' | 'add' | 'edit' | 'delete';

@Component({
  selector: 'people',
  imports: [PeopleTable, AddEdit, Confirm],
  templateUrl: './people.html',
  styleUrl: './people.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class People {
  private readonly api = inject(PeopleService);

  // UI state
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  // data
  protected readonly people = signal<Person[]>([]);

  // modal state
  protected readonly modalKind = signal<ModalKind>('none');
  protected readonly selected = signal<Person | null>(null);

  constructor() {
    this.load();
  }

  /** Pobiera listę osób; zarządza stanem loading/error. */
  private load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api
      .list()
      .pipe(
        finalize(() => this.loading.set(false)),
        catchError(() => {
          this.setError('Failed to load people. Please try again.');
          return of<Person[]>([]);
        })
      )
      .subscribe(list => this.people.set(list));
  }

  /** Otwiera modal dodawania. */
  openAdd(): void {
    this.modalKind.set('add');
  }

  /** Otwiera modal edycji dla wskazanej osoby. */
  openEdit(p: Person): void {
    this.selected.set(p);
    this.modalKind.set('edit');
  }

  /** Otwiera modal potwierdzenia usunięcia dla wskazanej osoby. */
  openDelete(p: Person): void {
    this.selected.set(p);
    this.modalKind.set('delete');
  }

  /** Zamyka aktualny modal i czyści zaznaczenie. */
  closeModal(): void {
    this.modalKind.set('none');
    this.selected.set(null);
  }

  /**
   * Tworzy osobę przez API; po sukcesie dodaje ją do listy i zamyka modal.
   * Obsługuje błędy ustawiając komunikat.
   */
  create(dto: PersonCreateDto): void {
    this.api
      .create(dto)
      .pipe(
        catchError(() => {
          this.setError('Failed to create person.');
          return of(null);
        })
      )
      .subscribe(res => {
        if (!res) return;

        const id = this.getNextId();
        const newPerson: Person = {
          id,
          email: dto.email,
          first_name: dto.first_name,
          last_name: dto.last_name,
          avatar: this.buildAvatarUrl(id)
        };

        this.people.update(arr => [newPerson, ...arr]);
        this.closeModal();
      });
  }

  /**
   * Zapisuje edycję osoby przez API; po sukcesie aktualizuje wpis na liście i zamyka modal.
   * Obsługuje błędy ustawiając komunikat.
   */
  saveEdit(dto: PersonUpdateDto): void {
    const sel = this.selected();
    if (!sel) return;

    this.api
      .update(sel.id, dto)
      .pipe(
        catchError(() => {
          this.setError('Failed to update person.');
          return of(null);
        })
      )
      .subscribe(res => {
        if (!res) return;

        this.people.update(arr =>
          arr.map(p =>
            p.id === sel.id
              ? {...p, first_name: dto.first_name, last_name: dto.last_name, email: dto.email}
              : p
          )
        );
        this.closeModal();
      });
  }

  /**
   * Potwierdza usunięcie osoby; po sukcesie usuwa ją z listy i zamyka modal.
   * Obsługuje błędy ustawiając komunikat.
   */
  confirmDelete(): void {
    const sel = this.selected();
    if (!sel) return;

    const id = sel.id;

    this.api
      .delete(id)
      .pipe(
        map(() => true),
        catchError(() => {
          this.setError('Failed to delete person.');
          return of(false);
        })
      )
      .subscribe(ok => {
        if (!ok) return;
        this.people.update(arr => arr.filter(p => p.id !== id));
        this.closeModal();
      });
  }

  /** Ustawia komunikat błędu. */
  private setError(msg: string): void {
    this.error.set(msg);
  }

  /** Zwraca kolejny identyfikator (max z listy + 1). */
  private getNextId(): number {
    const ids = this.people().map(p => p.id);
    return (ids.length ? Math.max(...ids) : 0) + 1;
  }

  /** Buduje URL avatara deterministycznie na podstawie `id`. */
  private buildAvatarUrl(id: number): string {
    return `https://i.pravatar.cc/150?img=${(id % 70) + 1}`;
  }
}
