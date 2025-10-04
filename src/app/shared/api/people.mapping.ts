import { Person } from './people.models';

/** Tworzy URL avatara */
export function buildAvatarUrl(id: number): string {
  return `https://i.pravatar.cc/150?img=${(id % 70) + 1}`;
}

/** Proste mapowanie danych z API na Person */
export function mapApiPerson(raw: any): Person {
  const id = Number(raw?.id ?? 0);

  // Jeśli API zwraca tylko "name", rozbij na first i last
  const [firstRaw, lastRaw] = String(raw?.name ?? '').split(' ');
  const first = raw?.first_name ?? firstRaw ?? `User${id}`;
  const last =
    raw?.last_name ??
    lastRaw ??
    ['Smith', 'Johnson', 'Brown', 'Taylor', 'Anderson'][id % 5];

  const email =
    raw?.email ??
    `${first.toLowerCase()}.${last.toLowerCase()}@example.com`;

  const avatar = raw?.avatar ?? buildAvatarUrl(id);

  return {
    id,
    first_name: first,
    last_name: last,
    email,
    avatar
  };
}
