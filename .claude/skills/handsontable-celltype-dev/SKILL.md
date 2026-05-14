---
name: handsontable-celltype-dev
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
