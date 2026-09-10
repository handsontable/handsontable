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
  - **Share the rule with the editor, do not copy it.** The single implementation is `findChoiceByDisplayedValue()` (`helpers/cellSource.ts`), called by both `autocompleteEditor#getValue()` and the autocomplete `valueSetter`. Two copies of one matching rule is exactly what let those paths drift.
  - **The 4th argument is the cell meta, and a delegating setter must forward it.** `utils/valueAccessors.ts` calls `valueSetter.call(instance, value, visualRow, visualCol, cellMeta)`, so `source`, `allowHtml` and the rest need no plumbing. The dropdown setter delegates to the autocomplete one and silently dropped that argument, which left the strict column — the one where the bug is visible — unfixed while the non-strict one worked. Type the parameter as a `Pick<CellProperties, …>` of the fields you read, so a unit test need not build a whole meta object. And read through `this.getCellMetaTransient` if you need more, never `this.getCellMeta` (see the core `AGENTS.md`).
  - **Guard an empty write.** `isEmpty(newValue)` must skip any resolution, or a `source` entry carrying an empty label stands in for "no value" and `allowEmpty` stops meaning what it says.

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
