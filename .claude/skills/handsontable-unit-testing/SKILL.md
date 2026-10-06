---
name: handsontable-unit-testing
description: Use when writing or modifying Jest unit tests (*.unit.js or *.unit.ts) or TypeScript type tests (*.types.ts) for Handsontable core, plugins, or utilities, or when a bug fix or internal refactor needs unit or type test coverage - covers Jest setup, test location conventions, mocking patterns, module aliases, type test patterns (no declare, real assignments, ESM + UMD patterns), and when to choose unit tests over E2E tests
---

# Writing Jest Unit Tests for Handsontable

## Unit vs E2E

"E2E" means a new Playwright test in `tests/e2e/` (skill `handsontable-playwright-e2e`). The `handsontable()` / `selectCell()` globals are legacy Jasmine helpers, unavailable in unit tests; add no new `*.spec.js`.

Favor E2E: a unit test that needs a mocked module becomes an E2E test, because module mocks couple tests to internal shape and block refactoring.

- Unit candidates: pure logic, utilities, data transformations, calculations (no mocking).
- E2E: DOM interaction, rendering, browser events, visual behavior.

## Conventions

- File naming: `*.unit.js` or `*.unit.ts` (`testRegex` in `handsontable/jest.config.js`).
- Location: `src/**/__tests__/` beside the source (e.g. `src/plugins/filters/__tests__/dataFilter.unit.ts`).
- Framework: Jest, `jsdom`, `jest-jasmine2` runner. Import everything explicitly.
- Aliases: `'handsontable'` and `'handsontable/...'` resolve to `src/`; `'walkontable'` and `'walkontable/...'` to `src/3rdparty/walkontable/src/`; CSS/SCSS to `test/__mocks__/styleMock.js`.
- `test/bootstrap.js` provides `ResizeObserver` (`test/__mocks__/resizeObserverMock.js`) and `IntersectionObserver` (`test/__mocks__/intersectionObserverMock.js`) mocks. Other mocking: `jest.fn()`, `jest.spyOn(object, 'method')`.

## Run commands

- All: `npm run test:unit --prefix handsontable`
- Targeted: `npm run test:unit --prefix handsontable --testPathPattern=<regex>` (matched against test file paths, e.g. `filters`, `ghostTable.unit`, `metaManager`)

### Two ways a unit run reports green while testing nothing

- **One pattern per `--testPathPattern` call.** `test:unit.jest` runs through `cross-env-shell`, so `--testPathPattern=a|b` becomes a shell pipe: Jest runs `a`, prints a green summary, then fails with `/bin/sh: b: command not found` (exit 127), and a `grep` on `Tests:` shows only passes. Run one pattern per call, or pass file paths directly. (The Puppeteer `test:e2e` runner carries its pattern in an environment variable and is unaffected.)
- **Run files with the task's own command.** A bare `npx jest` from `handsontable/` fails to parse every file ("Jest encountered an unexpected token") without `BABEL_ENV=commonjs` and prints `Tests: 0 total`, which a mutation check grepping for `✕` reads as no failures. Without the styles build use:
  `BABEL_ENV=commonjs npx env-cmd -f ../hot.config.js jest src/plugins/a src/plugins/b`
  and compare the `Test Suites:` count with the number of files you expected.

## Large datasets

For code that handles data arrays, include 50k+ row tests. Populate with `forEach`; `arr.push(...largeArray)` overflows the stack.

## Edge cases

Cover edge cases, error states, and boundaries beyond the happy path. For plugin logic, test `updateSettings()` and `enablePlugin()`/`disablePlugin()` cycles.

```js
import { calculateSomething } from '../utils';

describe('calculateSomething', () => {
  it('should return the sum for positive inputs', () => {
    expect(calculateSomething(2, 3)).toBe(5);
  });
});
```

## TypeScript type tests

`*.types.ts` files verify the generated declarations in `tmp/` after `npm run build:types`. They live in `src/**/__tests__/` (e.g. `src/__tests__/core/core.types.ts`, `src/__tests__/core/namespace.types.ts`); `test/types/` holds only the `tsconfig.json` that drives compilation.

Run: `node_modules/.bin/tsc --noEmit -p test/types/tsconfig.json`

Write every line as a real `const x: Type = actualValue` assignment so the compiler checks assignability against `tmp/`; `declare let x: SomeType` bypasses the check.

Cover both access patterns:

```ts
// ESM/modular: import from subpath, assign to namespace type
import { DateEditor } from 'handsontable/editors';
const _editor: Handsontable.editors.DateEditor = new DateEditor(hot);

// UMD/namespace: extract constructor from namespace object, instantiate it
const EditorCtor = Handsontable.editors.DateEditor;
const _umdEditor: Handsontable.editors.DateEditor = new EditorCtor(hot);
```

Negative assertions use `@ts-expect-error` to prove internal symbols are not exported:

```ts
// @ts-expect-error SelectionManager is not part of the public API
import type { SelectionManager } from 'handsontable';
```

## Further reading

`handsontable/.ai/TESTING.md`, `handsontable/jest.config.js`, `handsontable/test/__mocks__/`, `handsontable/test/bootstrap.js`.
