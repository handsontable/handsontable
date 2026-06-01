---
name: linting
description: Use when fixing ESLint or Stylelint violations in Handsontable, understanding custom lint rules, or before committing any new or modified code to ensure it passes linting - covers all custom Handsontable ESLint rules with rationale and fix patterns
---

# Linting in Handsontable

## Running linters

```bash
npm run eslint --prefix handsontable      # ESLint (JS)
npm run stylelint --prefix handsontable   # Stylelint (CSS/SCSS)
```

## Custom ESLint rules

These live in `handsontable/.config/plugin/eslint/rules/`.

| Rule | What it enforces | Why |
|---|---|---|
| `handsontable/no-native-error-throw` | Must use `throwWithCause()` from `src/helpers/errors.ts`, never `throw new Error()`. | Consistent error handling with cause tracking across the codebase. |
| `handsontable/restricted-module-imports` | No imports from barrel index files (`plugins/index`, `editors/index`, `renderers/index`, `validators/index`, `cellTypes/index`, `i18n/index`). Import from specific submodule paths. Only exception: `src/registry.ts`. | Prevents circular dependencies and reduces bundle size. |
| `handsontable/require-async-in-it` | All `it()` callbacks in `*.spec.js` must be `async`. | E2E tests run in a browser context where HOT API calls are asynchronous. |
| `handsontable/require-await` | Specific HOT API calls (`selectCell`, `render`, etc.) must be `await`-ed in tests. | Prevents race conditions in E2E tests. |

## Built-in ESLint rules with custom config

| Rule | What it enforces | Why |
|---|---|---|
| `no-restricted-globals` | `window`, `document`, `console`, `Handsontable` are banned as globals. | Supports multi-instance setups and air-gapped environments. Use `this.hot.rootWindow`, `this.hot.rootDocument`, and helpers from `src/helpers/console.ts`. |
| `compat/compat` | Browser API compatibility against `browser-targets.js`. | All supported browsers must work. |
| `jsdoc/require-jsdoc` | Error level for all exported functions. | Every public API must be documented. |

## Stylelint

CSS/SCSS files validated by `handsontable/stylelint.config.js`. Run with the `stylelint` command above.

## Common violations and fixes

| Violation | Fix |
|---|---|
| `throw new Error('message')` | `import { throwWithCause } from 'helpers/errors'; throwWithCause('message', cause);` |
| `import { X } from '../plugins/index'` | `import { X } from '../plugins/specificPlugin/specificPlugin';` |
| `it('should ...', () => {` | `it('should ...', async() => {` |
| `selectCell(0, 0);` (in spec) | `await selectCell(0, 0);` |
| `window.scrollTo(...)` | `this.hot.rootWindow.scrollTo(...)` |
| `document.querySelector(...)` | `this.hot.rootDocument.querySelector(...)` |
| `console.warn(...)` | `import { warn } from 'helpers/console'; warn(...);` |

## Cognitive complexity

Keep every function at **15 or below** on the Sonar cognitive-complexity metric. Extract helpers or use early-return guards when exceeding the limit.

## Key files

- `.eslintrc.js` (root) and `handsontable/.eslintrc.js` - ESLint configuration.
- `handsontable/.config/plugin/eslint/rules/` - Custom rule implementations.
- `handsontable/stylelint.config.js` - Stylelint configuration.
- `browser-targets.js` - Browser compatibility targets for `compat/compat`.

See `handsontable/.ai/CONVENTIONS.md` for full coding conventions.
