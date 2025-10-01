# MgaBrainiacs

Aplikacja stworzona w **Angular 20.3.3** umożliwiająca zarządzanie listą osób z użyciem tabeli, modalów i interceptorów HTTP.

---

## Funkcjonalności

- **Strona główna** z linkiem do listy osób.
- **Lista osób**: tabela z Bootstrapem, obsługa pustych wyników i błędów.
- **CRUD**: dodawanie, edycja, usuwanie w modalach.
- **Navbar**: wersja desktop i mobilna (hamburger).
- **Interceptory**:
  - `apiKeyInterceptor` - dodaje nagłówek `x-api-key`.
  - `httpErrorInterceptor` - loguje błędy przez `ErrorHandler`.

---

## Stack technologiczny

- Angular 20.3.3 (standalone components, signals)
- Bootstrap 5 + Font Awesome
- RxJS, HttpClient
- Testy: Jasmine + Karma (unit oraz integracyjne)

---

## Uruchomienie

```
npm install       # instalacja zależności
ng serve          # dev server (http://localhost:4200)
ng test           # testy jednostkowe + integracyjne
```

---

## Testy

- Unit: komponenty (modale, tabela, navbar), serwis.
- Integracyjne: pełne scenariusze (CRUD, ładowanie listy, routing, interceptory).

---

## API

- Backend: https://reqres.in/api (mock API).
- Nagłówek x-api-key ustawiany tylko, gdy w żądaniu użyto `HttpContext().set(USE_API_KEY, true)`.

---

## Autor

Adrian Rodzic (`adrianrodzic33@gmail.com`)
