export type Person = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar: string;
};

export type PersonCreateDto = {
  first_name: string;
  last_name: string;
  email: string;
};

export type PersonUpdateDto = PersonCreateDto;

export type ListResponse<T> = {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  data: T[];
};
