---
name: handsontable-validator-dev
path: handsontable/src/validators/**
description: Use when creating or modifying a Handsontable cell validator - async callback-based validation functions that determine if cell values are valid
---

# Handsontable Validator Development

## Function signature

Validators use the **callback pattern** and must always invoke the callback:

```js
function myValidator(value, callback) {
  // `this` is bound to the cell's cellProperties object
  if (this.allowEmpty && (value === null || value === void 0 || value === '')) {
    return callback(true);
  }
  callback(isValid(value)); // true = valid, false = invalid
}
```

## Key rules

- **Always call the callback.** Forgetting to call `callback` hangs the validation pipeline.
- **Context-aware.** `this` is the cell's `cellProperties` object. Use `this.allowEmpty`, `this.instance` (the Handsontable instance), and other cell meta properties.
- **Single responsibility.** Validators only determine validity. Never modify data, DOM, or cell state.
- **Async-compatible.** The callback can be called after async operations (API calls, timeouts). The editor enters WAITING state until the callback resolves.

## File structure

```
src/validators/{validatorName}/
  {validatorName}.ts    # Validator function
  index.ts              # Re-exports
```

Registry: `src/validators/registry.ts`.

## Registration

```js
import { registerValidator } from '../../validators/registry';
registerValidator('myValidator', myValidator);
```

## How validators are triggered

- Automatically by the editor system during `finishEditing()`.
- Programmatically via `validateCells()`, `validateRows()`, or `validateColumns()` API methods.
- Invalid cells receive the `htInvalid` CSS class (applied by the renderer pipeline, not the validator).

## Reference implementations

- `src/validators/numericValidator/numericValidator.ts` - Numeric validation with `allowEmpty` support.
- `src/validators/dateValidator/dateValidator.ts` - Date format validation.
- `src/validators/autocompleteValidator/autocompleteValidator.ts` - Validates against a list of allowed values.

## Correcting cell values inside a validator

Validators may correct a cell's value before passing it to the callback. The built-in `dateValidator` and `timeValidator` do this via `correctFormat`. If your validator calls `setDataAtCell` to write a corrected value, **pass a source string that ends with `'Validator'`** (e.g. `'myCustomValidator'`):

```js
this.instance.setDataAtCell(row, col, correctedValue, 'myCustomValidator');
```

This is required so that `validateChanges()` in `core.js` can track the correction and prevent it from being overwritten when an async validator in the same batch resolves later. Without the suffix, the correction is silently lost when the batch includes columns with async `source` callbacks (e.g. async autocomplete with `strict: true`).

## Common mistakes

- Forgetting to call `callback`, which silently blocks editing and validation.
- Not respecting `this.allowEmpty` for empty values.
- Calling `setDataAtCell` inside a validator without a source ending in `'Validator'` - the correction will be overwritten when the batch contains async validators (see above).
- Using arrow functions for the validator body (breaks `this` binding to cellProperties).
