---
name: handsontable-unit-testing
description: Use when writing Jest unit tests (*.unit.js) for Handsontable core, plugins, or utilities - covers Jest setup, test location conventions, mocking patterns, module aliases, and when to choose unit tests over E2E tests
---

# Writing Jest Unit Tests for Handsontable

## When to Use Unit Tests vs E2E

- **Unit tests (`*.unit.js`):** Pure logic, utility functions, data transformations, calculations, state machines, data structures, and configuration processing.
- **E2E tests (`*.spec.js`):** DOM interaction, rendering verification, browser events, visual behavior, and user-facing workflows.
- **Anti-pattern:** Do not write unit tests for rendering or DOM interaction. Use E2E tests for anything that touches the DOM.

## Conventions

- **File naming:** Always `*.unit.js`.
- **Location:** Co-located with source in `src/**/__tests__/` directories (e.g., `src/plugins/filters/__tests__/filters.unit.js`).
- **Framework:** Jest with `jsdom` environment and `jest-jasmine2` test runner.
- **Imports:** Explicit imports are required. Unlike E2E tests, there are no auto-injected globals like `handsontable()` or `selectCell()`.

## Module Name Mapping (jest.config.js)

Jest resolves these aliases automatically:

- `'handsontable'` and `'handsontable/...'` resolve to `src/` and `src/...`
- `'walkontable'` and `'walkontable/...'` resolve to `src/3rdparty/walkontable/src/` and `src/3rdparty/walkontable/src/...`
- CSS/SCSS imports resolve to `test/__mocks__/styleMock.js` (returns an empty object).

## Pre-configured Mocks

The bootstrap file (`test/bootstrap.js`) provides these automatically:

- `ResizeObserver` mock (`test/__mocks__/resizeObserverMock.js`).
- `IntersectionObserver` mock (`test/__mocks__/intersectionObserverMock.js`).

For custom mocking, use `jest.fn()` for stubs and `jest.spyOn(object, 'method')` for spying on existing methods.

## Run Commands

- **All unit tests:** `pnpm --filter handsontable run test:unit`
- **Targeted:** `pnpm --filter handsontable run test:unit -- --testPathPattern=pluginName`
- **Example:** `pnpm --filter handsontable run test:unit -- --testPathPattern=filters`

## Large Dataset Testing

When the code under test handles data arrays, include tests with 50k+ rows. Use `forEach` loops to populate arrays -- never `arr.push(...largeArray)` (causes stack overflow at scale).

## Test Structure Example

```js
import { calculateSomething } from '../utils';

describe('calculateSomething', () => {
  it('should return the sum for positive inputs', () => {
    expect(calculateSomething(2, 3)).toBe(5);
  });

  it('should handle zero values', () => {
    expect(calculateSomething(0, 0)).toBe(0);
  });

  it('should throw for invalid input', () => {
    expect(() => calculateSomething(null)).toThrow();
  });
});
```

## Coverage Target

100% of new or modified code.

## Common Mistakes

- Writing unit tests for DOM or rendering behavior (use E2E instead).
- Covering only the happy path -- always test edge cases, error states, and boundary conditions.
- Skipping large dataset tests when the code processes arrays.
- Forgetting to test `updateSettings()` and `enablePlugin()`/`disablePlugin()` cycles for plugin logic.
- Using globals from E2E helpers (`handsontable()`, `selectCell()`) -- these are not available in unit tests.

## Further Reading

- `.ai/TESTING.md` for the full testing strategy.
- `handsontable/jest.config.js` for Jest configuration.
- `handsontable/test/__mocks__/` for available mock implementations.
- `handsontable/test/bootstrap.js` for the test setup.
