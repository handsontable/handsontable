---
name: handsontable-celltype-dev
path: handsontable/src/cellTypes/**
description: Use when creating or modifying a Handsontable cell type that composes an editor, renderer, and validator into a reusable configuration object registered by name
---

# Handsontable Cell Type Development

## Structure

A cell type is a composition object bundling editor, renderer, and validator under one name:

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

Files: `src/cellTypes/{typeName}/{typeName}.ts` (the object) and `index.ts` (re-exports). Registry: `src/cellTypes/registry.ts`.

## Registration

1. `registerCellType(MyCellType)` (import from `../../cellTypes/registry`).
2. Export from `src/cellTypes/index.ts` so the full bundle has it.
3. Add the type string to the `type` option's accepted values in `src/dataMap/metaManager/metaSchema.ts`.

## Key rules

- All components are optional (omit `validator` for no validation, `editor` for read-only types).
- An explicit `renderer`/`editor`/`validator` set beside `type: 'myType'` overrides the one from the type.
- Import existing editor/renderer/validator logic instead of duplicating it.
- **`valueSetter` is the only place a type may normalize an incoming value (not the editor alone, not a plugin).** Paste, `setDataAtCell()`, `populateFromArray()`, autofill and undo bypass the editor, and `valueSetter` runs on all of them. A type whose stored shape differs from what the user writes (key/value `source`, complex format) resolves it there. Learned from DEV-57: the autocomplete editor resolved a typed label against `source`, nothing else did, a pasted label was stored as a bare string among key/value objects, and a `strict` `dropdown` marked the cell invalid. Rules:
  - **Share the rule with the editor.** `findChoiceByDisplayedValue()` (`utils/cellSource.ts`) is called by both `autocompleteEditor#getValue()` and the autocomplete `valueSetter`.
  - **Anything exported from `src/helpers/**` is public API forever, types included.** `index.ts` spreads those modules onto `Handsontable.helper` and `base.ts` types the namespace as `typeof import('./helpers/object')`, so a new export is a permanent commitment and a narrowed signature is a break. Put cell-type helpers in `src/utils/`. `utils/cellSource.ts` holds the key/value rule, including `isKeyValueEntry()`, which delegates to the public `isKeyValueObject()` so the two cannot disagree; `helpers/object.ts` keeps a zero diff.
  - **`valueSetter` takes five arguments: `(value, visualRow, visualCol, cellMeta, source)`.** `utils/valueAccessors.ts` passes all five. Type the meta parameter as a `Pick<CellProperties, …>` of the fields you read; read anything else through `this.getCellMetaTransient` (see the core `AGENTS.md`). `source` is declared optional on the public type: a required fifth parameter raises the option's minimum call arity and breaks a consumer that calls it with four (`.ai/BREAKING-CHANGES.md`).
  - **Re-export a delegating setter.** `dropdownType/accessors/valueSetter.ts` is `export { valueSetter } from '../../autocompleteType/accessors';`. A hand-written delegate dropped `cellMeta` and left the strict column unfixed. A unit test pins the identity (`DropdownCellType.valueSetter` is `AutocompleteCellType.valueSetter`).
  - **Return `newValue` untouched when `source` starts with `'UndoRedo.'`.** Undo and redo restore the prior value verbatim (`utils/valueAccessors.ts` states the invariant). The autocomplete setter once wrapped a restored plain label as `{ key: <label>, value: <label> }`, which a `strict` column then rejected.
  - **Guard an empty write.** `isEmpty(newValue)` skips any resolution, or a `source` entry with an empty label stands in for "no value" and `allowEmpty` changes meaning.
  - **Gate the expensive part on a cheap shape check.** The setter runs once per changed cell. `hasKeyValueChoices()` reads only the entries' shape, so a plain-string `source` never pays for a label scan. Skip memoizing the scan itself: the host can mutate a `source` array in place and a stale displayed-text map would resolve a label to an option no longer offered.
  - **The gate bounds who pays, not how much.** A key/value column runs `findChoiceByDisplayedValue()` per changed cell, a linear scan calling `stringify()` and `stripTags()` per choice: cost is `changed cells × source size`. At 10–100 options a 10k-row paste takes single-digit milliseconds; a source of hundreds to thousands takes about a second. If that ever needs to be fast, use a map invalidated by identity, not a plain cache.

## Reference implementations

- `src/cellTypes/numericType/numericType.ts`
- `src/cellTypes/textType/textType.ts` (simplest, good template)
- `src/cellTypes/dateType/dateType.ts`
- `src/cellTypes/checkboxType/checkboxType.ts`
