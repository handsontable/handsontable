# Angular 18 — @handsontable/angular-wrapper integration app

Minimal Angular 18 application scaffolded with `@angular/cli@18` to verify that
`@handsontable/angular-wrapper` installs and renders correctly on Angular 18.

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
without errors on Angular 18.

## Test

```bash
npm test
```

Runs the default Karma/Jasmine unit test suite. The only spec present is
`app.component.spec.ts` — extend it to add wrapper-specific assertions.

## Notes

- `provideZoneChangeDetection({ eventCoalescing: true })` is included in
  `app.config.ts` (introduced in Angular 18).
- `standalone: true` must be declared **explicitly** in components (became the
  implicit default in Angular 19).
- `app.routes.ts` has been removed — this project does not use routing.
