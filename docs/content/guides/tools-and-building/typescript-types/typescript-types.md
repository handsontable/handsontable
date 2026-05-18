---
type: reference
id: t9kx3mwp
title: TypeScript types
metaTitle: TypeScript types - JavaScript Data Grid | Handsontable
description: A complete reference of the TypeScript types and interfaces that Handsontable exports, with usage examples for settings, hook callbacks, custom renderers, and editors.
permalink: /typescript-types
canonicalUrl: /typescript-types
tags:
  - typescript
  - types
  - interfaces
  - type safety
react:
  id: r2bq7nyc
  metaTitle: TypeScript types - React Data Grid | Handsontable
angular:
  id: a5vj6hsz
  metaTitle: TypeScript types - Angular Data Grid | Handsontable
searchCategory: Guides
category: Tools and building
menuTag: new
---

Handsontable ships TypeScript declarations for its entire public API. This page lists every type you can import and shows how to use them in common scenarios.

[[toc]]

## Entry points

Handsontable exposes types from two entry points. Both give you the same types, so pick the one that matches how you import the library.

**Full package** -- all modules pre-registered, no tree shaking:

```typescript
import Handsontable, { GridSettings, HotInstance } from 'handsontable';
```

**Base package** -- use when you import only the [modules](@/guides/tools-and-building/modules/modules.md) you need:

```typescript
import Handsontable, { GridSettings, HotInstance } from 'handsontable/base';
```

TypeScript `import type` also works for any of the types below, and produces no runtime output:

```typescript
import type { GridSettings, HotInstance } from 'handsontable';
```

## Type reference

### Configuration types

These types describe the settings object you pass to `new Handsontable()` or `updateSettings()`.

| Type | Description |
| --- | --- |
| `GridSettings` | All Handsontable configuration options. Use for the top-level settings object. |
| `ColumnSettings` | Per-column overrides. Each entry in the `columns` array uses this type. |
| `CellProperties` | Merged cell-level settings after cascading from global → column → cell. Read-only at render time. |
| `CellMeta` | Mutable per-cell metadata stored in `hot.getCellMeta()`. Extends `CellProperties`. |
| `Events` | All hook callback signatures, keyed by hook name. Use to type individual hook functions. |

```typescript
import type { GridSettings, ColumnSettings } from 'handsontable';

const columns: ColumnSettings[] = [
  { data: 'name', type: 'text' },
  { data: 'revenue', type: 'numeric', numericFormat: { pattern: '$0,0.00' } },
];

const settings: GridSettings = {
  data: myData,
  columns,
  licenseKey: 'non-commercial-and-evaluation',
};
```

### Data types

These types describe the values that move in and out of the grid.

| Type | Description |
| --- | --- |
| `CellValue` | A single cell value: `string \| number \| boolean \| null \| undefined`. |
| `CellChange` | A single change tuple: `[row, column, oldValue, newValue]`. Passed to `afterChange` and `beforeChange`. |
| `RowObject` | A data row as a plain object, used when `data` is an array of objects. |
| `ChangeSource` | A string union of all built-in change source identifiers (e.g. `'edit'`, `'loadData'`, `'UndoRedo.undo'`). |
| `SourceRowData` | A row from the original source data before any index translation. |
| `NumericFormatOptions` | Options for the `numericFormat` column setting (delegates to the Numbro library). |
| `SelectOptionsObject` | An option entry for the `select` and `autocomplete` cell types: `{ value, label }`. |
| `RangeType` | A cell range descriptor: `{ from: CellCoords, to: CellCoords }`. |

```typescript
import type { CellChange, ChangeSource } from 'handsontable';

function onAfterChange(changes: CellChange[] | null, source: ChangeSource): void {
  if (!changes || source === 'loadData') return;

  for (const [row, col, , newValue] of changes) {
    console.log(`Cell [${row}, ${col}] changed to`, newValue);
  }
}
```

### Instance type

| Type | Description |
| --- | --- |
| `HotInstance` | The Handsontable instance returned by `new Handsontable()`. Use to type refs and parameters that accept a live instance. |

```typescript
import Handsontable from 'handsontable';
import type { HotInstance } from 'handsontable';

let hot: HotInstance;

hot = new Handsontable(document.querySelector('#grid')!, {
  data: myData,
  licenseKey: 'non-commercial-and-evaluation',
});
```

### Geometry classes

`CellCoords` and `CellRange` are runtime classes (not type-only) that you can also use as type annotations.

| Export | Kind | Description |
| --- | --- | --- |
| `CellCoords` | Class | A `{ row, col }` coordinate pair. Returned by selection and navigation APIs. |
| `CellRange` | Class | A `{ from: CellCoords, to: CellCoords }` range. Returned by `getSelectedRange()`. |
| `IndexMapper` | Class | The row or column index translator. Typed access to `hot.rowIndexMapper` and `hot.columnIndexMapper`. |
| `RangeType` | Type | A plain-object range descriptor accepted by APIs that don't require a `CellRange` instance. |

```typescript
import { CellRange } from 'handsontable';

function logSelection(ranges: CellRange[]): void {
  for (const range of ranges) {
    console.log(`from [${range.from.row}, ${range.from.col}] to [${range.to.row}, ${range.to.col}]`);
  }
}
```

### Cell function registry types

Use these string-union types to constrain `type`, `renderer`, `editor`, and `validator` settings to registered names only.

| Type | Description |
| --- | --- |
| `CellType` | Union of all registered cell type aliases: `'text' \| 'numeric' \| 'checkbox' \| ...`. |
| `EditorType` | Union of all registered editor aliases. |
| `RendererType` | Union of all registered renderer aliases. |
| `ValidatorType` | Union of all registered validator aliases. |

```typescript
import type { ColumnSettings, CellType } from 'handsontable';

function buildColumn(type: CellType): ColumnSettings {
  return { type };
}
```

### Editor base type

| Type | Description |
| --- | --- |
| `BaseEditorInstance` | The `BaseEditor` class type. Use to type parameters and return values in custom editor code. |

### Hooks registry type

| Type | Description |
| --- | --- |
| `HooksRegistry` | Describes the static `Handsontable.hooks` object (e.g. `.getRegistered()`). Useful when passing the hooks registry as a typed parameter. |

```typescript
import type { HooksRegistry } from 'handsontable';

function listHooks(hooks: HooksRegistry): string[] {
  return hooks.getRegistered();
}
```

### Theme types

These types are relevant when you use the [theming API](@/api/options.md#themeName) or build a custom theme.

| Type | Description |
| --- | --- |
| `ThemeConfig` | The full configuration object for `registerTheme()`. |
| `ThemeParams` | Constructor parameters for creating a theme instance. |
| `ThemeBuilder` | The builder object returned by the theme factory. |
| `ThemeColorScheme` | `'light' \| 'dark' \| 'auto'`. |
| `ThemeColorsConfig` | Color token overrides within a theme config. |
| `ThemeDensityConfig` | Row height and cell padding token overrides. |
| `ThemeDensitySizes` | Numeric sizes within a density config entry. |
| `ThemeIconsConfig` | Icon token overrides. |
| `ThemeLightDarkValue` | A token value with separate light and dark variants. |
| `ThemeSizingConfig` | Font and spacing token overrides. |
| `ThemeTokenValue` | A single design token value. |
| `ThemeTokensConfig` | The full token map used inside a `ThemeConfig`. |
| `BaseTheme` | The base theme object extended by all built-in themes. |

### Overlay type

| Type | Description |
| --- | --- |
| `OverlayType` | A string union of all Walkontable overlay identifiers: `'top' \| 'bottom' \| 'left' \| 'right' \| ...`. Useful in advanced rendering customizations. |

## Implicit typing of the public API

The types listed above are the ones you need to **import explicitly** when you want to annotate your own variables, parameters, or return values.

The rest of the public API -- plugins, editors, renderers, validators, cell types, and the `Handsontable` class itself -- carries its own TypeScript declarations automatically. You get full type safety and IDE autocomplete for these as a side-effect of importing the value, with no additional type import required.

```typescript
// No type import needed -- ContextMenu is already fully typed.
import { ContextMenu } from 'handsontable/plugins';

// No type import needed -- AutocompleteEditor is already fully typed.
import { AutocompleteEditor } from 'handsontable/editors';

// No type import needed -- numericRenderer is already fully typed.
import { numericRenderer } from 'handsontable/renderers';

// No type import needed -- the Handsontable class and its instance methods are already fully typed.
import Handsontable from 'handsontable';

const hot = new Handsontable(container, { licenseKey: 'non-commercial-and-evaluation' });
hot.loadData(myData); // IDE autocomplete and type checking work here.
```

The explicit `import type { ... }` pattern from the [type reference](#type-reference) section is only necessary when you need a type as an annotation outside of where the value is already in scope.

## Common patterns

### Type the settings object

Annotate settings directly so TypeScript validates every option:

```typescript
import type { GridSettings } from 'handsontable';

const settings: GridSettings = {
  data: employees,
  colHeaders: ['Name', 'Department', 'Hire date'],
  columns: [
    { data: 'name' },
    { data: 'department' },
    { data: 'hireDate', type: 'date', dateFormat: 'YYYY-MM-DD' },
  ],
  licenseKey: 'non-commercial-and-evaluation',
};
```

### Type hook callbacks using `Events`

`Events` maps every hook name to its callback signature. Extract a specific callback type with `Events[hookName]`:

```typescript
import type { Events } from 'handsontable';

const onAfterChange: Events['afterChange'] = (changes, source) => {
  if (!changes) return;
  console.log(source, changes);
};

hot.addHook('afterChange', onAfterChange);
```

### Type a custom renderer

Custom renderers receive a typed `CellProperties` argument:

```typescript
import Handsontable from 'handsontable';
import type { CellProperties, HotInstance, GridSettings } from 'handsontable';

function statusRenderer(
  hotInstance: HotInstance,
  TD: HTMLTableCellElement,
  row: number,
  col: number,
  prop: string | number,
  value: string,
  cellProperties: CellProperties
): void {
  Handsontable.renderers.TextRenderer.apply(this, [hotInstance, TD, row, col, prop, value, cellProperties]);
  TD.style.color = value === 'Active' ? 'green' : 'red';
}
```

### Type a custom editor

Extend `BaseEditorInstance` for full IDE support when writing custom editors:

```typescript
import { BaseEditor } from 'handsontable/editors';
import type { GridSettings } from 'handsontable';

class RatingEditor extends BaseEditor {
  override getValue(): string {
    return this.TEXTAREA?.value ?? '';
  }

  override setValue(newValue: string): void {
    if (this.TEXTAREA) {
      this.TEXTAREA.value = newValue;
    }
  }
}

const settings: GridSettings = {
  columns: [{ editor: RatingEditor as unknown as string }],
  licenseKey: 'non-commercial-and-evaluation',
};
```

### Type the HOT instance in a React ref

::: only-for react

```tsx
import { useRef } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import type { HotInstance, GridSettings } from 'handsontable';

export function Grid() {
  const hotRef = useRef<HotInstance | null>(null);

  const settings: GridSettings = {
    data: myData,
    licenseKey: 'non-commercial-and-evaluation',
  };

  return (
    <HotTable
      ref={hotRef}
      settings={settings}
    />
  );
}
```

:::

### Type the HOT instance in Angular

::: only-for angular

```typescript
import { Component, ViewChild } from '@angular/core';
import { HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';
import type { GridSettings } from 'handsontable';

@Component({
  standalone: true,
  imports: [HotTableModule],
  template: `<hot-table [settings]="gridSettings" />`,
})
export class GridComponent {
  @ViewChild(HotTableComponent) hotTable!: HotTableComponent;

  readonly gridSettings: GridSettings = {
    data: myData,
    licenseKey: 'non-commercial-and-evaluation',
  };
}
```

:::

## Related articles

**Related guides**

<div class="boxes-list">

- [Modules](@/guides/tools-and-building/modules/modules.md)
- [Custom plugins](@/guides/tools-and-building/custom-plugins/custom-plugins.md)
- [Cell editor](@/guides/cell-functions/cell-editor/cell-editor.md)
- [Cell renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md)

</div>

**Related API reference**

<div class="boxes-list">

- [Configuration options](@/api/options.md)
- [Hooks](@/api/hooks.md)
- [Core](@/api/core.md)

</div>
