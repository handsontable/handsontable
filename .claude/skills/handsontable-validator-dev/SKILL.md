---
name: handsontable-validator-dev
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
  {validatorName}.js    # Validator function
  index.js              # Re-exports
```

Registry: `src/validators/registry.js`.

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

- `src/validators/numericValidator/numericValidator.js` -- Numeric validation with `allowEmpty` support.
- `src/validators/dateValidator/dateValidator.js` -- Date format validation.
- `src/validators/autocompleteValidator/autocompleteValidator.js` -- Validates against a list of allowed values.

## Common mistakes

- Forgetting to call `callback`, which silently blocks editing and validation.
- Not respecting `this.allowEmpty` for empty values.
- Modifying data or DOM inside a validator.
- Using arrow functions for the validator body (breaks `this` binding to cellProperties).
