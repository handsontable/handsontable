---
name: handsontable-celltype-dev
path: handsontable/src/cellTypes/**
description: Use when creating or modifying a Handsontable cell type that composes an editor, renderer, and validator into a reusable configuration object registered by name
---

# Handsontable Cell Type Development

## Structure

Cell types are **composition objects**, not classes. They bundle an editor, renderer, and validator under a single name:

```js
export const MyCellType = {
  CELL_TYPE: 'myType',
  editor: MyEditor,
  renderer: myRenderer,
  validator: myValidator,
  // Optional:
  valueSetter: customSetter,
  valueGetter: customGetter,
  valueFormatter: customFormatter,
  dataType: 'myType',
};
```

When a column or cell sets `type: 'myType'`, Handsontable applies all composed components automatically.

## File structure

```
src/cellTypes/{typeName}/
  {typeName}.ts    # Cell type object
  index.ts         # Re-exports
```

Registry: `src/cellTypes/registry.ts`.

## Registration

```js
import { registerCellType } from '../../cellTypes/registry';
registerCellType(MyCellType);
```

Also export from `src/cellTypes/index.ts` so the type is available in the full bundle.

## Integration with metaSchema

New cell types must be added to `src/dataMap/metaManager/metaSchema.ts` so Handsontable recognizes the type name in configuration. Add the type string to the `type` option's accepted values.

## Key rules

- **Think of cell types as pre-configured bundles.** They exist for convenience - users set one `type` instead of specifying `editor`, `renderer`, and `validator` separately.
- **All components are optional.** A cell type can omit `validator` if no validation is needed, or omit `editor` for read-only display types.
- **Individual overrides win.** If a user sets both `type: 'myType'` and `renderer: customRenderer`, the explicit `renderer` takes precedence over the one from the cell type.
- **`valueSetter` is the ONLY place a type may normalize an incoming value — never the editor alone, and never a plugin.** A value reaches a cell by many routes, and the editor is only one of them: a paste, `setDataAtCell()`, `populateFromArray()`, autofill and undo all bypass it. `valueSetter` runs on every one of those, so a type whose stored shape differs from what the user writes (a key/value `source`, a complex-format type) must resolve it there. Two rules come with that, both learned from DEV-57, where the autocomplete editor resolved a typed label against `source` while nothing else did — a pasted label was stored as a bare string among key/value objects, and a `strict` `dropdown` then marked the cell invalid:
  - **Share the rule with the editor, do not copy it.** The single implementation is `findChoiceByDisplayedValue()` (`utils/cellSource.ts`), called by both `autocompleteEditor#getValue()` and the autocomplete `valueSetter`. Two copies of one matching rule is exactly what let those paths drift. It lives in `src/utils/`, **not** `src/helpers/` — `index.ts` enumerates the `helpers/*` modules onto the public `Handsontable.helper` namespace, so cell-type knowledge in there would become public API by accident.
  - **`valueSetter` takes five arguments: `(value, visualRow, visualCol, cellMeta, source)`.** `utils/valueAccessors.ts` passes all five, so `cellMeta.source`, `cellMeta.allowHtml` and the change source need no plumbing. Type the meta parameter as a `Pick<CellProperties, …>` of the fields you read, so a unit test need not build a whole meta object; read anything else through `this.getCellMetaTransient`, never `this.getCellMeta` (see the core `AGENTS.md`). The `source` parameter is declared **optional** on the public type on purpose — a required fifth parameter would raise the option's minimum call arity and break a consumer that reads the option back out and calls it with four (`.ai/BREAKING-CHANGES.md`).
  - **Never write a delegating setter by hand — re-export.** `dropdownType/accessors/valueSetter.ts` used to be a hand-written delegate, and it dropped `cellMeta`, which left the strict column — the one where the bug is visible — unfixed while the non-strict one worked. It is now `export { valueSetter } from '../../autocompleteType/accessors';`: a re-export has no argument list to keep in sync, so that class of mistake is gone rather than documented. A unit test pins the identity (`DropdownCellType.valueSetter` is `AutocompleteCellType.valueSetter`).
  - **Skip every transformation on `UndoRedo.*`.** `utils/valueAccessors.ts` states the invariant — undo and redo restore what the cell held before, verbatim — and honors it for `emptyValue`. The autocomplete setter did not: it wrapped a restored plain label as `{ key: <label>, value: <label> }` whenever the cell happened to hold an entry, so undoing a column loaded with plain labels produced a fabricated pair a `strict` column then rejected. Return `newValue` untouched when `source` starts with `'UndoRedo.'`.
  - **Guard an empty write.** `isEmpty(newValue)` must skip any resolution, or a `source` entry carrying an empty label stands in for "no value" and `allowEmpty` stops meaning what it says.
  - **Gate the expensive part on a cheap shape check.** The setter runs once per changed cell, so a paste of thousands of rows multiplies whatever it does. `hasKeyValueChoices()` reads only the entries' shape — no string work — so a column whose `source` holds plain strings never pays for a label scan it could not use. Do not memoize the scan itself: a `source` array can be mutated in place by the host application, and a stale displayed-text map would resolve a label to an option no longer offered.

## Reference implementations

- `src/cellTypes/numericType/numericType.ts` - Composes numeric editor, renderer, and validator.
- `src/cellTypes/textType/textType.ts` - Simplest type, good starting template.
- `src/cellTypes/dateType/dateType.ts` - Date handling with format options.
- `src/cellTypes/checkboxType/checkboxType.ts` - Boolean toggle pattern.

## Common mistakes

- Forgetting to register the cell type in `src/cellTypes/registry.ts`.
- Not adding the type to `metaSchema.ts`, causing Handsontable to ignore the type name.
- Duplicating editor/renderer/validator logic instead of importing existing components.
- Not exporting from `src/cellTypes/index.ts` for the full bundle.
