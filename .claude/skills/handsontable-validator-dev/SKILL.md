---
name: handsontable-validator-dev
path: handsontable/src/validators/**
description: Use when creating or modifying a Handsontable cell validator - async callback-based validation functions that determine if cell values are valid
---

# Handsontable Validator Development

## Signature

```js
function myValidator(value, callback) {
  // `this` is bound to the cell's cellProperties object
  if (this.allowEmpty && (value === null || value === undefined || value === '')) {
    return callback(true);
  }
  callback(isValid(value)); // true = valid, false = invalid
}
```

## Rules

- Call the callback on every path; a missed call hangs the validation pipeline and silently blocks editing.
- `this` is `cellProperties`: use `this.allowEmpty`, `this.instance`, other cell meta. Use a `function` body, not an arrow function (arrows break the `this` binding).
- Validators only determine validity; data, DOM, and cell state stay untouched.
- The callback may run after async work; the editor stays in WAITING state until it resolves.

## Files

```
src/validators/{validatorName}/
  {validatorName}.ts    # Validator function
  index.ts              # Re-exports
```

Registry: `src/validators/registry.ts`.

```js
import { registerValidator } from '../../validators/registry';
registerValidator('myValidator', myValidator);
```

## Triggers

- The editor system during `finishEditing()`.
- `validateCells()`, `validateRows()`, `validateColumns()`.
- Invalid cells get the `htInvalid` class from the renderer pipeline, not the validator.

## Reference implementations

- `src/validators/numericValidator/numericValidator.ts` - `allowEmpty` support.
- `src/validators/dateValidator/dateValidator.ts`
- `src/validators/autocompleteValidator/autocompleteValidator.ts` - list of allowed values.

## Correcting cell values inside a validator

When a validator writes a corrected value with `setDataAtCell`, pass a source string ending in `'Validator'`:

```js
this.instance.setDataAtCell(row, col, correctedValue, 'myCustomValidator');
```

`validateChanges()` in `core.js` uses the suffix to track the correction. Without it, the correction is lost when the batch includes columns with async `source` callbacks (e.g. async autocomplete with `strict: true`) that resolve later.

## Common mistakes

- Reading a meta flag that an editor forces in `prepare()`. `DropdownEditor.prepare()` writes `strict = true` onto the one cell it prepares, only while selected. A validator reading `this.strict` sees the column's own `strict: false` on every cell never clicked (paste, `setDataAtCell()`, `validateCells()`, any `updateSettings()` that rebuilds cell meta), which made a `strict: false` dropdown strict only in clicked cells (DEV-2911). For fixed cell-type behavior, pass it to the shared logic explicitly: `dropdownValidator` calls `validateAgainstSource(this, value, callback, true)`. Test by writing to a cell that was never selected; selecting it first hides the bug.
