# Angular 16 — @handsontable/angular-wrapper integration app

Minimal Angular 16 standalone application scaffolded with `@angular/cli@16` to
verify that `@handsontable/angular-wrapper` installs and renders correctly on
Angular 16.

## Install

```bash
npm install --legacy-peer-deps
```

## Run

```bash
npm start
```

Opens the app at `http://localhost:4200`. The root component renders the
getting-started demo grid (`AppComponent` in `src/app/app.component.ts`).

## Build

```bash
npm run build
```

Output is written to `dist/`. A successful build confirms the wrapper compiles
without errors on Angular 16.

## Test

```bash
npm test
```

Runs the default Karma/Jasmine unit test suite. The only spec present is
`app.component.spec.ts` — extend it to add wrapper-specific assertions.

## Notes

- Scaffolded with `--standalone` flag — Angular 16 defaults to NgModule but
  standalone components are fully supported since Angular 15.
- `standalone: true` must be declared **explicitly** (became the implicit
  default in Angular 19).
- `styleUrls` is an **array** (`styleUrls: ['...']`) — Angular 17 changed
  this to the singular `styleUrl: '...'`.
- `provideZoneChangeDetection` is **not** available — it was introduced in
  Angular 18.
- `app.routes.ts` was not generated — this project does not use routing.
