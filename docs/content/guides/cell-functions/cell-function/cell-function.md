---
type: explanation
id: neoo8dhv
title: Cell functions
metaTitle: Cell functions - JavaScript Data Grid | Handsontable
description: Render, edit, and validate the contents of your cells, using Handsontable's cell functions. Quickly set up your cells, using cell types.
permalink: /cell-function
canonicalUrl: /cell-function
react:
  id: i2sqtwh6
  metaTitle: Cell functions - React Data Grid | Handsontable
angular:
  id: 377lnttu
  metaTitle: Cell functions - Angular Data Grid | Handsontable
vue:
  id: bc7idv59
  metaTitle: Cell functions - Vue Data Grid | Handsontable
searchCategory: Guides
category: Cell functions
---

A cell function is one of three components -- renderer, editor, or validator -- that controls how a cell displays, accepts, and validates data.

[[toc]]

## Overview

Every Handsontable cell has three associated functions that handle distinct concerns:

| Function | Role | Implemented as |
| --- | --- | --- |
| [`renderer`](@/guides/cell-functions/cell-renderer/cell-renderer.md) | Controls how a cell looks: DOM structure, CSS classes, HTML content | A plain function |
| [`editor`](@/guides/cell-functions/cell-editor/cell-editor.md) | Controls how a cell is edited: input element, keyboard handling, open/close lifecycle | A class extending `BaseEditor` |
| [`validator`](@/guides/cell-functions/cell-validator/cell-validator.md) | Decides whether a cell value is acceptable | A function or `RegExp` |

The three functions are **independent**. You can mix and match any combination: use the built-in numeric editor with a custom renderer, override just the validator while keeping a built-in type, or write all three from scratch.

### Function signatures

```js
// renderer — called for every visible cell on every render
renderer(hotInstance, td, row, col, prop, value, cellProperties)
// hotInstance  – Handsontable instance
// td           – HTMLTableCellElement to modify
// row, col     – visual row and column indexes
// prop         – data property name (string) or column index (number)
// value        – current cell value
// cellProperties – merged cell configuration object

// validator — may be synchronous or asynchronous
validator(value, callback)
// value    – value to validate
// callback – call with true (valid) or false (invalid)
// RegExp alternative: /pattern/.test(value) must return true

// editor — a class; see the Cell editor guide for the full lifecycle API
class MyEditor extends BaseEditor { ... }
```

`validator` is **optional**. If no validator is defined for a cell, the cell is skipped entirely during validation — afterValidate will not fire for it, and it will not contribute to the validation cycle.

### `allowInvalid`

By default, `allowInvalid: true` — invalid cells are accepted into the data source but marked with the `htInvalid` CSS class. Set `allowInvalid: false` to reject invalid values and keep the editor open until a valid value is entered.

## Cell types bundle all three

A [cell type](@/guides/cell-types/cell-type/cell-type.md) is a preset that assigns a matching `renderer`, `editor`, and `validator` together under a single `type` alias. Using `type: 'numeric'` is shorthand for:

```js
{
  renderer:  Handsontable.renderers.NumericRenderer,
  editor:    Handsontable.editors.NumericEditor,
  validator: Handsontable.validators.NumericValidator,
}
```

Built-in types: `text`, `numeric`, `checkbox`, `date`, `time`, `dropdown`, `autocomplete`, `password`, `handsontable`.

When you set an explicit `renderer`, `editor`, or `validator` alongside a `type`, the explicit function always takes precedence over the type for that function only:

```js
columns: [{
  type: 'numeric',      // sets NumericEditor + NumericValidator
  renderer: myRenderer, // overrides only NumericRenderer; editor and validator stay numeric
}]
```

**When to use a type vs individual functions:**

- Use `type` when you want the standard, bundled behavior for a data kind (numbers, dates, checkboxes).
- Override a single function from a type when one aspect needs customizing but the rest is fine as-is.
- Set individual `renderer`/`editor`/`validator` directly when no built-in type fits or you need full control.

## Configuration priority

Cell functions resolve using the cascading configuration model. The most specific level wins:

```
cell[row][col]  >  column  >  global (root settings)
```

::: only-for javascript

```js
new Handsontable(container, {
  type: 'text',               // global fallback for all cells
  columns: [
    { type: 'numeric' },      // overrides global for all cells in column 0
    { type: 'text' },         // same as global for column 1
  ],
  cell: [
    { row: 0, col: 0, type: 'checkbox' }, // overrides column setting for cell [0, 0] only
  ],
});
```

:::

::: only-for react

```jsx
<HotTable
  type="text"
  columns={[
    { type: 'numeric' },      // overrides global for all cells in column 0
    { type: 'text' },         // same as global for column 1
  ]}
  cell={[
    { row: 0, col: 0, type: 'checkbox' }, // overrides column setting for cell [0, 0] only
  ]}
/>
```

:::

::: only-for angular

```ts
settings: GridSettings = {
  type: 'text',               // global fallback for all cells
  columns: [
    { type: 'numeric' },      // overrides global for all cells in column 0
    { type: 'text' },         // same as global for column 1
  ],
  cell: [
    { row: 0, col: 0, type: 'checkbox' }, // overrides column setting for cell [0, 0] only
  ],
};
```

:::


## Mixing renderer, editor, and validator

The example below shows a product inventory table. Each column uses a different function configuration:

- **Product** — `type: 'text'` bundles text renderer, text editor, and no validator.
- **Price** — `type: 'numeric'` bundles numeric renderer (formatted as currency), numeric editor, and numeric validator.
- **Stock** — custom `renderer` (progress bar), built-in `'numeric'` editor, and a custom range `validator`. All three come from different sources.

::: only-for javascript

::: example #example1 --js 1 --ts 2 --css 3

@[code](@/content/guides/cell-functions/cell-function/javascript/example1.js)
@[code](@/content/guides/cell-functions/cell-function/javascript/example1.ts)
@[code](@/content/guides/cell-functions/cell-function/javascript/example1.css)

:::

:::

::: only-for react

::: example #example1 :react --css 1 --js 2 --ts 3

@[code](@/content/guides/cell-functions/cell-function/react/example1.css)
@[code](@/content/guides/cell-functions/cell-function/react/example1.jsx)
@[code](@/content/guides/cell-functions/cell-function/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/cell-functions/cell-function/angular/example1.ts)
@[code](@/content/guides/cell-functions/cell-function/angular/example1.html)

:::

:::

Double-click any **Stock** cell to edit it with the numeric editor. The bar renderer updates on save. Enter a value outside 0–1000 to see the validator reject it (cell turns red when `allowInvalid: false`).

## Performance

Renderers are called separately for every displayed cell on every table render. A table can render many times during its lifetime — after scrolling, sorting, editing, and more. Keep `renderer` functions as simple and fast as possible to avoid performance drops, especially with large datasets.

## Getting cell functions programmatically

Use [`getCellMeta(row, col)`](@/api/core.md#getcellmeta) to read all properties of a cell at once, or the dedicated getters for individual functions:

::: only-for javascript

```js
const cellProperties = hot.getCellMeta(0, 0);

cellProperties.renderer;   // renderer function
cellProperties.editor;     // editor class
cellProperties.validator;  // validator function or RegExp
cellProperties.type;       // cell type string
```

:::

::: only-for react

```jsx
const hot = hotRef.current.hotInstance;
const cellProperties = hot.getCellMeta(0, 0);

cellProperties.renderer;   // renderer function
cellProperties.editor;     // editor class
cellProperties.validator;  // validator function or RegExp
cellProperties.type;       // cell type string
```

:::

::: only-for angular

```ts
const cellProperties = this.hotTable.hotInstance.getCellMeta(0, 0);

const renderer = cellProperties.renderer;   // renderer function
const editor = cellProperties.editor;       // editor class
const validator = cellProperties.validator; // validator function or RegExp
const type = cellProperties.type;           // cell type string
```

:::

Dedicated getters:

| Method | Returns |
| --- | --- |
| [`getCellRenderer(row, col)`](@/api/core.md#getcellrenderer) | The resolved renderer function for the cell |
| [`getCellEditor(row, col)`](@/api/core.md#getcelleditor) | The resolved editor class for the cell |
| [`getCellValidator(row, col)`](@/api/core.md#getcellvalidator) | The resolved validator function or `RegExp` for the cell |

If a cell's functions are defined through a cell type, the getters return the resolved functions, not the type string:

::: only-for javascript

```js
const hot = new Handsontable(container, {
  columns: [{ type: 'numeric' }],
});

const cellProperties = hot.getCellMeta(0, 0);

cellProperties.renderer;   // numericRenderer function
cellProperties.editor;     // NumericEditor class
cellProperties.validator;  // numericValidator function
cellProperties.type;       // 'numeric'
```

:::

::: only-for react

::: tip

To call these methods, access the Handsontable instance through the `HotTable` ref's `hotInstance` property. See [Instance methods](@/guides/getting-started/react-methods/react-methods.md) for details.

:::

```jsx
const ExampleComponent = () => {
  const hotRef = useRef(null);

  useEffect(() => {
    const hot = hotRef.current.hotInstance;
    const cellProperties = hot.getCellMeta(0, 0);

    cellProperties.renderer;   // numericRenderer function
    cellProperties.editor;     // NumericEditor class
    cellProperties.validator;  // numericValidator function
    cellProperties.type;       // 'numeric'
  });

  return <HotTable ref={hotRef} columns={[{ type: 'numeric' }]} />;
};
```

:::

::: only-for angular

```ts
import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { HotTableComponent } from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example',
  template: '<hot-table [settings]="settings"></hot-table>',
  standalone: false,
})
export class AppComponent implements AfterViewInit {
  @ViewChild(HotTableComponent) hotTable!: HotTableComponent;

  settings = {
    columns: [{ type: 'numeric' }],
  };

  ngAfterViewInit() {
    const hot = this.hotTable.hotInstance;
    const cellProperties = hot.getCellMeta(0, 0);

    const renderer = cellProperties.renderer;   // numericRenderer function
    const editor = cellProperties.editor;       // NumericEditor class
    const validator = cellProperties.validator; // numericValidator function
    const type = cellProperties.type;           // 'numeric'
  }
}
```

:::

## Related articles

**Related guides**

<div class="boxes-list">

- [Cell editor](@/guides/cell-functions/cell-editor/cell-editor.md)
- [Cell renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md)
- [Cell validator](@/guides/cell-functions/cell-validator/cell-validator.md)
- [Cell type](@/guides/cell-types/cell-type/cell-type.md)

</div>

**Configuration options**

- Configuration options:
  - [`editor`](@/api/options.md#editor)
  - [`renderer`](@/api/options.md#renderer)
  - [`type`](@/api/options.md#type)
  - [`validator`](@/api/options.md#validator)
  - [`allowInvalid`](@/api/options.md#allowinvalid)
  - [`valueFormatter`](@/api/options.md#valueformatter)
- Core methods:
  - [`destroyEditor()`](@/api/core.md#destroyeditor)
  - [`getActiveEditor()`](@/api/core.md#getactiveeditor)
  - [`getCellEditor()`](@/api/core.md#getcelleditor)
  - [`getCellMeta()`](@/api/core.md#getcellmeta)
  - [`getCellMetaAtRow()`](@/api/core.md#getcellmetaatrow)
  - [`getCellsMeta()`](@/api/core.md#getcellsmeta)
  - [`getCellRenderer()`](@/api/core.md#getcellrenderer)
  - [`getCellValidator()`](@/api/core.md#getcellvalidator)
  - [`setCellMeta()`](@/api/core.md#setcellmeta)
  - [`setCellMetaObject()`](@/api/core.md#setcellmetaobject)
  - [`removeCellMeta()`](@/api/core.md#removecellmeta)
- Hooks:
  - [`afterBeginEditing`](@/api/hooks.md#afterbeginediting)
  - [`afterGetCellMeta`](@/api/hooks.md#aftergetcellmeta)
  - [`afterGetColumnHeaderRenderers`](@/api/hooks.md#aftergetcolumnheaderrenderers)
  - [`afterGetRowHeaderRenderers`](@/api/hooks.md#aftergetrowheaderrenderers)
  - [`afterValidate`](@/api/hooks.md#aftervalidate)
  - [`afterRenderer`](@/api/hooks.md#afterrenderer)
  - [`beforeGetCellMeta`](@/api/hooks.md#beforegetcellmeta)
  - [`beforeRenderer`](@/api/hooks.md#beforerenderer)
  - [`beforeValidate`](@/api/hooks.md#beforevalidate)

## Related

- [Cell renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md) -- how to control cell display using renderer functions
- [Cell editor](@/guides/cell-functions/cell-editor/cell-editor.md) -- how to control cell editing using editor classes
- [Cell validator](@/guides/cell-functions/cell-validator/cell-validator.md) -- how to enforce data rules using validator functions
