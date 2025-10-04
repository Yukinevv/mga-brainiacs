import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpContext} from '@angular/common/http';
import {ListResponse, Person, PersonCreateDto, PersonUpdateDto} from './people.models';
import {map, Observable} from 'rxjs';
import {PEOPLE_API_URL} from './people.api.token';
import {USE_API_KEY} from '../../core/http/api-key.context';
import {mapApiPerson} from './people.mapping';

@Injectable({providedIn: 'root'})
export class PeopleService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(PEOPLE_API_URL);

  private readonly ctxWithApiKey = new HttpContext().set(USE_API_KEY, true);

  list(page = 1, perPage = 6): Observable<Person[]> {
    return this.http
      .get<ListResponse<any>>(`${this.base}/users`, {
        params: { page, per_page: perPage } as any,
        context: this.ctxWithApiKey
      })
      .pipe(map(res => res.data.map(mapApiPerson)));
  }

  create(dto: PersonCreateDto): Observable<{ id: string; createdAt: string }> {
    return this.http.post<{ id: string; createdAt: string }>(
      `${this.base}/users`,
      dto,
      {context: this.ctxWithApiKey}
    );
  }

  update(id: number, dto: PersonUpdateDto): Observable<{ updatedAt: string }> {
    return this.http.put<{ updatedAt: string }>(
      `${this.base}/users/${id}`,
      dto,
      {context: this.ctxWithApiKey}
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.base}/users/${id}`,
      {context: this.ctxWithApiKey}
    );
  }
}
