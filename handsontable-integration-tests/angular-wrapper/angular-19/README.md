# Angular 19 — @handsontable/angular-wrapper integration app

Minimal Angular 19 application scaffolded with `@angular/cli@19` to verify that
`@handsontable/angular-wrapper` installs and renders correctly on Angular 19.

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
without errors on Angular 19.

## Test

```bash
npm test
```

Runs the default Karma/Jasmine unit test suite. The only spec present is
`app.component.spec.ts` — extend it to add wrapper-specific assertions.

## Notes

- `provideZoneChangeDetection({ eventCoalescing: true })` is included in
  `app.config.ts`.
- `standalone: true` is the **implicit default** in Angular 19 and is omitted
  from the component decorator.
- `app.routes.ts` has been removed — this project does not use routing.
