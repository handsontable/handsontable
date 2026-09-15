---
title: Core
metaTitle: Core API reference - JavaScript Data Grid | Handsontable
permalink: /api/core
canonicalUrl: /api/core
searchCategory: API Reference
hotPlugin: false
editLink: false
id: o9civnqe
description: A complete list of the public API methods of Handsontable's core that let you control your data grid programmatically.
react:
  id: 6kcorabp
  metaTitle: Core methods API reference - React Data Grid | Handsontable
angular:
  id: a8m3k9xz
  metaTitle: Core methods API reference - Angular Data Grid | Handsontable
---

[[toc]]

## Description

The `Handsontable` class (known as the `Core`) lets you modify the grid's behavior by using Handsontable's public API methods.

::: only-for react
To use these methods, associate a Handsontable instance with your instance
of the [`HotTable` component](@/guides/getting-started/installation/installation.md#_4-use-the-hottable-component),
by using React's `ref` feature (read more on the [Instance methods](@/guides/getting-started/react-methods/react-methods.md) page).
:::

::: only-for angular
To use these methods, associate a Handsontable instance with your instance
of the [`HotTable` component](@/guides/getting-started/installation/installation.md#5-use-the-hottable-component),
by using `@ViewChild` decorator (read more on the [Instance access](@/guides/getting-started/angular-hot-instance/angular-hot-instance.md) page).
:::

## How to call a method

::: only-for javascript
```js
// create a Handsontable instance
const hot = new Handsontable(document.getElementById('example'), options);

// call a method
hot.setDataAtCell(0, 0, 'new value');
```
:::

::: only-for react
```jsx
import { useRef } from 'react';

const hotTableComponent = useRef(null);

<HotTable
  // associate your `HotTable` component with a Handsontable instance
  ref={hotTableComponent}
  settings={options}
/>

// access the Handsontable instance, under the `.current.hotInstance` property
// call a method
hotTableComponent.current.hotInstance.setDataAtCell(0, 0, 'new value');
```
:::

::: only-for angular
```ts
import { Component, ViewChild, AfterViewInit } from "@angular/core";
import {
  GridSettings,
  HotTableComponent,
  HotTableModule,
} from "@handsontable/angular-wrapper";

`@Component`({
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [settings]="gridSettings" />
  </div>`,
})
export class ExampleComponent implements AfterViewInit {
  `@ViewChild`(HotTableComponent, { static: false })
  readonly hotTable!: HotTableComponent;

  readonly gridSettings = <GridSettings>{
    columns: [{}],
  };

  ngAfterViewInit(): void {
    // Access the Handsontable instance
    // Call a method
    this.hotTable?.hotInstance?.setDataAtCell(0, 0, "new value");
  }
}
```
:::


## Options

### activeHeaderClassName

::: ask-about-api activeHeaderClassName|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L188

:::

_core.activeHeaderClassName : string_

The `activeHeaderClassName` option lets you add a CSS class name
to every currently-active, currently-selected header (when a whole column or row is selected).

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

Read more:
- [`currentRowClassName`](@/api/options.md#currentrowclassname)
- [`currentColClassName`](@/api/options.md#currentcolclassname)
- [`currentHeaderClassName`](@/api/options.md#currentheaderclassname)
- [`invalidCellClassName`](@/api/options.md#invalidcellclassname)
- [`readOnlyCellClassName`](@/api/options.md#readonlycellclassname)
- [`commentedCellClassName`](@/api/options.md#commentedcellclassname)
- [`noWordWrapClassName`](@/api/options.md#nowordwrapclassname)
- [`TableClassName`](@/api/options.md#tableclassname)
- [`className`](@/api/options.md#classname)

**Default**: <code>"ht__active_highlight"</code>  
**Since**: 0.38.2  
**Example**  
```js
// add an `ht__active_highlight` CSS class name
// to every currently-active, currently-selected header
activeHeaderClassName: 'ht__active_highlight',
```


### allowEmpty

::: ask-about-api allowEmpty|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L240

:::

_core.allowEmpty : boolean_

The `allowEmpty` option determines whether Handsontable accepts the following values:
- `null`
- `undefined`
- `''`

You can set the `allowEmpty` option to one of the following:

| Setting          | Description                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `true` (default) | - Accept `null`, `undefined` and `''` values<br>- Mark cells that contain `null`, `undefined` or `''` values as `valid`              |
| `false`          | - Don't accept `null`, `undefined` and `''` values<br>- Mark cells that contain `null`, `undefined` or `''` values with as `invalid` |

::: tip
The [`allowEmpty`](@/api/options.md#allowempty) option only takes effect when the cell has a [`validator`](@/api/options.md#validator).
You can set a validator directly, or use a [`type`](@/api/options.md#type) that comes with a built-in validator,
such as `numeric`, `date`, `time`, `autocomplete`, `dropdown`, or `multiSelect`.
Types without a built-in validator, such as `text`, `checkbox`, `password`, and `handsontable`,
ignore the `allowEmpty` option unless you also set a `validator`.
:::

This option can be set at any level of the [cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration):
the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options), the [`columns`](@/api/options.md#columns) level, the [`cells`](@/api/options.md#cells) level, and the [`cell`](@/api/options.md#cell) level.

**Default**: <code>true</code>  
**Example**  
```js
// allow empty values in each cell of the entire grid
allowEmpty: true,

// or
columns: [
  {
    type: 'date',
    dateFormat: { day: '2-digit', month: '2-digit', year: 'numeric' },
    // allow empty values in each cell of the 'date' column
    allowEmpty: true
  }
],

// or, using the `cells` option
cells(row, col) {
  if (col === 2) {
    return { allowEmpty: false };
  }
},
```


### allowHtml

::: ask-about-api allowHtml|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L281

:::

_core.allowHtml : boolean_

The `allowHtml` option configures whether [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
and [`dropdown`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md) cells' [`source`](@/api/options.md#source) data
is treated as HTML.

You can set the `allowHtml` option to one of the following:

| Setting           | Description                                         |
| ----------------- | --------------------------------------------------- |
| `false` (default) | The [`source`](@/api/options.md#source) data is not treated as HTML |
| `true`            | The [`source`](@/api/options.md#source) data is treated as HTML     |

__Warning:__ Setting the `allowHtml` option to `true` can cause serious XSS vulnerabilities.
The [`sanitizer`](@/api/options.md#sanitizer) option does not apply to this content: `allowHtml` exists to render
the markup you supply, so sanitize the [`source`](@/api/options.md#source) items yourself before passing them in.

Read more:
- [Autocomplete cell type](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
- [Dropdown cell type](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md)
- [`source`](@/api/options.md#source)
- [`sanitizer`](@/api/options.md#sanitizer)

**Default**: <code>false</code>  
**Example**  
```js
columns: [
  {
  // set the `type` of each cell in this column to `autocomplete`
  type: 'autocomplete',
  // set options available in every `autocomplete` cell of this column
  source: ['<strong>foo</strong>', '<strong>bar</strong>']
  // use HTML in the `source` list
  allowHtml: true,
  },
],
```


### allowInsertColumn

::: ask-about-api allowInsertColumn|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L300

:::

_core.allowInsertColumn : boolean_

If set to `true`, the `allowInsertColumn` option adds the following menu items to the [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md):
- **Insert column left**
- **Insert column right**

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>true</code>  
**Example**  
```js
// hide the 'Insert column left' and 'Insert column right' menu items from the context menu
allowInsertColumn: false,
```


### allowInsertRow

::: ask-about-api allowInsertRow|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L319

:::

_core.allowInsertRow : boolean_

If set to `true`, the `allowInsertRow` option adds the following menu items to the [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md):
- **Insert row above**
- **Insert row below**

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>true</code>  
**Example**  
```js
// hide the 'Insert row above' and 'Insert row below' menu items from the context menu
allowInsertRow: false,
```


### allowInvalid

::: ask-about-api allowInvalid|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L350

:::

_core.allowInvalid : boolean_

The `allowInvalid` option determines whether Handsontable accepts values
that were marked as `invalid` by the [cell validator](@/guides/cell-functions/cell-validator/cell-validator.md).

You can set the `allowInvalid` option to one of the following:

| Setting          | Description                                                                                                                                                                        |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `true` (default) | - Accept `invalid` values<br>- Allow the user to close the [cell editor](@/guides/cell-functions/cell-editor/cell-editor.md) with `invalid` values<br>- Save `invalid` values into the data source                   |
| `false`          | - Don't accept `invalid` values<br>- Don't allow the user to close the [cell editor](@/guides/cell-functions/cell-editor/cell-editor.md) with `invalid` values<br>- Don't save `invalid` values into the data source |

Setting the `allowInvalid` option to `false` can be useful when used with the [Autocomplete strict mode](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md#autocomplete-strict-mode).

Read more:
- [Cell validator](@/guides/cell-functions/cell-validator/cell-validator.md)
- [Cell editor](@/guides/cell-functions/cell-editor/cell-editor.md)
- [Autocomplete strict mode](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md#autocomplete-strict-mode)

**Default**: <code>true</code>  
**Example**  
```js
// don't accept `invalid` values
// don't allow the user to close the cell editor
// don't save `invalid` values into the data source
allowInvalid: false,
```


### allowRemoveColumn

::: ask-about-api allowRemoveColumn|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L371

:::

_core.allowRemoveColumn : boolean_

If set to `true`, the `allowRemoveColumn` option adds the following menu items to the [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md):
- **Remove column**

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

Read more:
- [Context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)

**Default**: <code>true</code>  
**Example**  
```js
// hide the 'Remove column' menu item from the context menu
allowRemoveColumn: false,
```


### allowRemoveRow

::: ask-about-api allowRemoveRow|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L392

:::

_core.allowRemoveRow : boolean_

If set to `true`, the `allowRemoveRow` option adds the following menu items to the [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md):
- **Remove row**

Read more:
- [Context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>true</code>  
**Example**  
```js
// hide the 'Remove row' menu item from the context menu
allowRemoveRow: false,
```


### ariaTags

::: ask-about-api ariaTags|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L403

:::

_core.ariaTags : boolean_

If set to `true`, the accessibility-related ARIA tags will be added to the table. If set to `false`, they
will be omitted.
Defaults to `true`.

**Default**: <code>true</code>  
**Since**: 14.0.0  


### autoWrapCol

::: ask-about-api autoWrapCol|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L526

:::

_core.autoWrapCol : boolean_

| Setting           | Description                                                                                                                                                                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `false` (default) | When you select a bottom-most cell, pressing <kbd>**↓**</kbd> doesn't do anything.<br><br>When you select a top-most cell, pressing <kbd>**↑**</kbd> doesn't do anything.                                                                    |
| `true`            | When you select a bottom-most cell, pressing <kbd>**↓**</kbd> takes you to the top-most cell of the next column.<br><br>When you select a top-most cell, pressing <kbd>**↑**</kbd> takes you to the bottom-most cell of the previous column. |

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>false</code>  
**Example**  
```js
// when you select a bottom-most cell, pressing ⬇ doesn't do anything
// when you select a top-most cell, pressing ⬆ doesn't do anything
autoWrapCol: false, // default setting

// when you select a bottom-most cell, pressing ⬇ takes you to the top-most cell of the next column
// when you select a top-most cell, pressing ⬆ takes you to the bottom-most cell of the previous column
autoWrapCol: true,
```


### autoWrapRow

::: ask-about-api autoWrapRow|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L554

:::

_core.autoWrapRow : boolean_

| Setting           | Description                                                                                                                                                                                                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `false` (default) | When you select the first cell of a row, pressing <kbd>**←**</kbd>* (or <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd>\*\*) doesn't do anything.<br><br>When you select the last cell of a row, pressing <kbd>**→**</kbd>* (or <kbd>**Tab**</kbd>**) doesn't do anything.                                                  |
| `true`            | When you select the first cell of a row, pressing <kbd>**←**</kbd>* (or <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd>\*\*) takes you to the last cell of the row above.<br><br>When you select the last cell of a row, pressing <kbd>**→**</kbd>* (or <kbd>**Tab**</kbd>**) takes you to the first cell of the row below. |

\* The exact key depends on your [`layoutDirection`](@/api/options.md#layoutdirection) configuration.<br>
\*\* Unless [`tabNavigation`](@/api/options.md#tabnavigation) is set to `false`.

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>false</code>  
**Example**  
```js
// when you select the first cell of a row, pressing ⬅ (or Shift+Tab) doesn't do anything
// when you select the last cell of a row, pressing ➡ (or Tab) doesn't do anything
autoWrapRow: false, // default setting

// when you select the first cell of a row, pressing ⬅ (or Shift+Tab) takes you to the last cell of the row above
// when you select the last cell of a row, pressing ➡ (or Tab) takes you to the first cell of the row below
autoWrapRow: true,
```


### cell

::: ask-about-api cell|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L621

:::

_core.cell : Array&lt;Array&gt;_

The `cell` option lets you apply [configuration options](@/guides/getting-started/configuration-options/configuration-options.md) to individual cells.

The `cell` option overwrites the [top-level grid options](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options),
and the [`columns`](@/api/options.md#columns) options.

Each entry's `row` and `col` are **visual** indexes. This differs from the [`cells`](@/api/options.md#cells)
option, whose `row` and `column` are physical indexes.

Read more:
- [Configuration options: Setting cell options](@/guides/getting-started/configuration-options/configuration-options.md#set-cell-options)
- [`columns`](@/api/options.md#columns)
- [`cells`](@/api/options.md#cells)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>[]</code>  
**Example**  
```js
// set the `cell` option to an array of objects
cell: [
  // make the cell with coordinates (0, 0) read-only
  {
    row: 0,
    col: 0,
    readOnly: true
  }
],
```


### cells

::: ask-about-api cells|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L670

:::

_core.cells : function_

The `cells` option lets you apply any other [configuration options](@/guides/getting-started/configuration-options/configuration-options.md) to
individual grid elements (columns, rows, cells), based on any logic you implement.

The `cells` option overwrites all other options (including options set by [`columns`](@/api/options.md#columns) and [`cell`](@/api/options.md#cell)).
It takes the following parameters:

| Parameter | Required | Type             | Description                                                                                                                                                                                                                                                                                                                             |
| --------- | -------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `row`     | Yes      | Number           | A physical row index                                                                                                                                                                                                                                                                                                                    |
| `column`  | Yes      | Number           | A physical column index                                                                                                                                                                                                                                                                                                                 |
| `prop`    | No       | String \| Number | If [`data`](@/api/options.md#data) is set to an [array of arrays](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-arrays), `prop` is the same number as `column`.<br><br>If [`data`](@/api/options.md#data) is set to an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects), `prop` is a property name for the column's data object. |

Inside a regular (non-arrow) `cells` function, `this` is the cell meta object. Its
`this.instance` property is the Handsontable instance, so you can call core API methods
such as `this.instance.toVisualRow(row)` or `this.instance.toVisualColumn(column)` (as in
the example below). Arrow functions (`cells: () => {}`) do not bind `this`, so
`this.instance` is not available inside them – use a regular or shorthand function instead.

Read more:
- [Configuration options: Implementing custom logic](@/guides/getting-started/configuration-options/configuration-options.md#implement-custom-logic)
- [Configuration options: Setting row options](@/guides/getting-started/configuration-options/configuration-options.md#set-row-options)
- [`columns`](@/api/options.md#columns)
- [`cell`](@/api/options.md#cell)

**Default**: <code>undefined</code>  
**Example**  
```js
// set the `cells` option to your custom function
cells(row, column, prop) {
  const cellProperties = { readOnly: false };
  const visualRowIndex = this.instance.toVisualRow(row);
  const visualColIndex = this.instance.toVisualColumn(column);

  if (visualRowIndex === 0 && visualColIndex === 0) {
    cellProperties.readOnly = true;
  } else {
    cellProperties.readOnly = false;
  }

  return cellProperties;
},
```


### checkedTemplate

::: ask-about-api checkedTemplate|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L720

:::

_core.checkedTemplate : boolean | string | number_

The `checkedTemplate` option lets you configure what value
a checked [`checkbox`](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md) cell has.

You can set the `checkedTemplate` option to one of the following:

| Setting          | Description                                                                                                                                                                              |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `true` (default) | If a [`checkbox`](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md) cell is checked,<br>the `getDataAtCell` method for this cell returns `true`                  |
| A string         | If a [`checkbox`](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md) cell is checked,<br>the `getDataAtCell` method for this cell returns a string of your choice |

::: warning
When you set `checkedTemplate` to a custom string value (e.g. `'Yes'`), using `true` in your data source to
represent a checked state is no longer valid. Only the exact custom string value matches a checked checkbox.
Pair `checkedTemplate` with [`uncheckedTemplate`](@/api/options.md#uncheckedtemplate) to define both states explicitly.
:::

This option can be set at any level of the [cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration):
the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options), the [`columns`](@/api/options.md#columns) level, the [`cells`](@/api/options.md#cells) level, and the [`cell`](@/api/options.md#cell) level.

Read more:
- [Checkbox cell type: Checkbox template](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md#checkbox-template)
- [`uncheckedTemplate`](@/api/options.md#uncheckedtemplate)

**Default**: <code>true</code>  
**Example**  
```js
columns: [
  {
    // set the `type` of each cell in this column to `checkbox`
    // when checked, the cell's value is `true`
    // when unchecked, the cell's value is `false`
    type: 'checkbox',
  },
  {
    // set the `type` of each cell in this column to `checkbox`
    type: 'checkbox',
    // when checked, the cell's value is `'Yes'`
    checkedTemplate: 'Yes',
    // when unchecked, the cell's value is `'No'`
    uncheckedTemplate: 'No'
 }
],
```


### className

::: ask-about-api className|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L764

:::

_core.className : string | Array&lt;string&gt;_

The `className` option lets you add CSS class names to every cell that has this option set.

You can set the `className` option to one of the following:

| Setting             | Description                                         |
| ------------------- | --------------------------------------------------- |
| A string            | Add a single CSS class name to every matching cell  |
| An array of strings | Add multiple CSS class names to every matching cell |

::: tip
Don't change the `className` metadata of the [column summary](@/guides/columns/column-summary/column-summary.md) row.
To style the summary row, use the class name assigned automatically by the [`ColumnSummary`](@/api/columnSummary.md) plugin: `columnSummaryResult`.
:::

To apply different CSS class names on different levels, use Handsontable's [cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration).

Read more:
- [Configuration options: Cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration)
- [`currentRowClassName`](@/api/options.md#currentrowclassname)
- [`currentColClassName`](@/api/options.md#currentcolclassname)
- [`currentHeaderClassName`](@/api/options.md#currentheaderclassname)
- [`activeHeaderClassName`](@/api/options.md#activeheaderclassname)
- [`invalidCellClassName`](@/api/options.md#invalidcellclassname)
- [`placeholderCellClassName`](@/api/options.md#placeholdercellclassname)
- [`commentedCellClassName`](@/api/options.md#commentedcellclassname)
- [`noWordWrapClassName`](@/api/options.md#nowordwrapclassname)
- [`readOnlyCellClassName`](@/api/options.md#readonlycellclassname)
- [`TableClassName`](@/api/options.md#tableclassname)

**Default**: <code>undefined</code>  
**Example**  
```js
// add a `your-class-name` CSS class name to every cell
className: 'your-class-name',

// add `first-class-name` and `second-class-name` CSS class names to every cell
className: ['first-class-name', 'second-class-name'],
```


### colHeaders

::: ask-about-api colHeaders|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L804

:::

_core.colHeaders : boolean | Array&lt;string&gt; | function_

The `colHeaders` option configures your grid's column headers.

You can set the `colHeaders` option to one of the following:

| Setting  | Description                                                          |
| -------- | -------------------------------------------------------------------- |
| `true`   | Enable the default column headers ('A', 'B', 'C', ...)               |
| `false`  | Disable column headers                                               |
| An array | Define your own column headers (e.g. `['One', 'Two', 'Three', ...]`) |
| A function | Define your own column headers, using a function                     |

To set the header label of an individual column, use that column's [`title`](@/api/options.md#title) option.

Read more:
- [Column header](@/guides/columns/column-header/column-header.md)
- [`title`](@/api/options.md#title)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>null</code>  
**Example**  
```js
// enable the default column headers
colHeaders: true,

// set your own column headers
colHeaders: ['One', 'Two', 'Three'],

// set your own column headers, using a function
colHeaders: function(visualColumnIndex) {
  return `${visualColumnIndex} + : AB`;
},
```


### colorScheme

::: ask-about-api colorScheme|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6100

:::

_core.colorScheme : string | undefined_

The `colorScheme` option sets the color scheme of the grid without declaring a theme.

You can set it to one of the following:

| Setting               | Description                                                     |
| --------------------- | --------------------------------------------------------------- |
| `undefined` (default) | Use the color scheme of the current theme                        |
| `'light'`             | Always render the light color scheme                             |
| `'dark'`              | Always render the dark color scheme                              |
| `'auto'`              | Follow the color scheme of the operating system                  |

The option is a per-instance override. It applies on top of the current theme, so the theme
itself stays unchanged and other grids that use the same theme keep their own color scheme.
You can change it at runtime with `updateSettings()`.

The option requires the theme engine, so it has no effect when the theme comes from a CSS
class name (the [`theme`](@/api/options.md#theme) option set to a string, or an `ht-theme-*` class on the
container element). In that case, use the theme's dark class name instead.

An unsupported value is ignored with a console warning rather than throwing.

Read more:
- [Themes](@/guides/styling/themes/themes.md)
- [`density`](@/api/options.md#density)
- [`theme`](@/api/options.md#theme)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Since**: 18.1.0  
**Example**  
```js
// Render the grid in dark mode, without declaring a theme
const hot = new Handsontable(container, {
  colorScheme: 'dark',
});
```
**Example**  
```js
// Switch the color scheme at runtime
hot.updateSettings({
  colorScheme: 'auto',
});
```


### columnHeaderHeight

::: ask-about-api columnHeaderHeight|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L874

:::

_core.columnHeaderHeight : number | Array&lt;number&gt;_

The `columnHeaderHeight` option configures the height of column headers.

You can set the `columnHeaderHeight` option to one of the following:

| Setting  | Description                                         |
| -------- | --------------------------------------------------- |
| A number | Set the same height for every column header         |
| An array | Set different heights for individual column headers |

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Example**  
```js
// set the same height for every column header
columnHeaderHeight: 25,

// set different heights for individual column headers
columnHeaderHeight: [25, 30, 55],
```


### columns

::: ask-about-api columns|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L932

:::

_core.columns : Array&lt;object&gt; | function_

The `columns` option lets you apply any other [configuration options](@/guides/getting-started/configuration-options/configuration-options.md) to individual columns (or ranges of columns).

You can set the `columns` option to one of the following:
- An array of objects (each object represents one column)
- A function that returns an array of objects

The `columns` option overwrites the [top-level grid options](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).

When you use `columns`, the [`startCols`](@/api/options.md#startcols), [`minCols`](@/api/options.md#mincols), and [`maxCols`](@/api/options.md#maxcols) options are ignored.

Read more:
- [Configuration options: Setting column options](@/guides/getting-started/configuration-options/configuration-options.md#set-column-options)
- [`startCols`](@/api/options.md#startcols)
- [`minCols`](@/api/options.md#mincols)
- [`maxCols`](@/api/options.md#maxcols)
- [`data`](@/api/options.md#data)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Example**  
```js
// set the `columns` option to an array of objects
// each object represents one column
columns: [
  {
    // column options for the first (by physical index) column
    type: 'numeric',
    numericFormat: {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  },
  {
    // column options for the second (by physical index) column
    type: 'text',
    readOnly: true
  }
],

// or set the `columns` option to a function, based on physical indexes
columns(index) {
  return {
    type: index > 0 ? 'numeric' : 'text',
    readOnly: index < 1
  }
}
```


### colWidths

::: ask-about-api colWidths|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1112

:::

_core.colWidths : number | Array&lt;number&gt; | string | Array&lt;string&gt; | Array&lt;undefined&gt; | function_

The `colWidths` option sets columns' widths, in pixels.

The default column width is 50px. To change it, set the `colWidths` option to one of the following:

| Setting     | Description                                                                                          | Example                                                           |
| ----------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| A number    | Set the same width for every column                                                                  | `colWidths: 100`                                                  |
| A string    | Set the same width for every column                                                                  | `colWidths: '100px'`                                              |
| An array    | Set widths separately for each column                                                                | `colWidths: [100, 120, undefined]`                                |
| A function  | Set column widths dynamically,<br>on each render                                                     | `colWidths(visualColumnIndex) { return visualColumnIndex * 10; }` |
| `undefined` | Used by the [modifyColWidth](@/api/hooks.md#modifycolwidth) hook,<br>to detect column width changes. | `colWidths: undefined`                                            |

Setting `colWidths` even for a single column disables the [AutoColumnSize](@/api/autoColumnSize.md) plugin
for all columns. For this reason, if you use `colWidths`, we recommend you set a width for each one
of your columns. Otherwise, every column with an undefined width defaults back to 50px,
which may cut longer columns names.

Read more:
- [Column width](@/guides/columns/column-width/column-width.md)
- [Hooks: `modifyColWidth`](@/api/hooks.md#modifycolwidth)
- [`autoColumnSize`](@/api/options.md#autocolumnsize)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Example**  
```js
// set every column's width to 100px
colWidths: 100,

// set every column's width to 100px
colWidths: '100px',

// set the first (by visual index) column's width to 100
// set the second (by visual index) column's width to 120
// set the third (by visual index) column's width to `undefined`, so that it defaults to 50px
// set any other column's width to the default 50px (note that longer cell values and column names can get cut)
colWidths: [100, 120, undefined],

// set each column's width individually, using a function
colWidths(visualColumnIndex) {
  return visualColumnIndex * 10;
},
```


### commentedCellClassName

::: ask-about-api commentedCellClassName|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1142

:::

_core.commentedCellClassName : string_

The `commentedCellClassName` option lets you add a CSS class name to cells
that have comments.

Read more:
- [Comments](@/guides/cell-features/comments/comments.md)
- [`comments`](@/api/options.md#comments)
- [`readOnlyCellClassName`](@/api/options.md#readonlycellclassname)
- [`currentRowClassName`](@/api/options.md#currentrowclassname)
- [`currentHeaderClassName`](@/api/options.md#currentheaderclassname)
- [`activeHeaderClassName`](@/api/options.md#activeheaderclassname)
- [`invalidCellClassName`](@/api/options.md#invalidcellclassname)
- [`placeholderCellClassName`](@/api/options.md#placeholdercellclassname)
- [`readOnlyCellClassName`](@/api/options.md#readonlycellclassname)
- [`noWordWrapClassName`](@/api/options.md#nowordwrapclassname)
- [`TableClassName`](@/api/options.md#tableclassname)
- [`className`](@/api/options.md#classname)

**Default**: <code>"htCommentCell"</code>  
**Example**  
```js
// add a `has-comment` CSS class name
// to each cell that has a comment
commentedCellClassName: 'has-comment',
```


### copyable

::: ask-about-api copyable|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1311

:::

_core.copyable : boolean_

The `copyable` option determines whether a cell's value can be copied to the clipboard or not.

You can set the `copyable` option to one of the following:

| Setting                                                                                                        | Description                                                                                                            |
| -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `true` (default)                                                                                               | - On pressing <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**C**</kbd>, add the cell's value to the clipboard         |
| `false`<br>(default for the [`password`](@/guides/cell-types/password-cell-type/password-cell-type.md) [cell type](@/api/options.md#type))        | - On pressing <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**C**</kbd>, add an empty string (`""`) to the clipboard   |

Read more:
- [Clipboard](@/guides/cell-features/clipboard/clipboard.md)
- [Configuration options: Cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration)
- [Password cell type](@/guides/cell-types/password-cell-type/password-cell-type.md)

**Default**: <code>true</code>  
**Example**  
```js
// enable copying for each cell of the entire grid
copyable: true,

// enable copying for individual columns
columns: [
  {
    // enable copying for each cell of this column
    copyable: true
  },
  {
    // disable copying for each cell of this column
    copyable: false
  }
]

// enable copying for specific cells
cell: [
  {
    col: 0,
    row: 0,
    // disable copying for cell (0, 0)
    copyable: false,
  }
],
```


### currentColClassName

::: ask-about-api currentColClassName|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1412

:::

_core.currentColClassName : string_

The `currentColClassName` option lets you add a CSS class name
to each cell of the currently-visible, currently-selected columns.

Read more:
- [`currentRowClassName`](@/api/options.md#currentrowclassname)
- [`currentHeaderClassName`](@/api/options.md#currentheaderclassname)
- [`activeHeaderClassName`](@/api/options.md#activeheaderclassname)
- [`invalidCellClassName`](@/api/options.md#invalidcellclassname)
- [`placeholderCellClassName`](@/api/options.md#placeholdercellclassname)
- [`readOnlyCellClassName`](@/api/options.md#readonlycellclassname)
- [`commentedCellClassName`](@/api/options.md#commentedcellclassname)
- [`noWordWrapClassName`](@/api/options.md#nowordwrapclassname)
- [`TableClassName`](@/api/options.md#tableclassname)
- [`className`](@/api/options.md#classname)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Example**  
```js
// add a `your-class-name` CSS class name
// to each cell of the currently-visible, currently-selected columns
currentColClassName: 'your-class-name',
```


### currentHeaderClassName

::: ask-about-api currentHeaderClassName|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1442

:::

_core.currentHeaderClassName : string_

The `currentHeaderClassName` option lets you add a CSS class name
to every currently-visible, currently-selected header.

Read more:
- [`currentRowClassName`](@/api/options.md#currentrowclassname)
- [`currentColClassName`](@/api/options.md#currentcolclassname)
- [`activeHeaderClassName`](@/api/options.md#activeheaderclassname)
- [`invalidCellClassName`](@/api/options.md#invalidcellclassname)
- [`readOnlyCellClassName`](@/api/options.md#readonlycellclassname)
- [`commentedCellClassName`](@/api/options.md#commentedcellclassname)
- [`noWordWrapClassName`](@/api/options.md#nowordwrapclassname)
- [`TableClassName`](@/api/options.md#tableclassname)
- [`className`](@/api/options.md#classname)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>"ht__highlight"</code>  
**Example**  
```js
// add an `ht__highlight` CSS class name
// to every currently-visible, currently-selected header
currentHeaderClassName: 'ht__highlight',
```


### currentRowClassName

::: ask-about-api currentRowClassName|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1473

:::

_core.currentRowClassName : string_

The `currentRowClassName` option lets you add a CSS class name
to each cell of the currently-visible, currently-selected rows.

Read more:
- [`currentColClassName`](@/api/options.md#currentcolclassname)
- [`currentHeaderClassName`](@/api/options.md#currentheaderclassname)
- [`activeHeaderClassName`](@/api/options.md#activeheaderclassname)
- [`invalidCellClassName`](@/api/options.md#invalidcellclassname)
- [`placeholderCellClassName`](@/api/options.md#placeholdercellclassname)
- [`readOnlyCellClassName`](@/api/options.md#readonlycellclassname)
- [`commentedCellClassName`](@/api/options.md#commentedcellclassname)
- [`noWordWrapClassName`](@/api/options.md#nowordwrapclassname)
- [`TableClassName`](@/api/options.md#tableclassname)
- [`className`](@/api/options.md#classname)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Example**  
```js
// add a `your-class-name` CSS class name
// to each cell of the currently-visible, currently-selected rows
currentRowClassName: 'your-class-name',
```


### data

::: ask-about-api data|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1676

:::

_core.data : Array&lt;Array&gt; | Array&lt;object&gt;_

The `data` option sets the initial [data](@/guides/getting-started/binding-to-data/binding-to-data.md) of your Handsontable instance.

Handsontable's data is bound to your source data by reference (i.e. when you edit Handsontable's data, your source data alters as well).

You can set the `data` option:
- Either to an [array of arrays](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-arrays).
- Or to an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects).

If you don't set the `data` option (or set it to `null`), Handsontable renders as an empty 5x5 grid by default.

When used inside the [`columns`](@/api/options.md#columns) option, `data` has a different meaning: it acts as a property name
(or a dot-separated path) pointing to the field in each data row object that this column reads from and writes to.
In this context, `data` is not the full dataset but a column accessor string.

Read more:
- [Binding to data](@/guides/getting-started/binding-to-data/binding-to-data.md)
- [`dataSchema`](@/api/options.md#dataschema)
- [`startRows`](@/api/options.md#startrows)
- [`startCols`](@/api/options.md#startcols)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Example**  
```js
// as an array of arrays
data: [
  ['A', 'B', 'C'],
  ['D', 'E', 'F'],
  ['G', 'H', 'J']
]

// as an array of objects
data: [
  {id: 1, name: 'Ted Right'},
  {id: 2, name: 'Frank Honest'},
  {id: 3, name: 'Joan Well'},
  {id: 4, name: 'Gail Polite'},
  {id: 5, name: 'Michael Fair'},
]

// as a column accessor inside `columns`
columns: [
  { data: 'id' },
  { data: 'name' }
]
```


### dataDotNotation

::: ask-about-api dataDotNotation|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1757

:::

_core.dataDotNotation : boolean_

If `true`, Handsontable will interpret the dots in the columns mapping as a nested object path. If your dataset contains
the dots in the object keys and you don't want Handsontable to interpret them as a nested object path, set this option to `false`.

The option only works when defined in the global table settings.

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>true</code>  
**Since**: 14.4.0  
**Example**  
```js
// All dots are interpreted as nested object paths
dataDotNotation: true,
data: [
  { id: 1, name: { first: 'Ted', last: 'Right' }, user: { address: '1234 Any Street' } },
],
columns={[
  { data: 'name.first' },
  { data: 'user.address' },
]},
```
```js
// All dots are interpreted as simple object keys
dataDotNotation: false,
data: [
  { id: 1, 'name.first': 'Ted', 'user.address': '1234 Any Street' },
],
columns={[
  { data: 'name.first' },
  { data: 'user.address' },
]},
```


### dataProvider

::: ask-about-api dataProvider|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1717

:::

_core.dataProvider : object_

When set, the table loads data from an async provider (e.g. a REST API) instead of a static `data` array.
Use the **object** form with every key defined: **`rowId`**, **`fetchRows`**, **`onRowsCreate`**, **`onRowsUpdate`**,
and **`onRowsRemove`**. All five are required on that object so paging, row identity, and create, update, and remove
map cleanly to your backend. Pair with **`pagination`** for server-side paging.
Valid cell edits apply at once; if **`onRowsUpdate`** fails or **`beforeRowsMutation`** blocks the update, affected cells roll back.

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Since**: 17.1.0  
**Example**  
```js
dataProvider: {
  rowId: 'id',
  fetchRows: async (queryParameters, { signal }) => {
    const { page, pageSize, sort, filters } = queryParameters;
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });

    if (sort) {
      params.set('sortBy', sort.prop);
      params.set('sortDir', sort.order);
    }

    const res = await fetch(`/api/products?${params}`, { signal });
    const json = await res.json();

    return { rows: json.data, totalRows: json.total };
  },
  onRowsCreate: async ({ position, referenceRowId, rowsAmount }) => { ... },
  onRowsUpdate: async (rows) => { ... },
  onRowsRemove: async (rowIds) => { ... },
},
```


### dataSchema

::: ask-about-api dataSchema|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1797

:::

_core.dataSchema : object | function_

When the [`data`](@/api/options.md#data) option is set to an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects)
(or is empty), the `dataSchema` option defines the structure of new rows.

Using the `dataSchema` option, you can start out with an empty grid.

You can set the `dataSchema` option to one of the following:
- An object
- A function

Read more:
- [Binding to data: Array of objects with custom data schema](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects-with-custom-data-schema)
- [Binding to data: Function data source and schema](@/guides/getting-started/binding-to-data/binding-to-data.md#function-data-source-and-schema)
- [`data`](@/api/options.md#data)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Example**  
```js
// with `dataSchema`, you can start with an empty grid
data: null,
dataSchema: {id: null, name: {first: null, last: null}, address: null},
colHeaders: ['ID', 'First Name', 'Last Name', 'Address'],
columns: [
  {data: 'id'},
  {data: 'name.first'},
  {data: 'name.last'},
  {data: 'address'}
],
startRows: 5,
minSpareRows: 1
```


### dateFormat

::: ask-about-api dateFormat|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1873

:::

_core.dateFormat : Intl.DateTimeFormatOptions_

Configures the date format for date cells using an
[`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat)
options object.

The locale is controlled separately via the [`locale`](@/api/options.md#locale) option.

::: tip Source data format
Source data must be in ISO 8601 date format (`YYYY-MM-DD`). Otherwise operations such
as sorting and filtering can be unstable or unpredictable. The `dateFormat` object affects only how dates are
displayed; the underlying value should remain ISO.

Time-related options (`hour`, `minute`, `second`, `timeStyle`, `hour12`, `hourCycle`,
`fractionalSecondDigits`) only affect display and always render midnight (`00:00:00`) for
`date`/`intl-date` cells, because their source data is date-only. For editable date *and*
time values, use the [`intl-datetime` cell type](@/guides/cell-types/datetime-cell-type/datetime-cell-type.md).
:::

**Style shortcuts:**

| Property     | Possible values                                    | Description                                              |
| ------------ | -------------------------------------------------- | -------------------------------------------------------- |
| `dateStyle`  | `'full'`, `'long'`, `'medium'`, `'short'`          | Date formatting style (expands to weekday, day, month, year, era) |

**Date-time component options:**

| Property                 | Possible values                                                                 | Description                          |
| ------------------------ | ------------------------------------------------------------------------------- | ------------------------------------ |
| `weekday`                | `'long'`, `'short'`, `'narrow'`                                                 | Representation of the weekday        |
| `era`                    | `'long'`, `'short'`, `'narrow'`                                                 | Representation of the era            |
| `year`                   | `'numeric'`, `'2-digit'`                                                        | Representation of the year           |
| `month`                  | `'numeric'`, `'2-digit'`, `'long'`, `'short'`, `'narrow'`                       | Representation of the month          |
| `day`                    | `'numeric'`, `'2-digit'`                                                        | Representation of the day            |
| `dayPeriod`              | `'narrow'`, `'short'`, `'long'`                                                 | Day period (e.g. "am", "noon")       |
| `hour`                   | `'numeric'`, `'2-digit'`                                                        | Representation of the hour           |
| `minute`                 | `'numeric'`, `'2-digit'`                                                        | Representation of the minute         |
| `second`                 | `'numeric'`, `'2-digit'`                                                        | Representation of the second         |
| `fractionalSecondDigits` | `1`, `2`, `3`                                                                   | Fraction-of-second digits            |
| `timeZoneName`           | `'long'`, `'short'`, `'shortOffset'`, `'longOffset'`, `'shortGeneric'`, `'longGeneric'` | Time zone display                 |

**Locale and other options:**

| Property          | Possible values                                    | Description                    |
| ----------------- | -------------------------------------------------- | ------------------------------ |
| `localeMatcher`   | `'best fit'` (default), `'lookup'`                  | Locale matching algorithm      |
| `calendar`        | `'chinese'`, `'gregory'`, `'persian'`, etc.        | Calendar to use                |
| `numberingSystem` | `'latn'`, `'arab'`, `'hans'`, etc.                 | Numbering system               |
| `timeZone`        | IANA time zone (e.g. `'UTC'`, `'America/New_York'`) | Time zone for formatting       |
| `hour12`          | `true`, `false`                                    | Use 12-hour vs 24-hour time   |
| `hourCycle`       | `'h11'`, `'h12'`, `'h23'`, `'h24'`                 | Hour cycle                     |
| `formatMatcher`   | `'basic'`, `'best fit'` (default)                  | Format matching algorithm      |

For complete reference, see [MDN: Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat).

Read more:
- [Date cell type](@/guides/cell-types/date-cell-type/date-cell-type.md)
- [`locale`](@/api/options.md#locale)

**Default**: <code>{ year: &#x27;numeric&#x27;, month: &#x27;2-digit&#x27;, day: &#x27;2-digit&#x27; }</code>  
**Example**  
```js
columns: [
  {
    type: 'date',
    locale: 'en-US',
    dateFormat: {
      dateStyle: 'short'
    }
  }
]
```


### dateTimeFormat

::: ask-about-api dateTimeFormat|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1981

:::

_core.dateTimeFormat : object_

Configures the date-time format for `intl-datetime` cells using an
[`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat)
options object. The locale is controlled separately via the [`locale`](@/api/options.md#locale) option.

::: tip Source data format
Source data must be in ISO 8601 date-time format (`YYYY-MM-DDTHH:mm:ss`; a date-only
`YYYY-MM-DD` value is treated as midnight). Otherwise operations such as sorting and filtering
can be unstable or unpredictable. The `dateTimeFormat` object affects only how values are
displayed; the underlying value should remain ISO.
:::

For the full list of supported properties, see
[MDN: Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat).

Read more:
- [Date-time cell type](@/guides/cell-types/datetime-cell-type/datetime-cell-type.md)
- [`locale`](@/api/options.md#locale)

**Default**: <code>{ year: &#x27;numeric&#x27;, month: &#x27;2-digit&#x27;, day: &#x27;2-digit&#x27;, hour: &#x27;2-digit&#x27;, minute: &#x27;2-digit&#x27;, second: &#x27;2-digit&#x27;, hour12: false }</code>  
**Since**: 18.1.0  
**Example**  
```js
columns: [
  {
    type: 'intl-datetime',
    locale: 'en-US',
    dateTimeFormat: {
      dateStyle: 'medium',
      timeStyle: 'short'
    }
  }
]
```


### defaultDate

::: ask-about-api defaultDate|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2023

:::

_core.defaultDate : string_

The `defaultDate` option configures the date pre-selected in the date picker editor
when opening an empty [`date`](@/guides/cell-types/date-cell-type/date-cell-type.md) cell for editing.

The option accepts a string in ISO 8601 format (`YYYY-MM-DD`).

::: tip
`defaultDate` affects only the date picker's initial selection when the cell is empty.
It does not automatically populate empty cells with this date - the cell's value remains empty
until the user confirms a selection.
:::

This option can be set at any level of the [cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration):
the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options), the [`columns`](@/api/options.md#columns) level, the [`cells`](@/api/options.md#cells) level, and the [`cell`](@/api/options.md#cell) level.

Read more:
- [Date cell type](@/guides/cell-types/date-cell-type/date-cell-type.md)
- [`dateFormat`](@/api/options.md#dateformat)

**Default**: <code>undefined</code>  
**Example**  
```js
columns: [
  {
    type: 'date',
    defaultDate: '2015-02-02'
  }
],
```


### density

::: ask-about-api density|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6151

:::

_core.density : string | undefined_

The `density` option sets the amount of white space inside the grid without declaring a theme.

You can set it to one of the following:

| Setting               | Description                                              |
| --------------------- | -------------------------------------------------------- |
| `undefined` (default) | Use the density of the current theme                     |
| `'default'`           | Standard spacing                                         |
| `'compact'`           | Tighter spacing, fits more rows on the screen            |
| `'comfortable'`       | Looser spacing, easier to read and to tap                |

The option is a per-instance override. It applies on top of the current theme, so the theme
itself stays unchanged and other grids that use the same theme keep their own density.
You can change it at runtime with `updateSettings()`.

The option requires the theme engine, so it has no effect when the theme comes from a CSS
class name (the [`theme`](@/api/options.md#theme) option set to a string, or an `ht-theme-*` class on the
container element).

An unsupported value is ignored with a console warning rather than throwing.

Read more:
- [Themes](@/guides/styling/themes/themes.md)
- [`colorScheme`](@/api/options.md#colorscheme)
- [`theme`](@/api/options.md#theme)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Since**: 18.1.0  
**Example**  
```js
// Render the grid with tighter spacing, without declaring a theme
const hot = new Handsontable(container, {
  density: 'compact',
});
```
**Example**  
```js
// Change the density at runtime
hot.updateSettings({
  density: 'comfortable',
});
```


### disableVisualSelection

::: ask-about-api disableVisualSelection|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2070

:::

_core.disableVisualSelection : boolean | string | Array&lt;string&gt;_

The `disableVisualSelection` option configures how
[selection](@/guides/cell-features/selection/selection.md) is shown.

You can set the `disableVisualSelection` option to one of the following:

| Setting           | Description                                                                                         |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| `false` (default) | - Show single-cell selection<br>- Show range selection<br>- Show header selection                   |
| `true`            | - Don't show single-cell selection<br>- Don't show range selection<br>- Don't show header selection |
| `'current'`       | - Don't show single-cell selection<br>- Show range selection<br>- Show header selection             |
| `'area'`          | - Show single-cell selection<br>- Don't show range selection<br>- Show header selection             |
| `'header'`        | - Show single-cell selection<br>- Show range selection<br>- Don't show header selection             |
| An array          | A combination of `'current'`, `'area'`, and/or `'header'`                                           |

When set to any non-`false` value, the second-click deselect behavior
(Ctrl/Cmd+click on an already-selected cell removing it from a multi-cell selection)
is also skipped. Without visible feedback, toggling layers off can cause unexpected
highlight jumps.

Read more:
- [Selection](@/guides/cell-features/selection/selection.md)

**Default**: <code>false</code>  
**Example**  
```js
// don't show single-cell selection
// don't show range selection
// don't show header selection
disableVisualSelection: true,

// don't show single-cell selection
// show range selection
// show header selection
disableVisualSelection: 'current',

// don't show single-cell selection
// don't show range selection
// show header selection
disableVisualSelection: ['current', 'area'],
```


### editor

::: ask-about-api editor|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2417

:::

_core.editor : string | function | boolean_

The `editor` option sets a [cell editor](@/guides/cell-functions/cell-editor/cell-editor.md) for a cell.

You can set the `editor` option to one of the following [cell editor aliases](@/guides/cell-functions/cell-editor/cell-editor.md):

| Alias               | Cell editor function                                                       |
| ------------------- | -------------------------------------------------------------------------- |
| A custom alias      | Your [custom cell editor](@/guides/cell-functions/cell-editor/cell-editor.md) function |
| `'autocomplete'`    | `AutocompleteEditor`                                                       |
| `'base'`            | `BaseEditor`                                                               |
| `'checkbox'`        | `CheckboxEditor`                                                           |
| `'date'`            | `DateEditor`                                                               |
| `'intl-date'`       | `IntlDateEditor`                                                           |
| `'dropdown'`        | `DropdownEditor`                                                           |
| `'handsontable'`    | `HandsontableEditor`                                                       |
| `'numeric'`         | `NumericEditor`                                                            |
| `'password'`        | `PasswordEditor`                                                           |
| `'select'`          | `SelectEditor`                                                             |
| `'text'`            | `TextEditor`                                                               |
| `'time'`            | `TimeEditor`                                                               |
| `'intl-time'`       | `IntlTimeEditor`                                                           |

To disable editing cells through cell editors,
set the `editor` option to `false`.
You'll still be able to change cells' content through Handsontable's API
or through plugins (e.g. [`CopyPaste`](@/api/copyPaste.md)), though.

When the `editor` option is set to `false`, you can still use these keyboard shortcuts:

| Shortcut                                | Action                                                      |
| --------------------------------------- | ----------------------------------------------------------- |
| `Delete` / `Backspace`                  | Clear the contents of the selected cells                    |
| `Ctrl` + `Enter` / `Cmd` + `Enter`      | Fill selected cells with the value of the active cell       |

To set the [`editor`](@/api/options.md#editor), [`renderer`](@/api/options.md#renderer), and [`validator`](@/api/options.md#validator)
options all at once, use the [`type`](@/api/options.md#type) option.

Read more:
- [Keyboard shortcuts](@/guides/navigation/keyboard-shortcuts/keyboard-shortcuts.md)
- [Cell editor](@/guides/cell-functions/cell-editor/cell-editor.md)
- [Cell type](@/guides/cell-types/cell-type/cell-type.md)
- [Configuration options: Cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration)
- [`type`](@/api/options.md#type)

**Default**: <code>undefined</code>  
**Example**  
```js
// use the `numeric` editor for each cell of the entire grid
editor: 'numeric',

// apply the `editor` option to individual columns
columns: [
  {
    // use the `autocomplete` editor for each cell of this column
    editor: 'autocomplete'
  },
  {
    // disable editing cells through cell editors for each cell of this column
    editor: false
  }
]
```


### enterBeginsEditing

::: ask-about-api enterBeginsEditing|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2545

:::

_core.enterBeginsEditing : boolean_

The `enterBeginsEditing` option configures the action of the <kbd>**Enter**</kbd> key.

You can set the `enterBeginsEditing` option to one of the following:

| Setting          | Description                                                                                                                                                                                               |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `true` (default) | - On pressing <kbd>**Enter**</kbd> once, enter the editing mode of the active cell<br>- On pressing <kbd>**Enter**</kbd> twice, move to another cell,<br>as configured by the [`enterMoves`](@/api/options.md#entermoves) setting |
| `false`          | - On pressing <kbd>**Enter**</kbd> once, move to another cell,<br>as configured by the [`enterMoves`](@/api/options.md#entermoves) setting                                                                                    |

Read more:
- [`enterMoves`](@/api/options.md#entermoves)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>true</code>  
**Example**  
```js
// press Enter once to start editing
// press Enter twice to move to another cell
enterBeginsEditing: true,

// press Enter once to move to another cell
enterBeginsEditing: false,
```


### enterCommits

::: ask-about-api enterCommits|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2567

:::

_core.enterCommits : boolean_

The `enterCommits` option configures whether the <kbd>**Enter**</kbd> key closes the [`multiSelect`](@/guides/cell-types/multiselect-cell-type/multiselect-cell-type.md) editor.

**Default**: <code>true</code>  
**Since**: 17.0.0  
**Example**  
```js
columns: [{
  type: 'multiselect',
  // press Enter to close the `multiSelect` editor and Space to select an option
  enterCommits: true,
}, {
  type: 'multiselect',
  // press Enter to select an option
  enterCommits: false,
}],
],
```


### enterMoves

::: ask-about-api enterMoves|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2609

:::

_core.enterMoves : object | function_

The `enterMoves` option configures the action of the <kbd>**Enter**</kbd> key.

If the [`enterBeginsEditing`](@/api/options.md#enterbeginsediting) option is set to `true`,
the `enterMoves` setting applies to the **second** pressing of the <kbd>**Enter**</kbd> key.

If the [`enterBeginsEditing`](@/api/options.md#enterbeginsediting) option is set to `false`,
the `enterMoves` setting applies to the **first** pressing of the <kbd>**Enter**</kbd> key.

You can set the `enterMoves` option to an object with the following properties
(or to a function that returns such an object):

| Property | Type   | Description                                                                                                                                              |
| -------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `col`    | Number | - On pressing <kbd>**Enter**</kbd>, move selection `col` columns right<br>- On pressing <kbd>**Shift**</kbd>+<kbd>**Enter**</kbd>, move selection `col` columns left |
| `row`    | Number | - On pressing <kbd>**Enter**</kbd>, move selection `row` rows down<br>- On pressing <kbd>**Shift**</kbd>+<kbd>**Enter**</kbd>, move selection `row` rows up          |

Read more:
- [`enterBeginsEditing`](@/api/options.md#enterbeginsediting)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>{col: 0, row: 1}</code>  
**Example**  
```js
// on pressing Enter, move selection 1 column right and 1 row down
// on pressing Shift+Enter, move selection 1 column left and 1 row up
enterMoves: {col: 1, row: 1},

// the same setting, as a function
// `event` is a DOM Event object received on pressing Enter
// you can use it to check whether the user pressed Enter or Shift+Enter
enterMoves(event) {
  return {col: 1, row: 1};
},
```


### fillHandle

::: ask-about-api fillHandle|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2707

:::

_core.fillHandle : boolean | string | object_

The `fillHandle` option configures the [Autofill](@/api/autofill.md) plugin.

You can set the `fillHandle` option to one the following:

| Setting        | Description                                                                |
| -------------- | -------------------------------------------------------------------------- |
| `true`         | - Enable autofill in all directions<br>- Add the fill handle               |
| `false`        | Disable autofill                                                           |
| `'vertical'`   | - Enable vertical autofill<br>- Add the fill handle                        |
| `'horizontal'` | - Enable horizontal autofill<br>- Add the fill handle                      |
| An object      | - Enable autofill<br>- Add the fill handle<br>- Configure autofill options |

If you set the `fillHandle` option to an object, you can configure the following autofill options:

| Option          | Possible settings              | Description                                                                                               |
| --------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `autoInsertRow` | `true` (default) \| `false`    | `true`: When you reach the grid's bottom, add new rows<br>`false`: When you reach the grid's bottom, stop |
| `direction`     | `'vertical'` \| `'horizontal'` | `'vertical'`: Enable vertical autofill<br>`'horizontal'`: Enable horizontal autofill                      |

Read more:
- [AutoFill values](@/guides/cell-features/autofill-values/autofill-values.md)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>true</code>  
**Example**  
```js
// enable autofill in all directions
// with `autoInsertRow` enabled
fillHandle: true,

// enable vertical autofill
// with `autoInsertRow` enabled
fillHandle: 'vertical',

// enable horizontal autofill
// with `autoInsertRow` enabled
fillHandle: 'horizontal',

// enable autofill in all directions
// with `autoInsertRow` disabled
fillHandle: {
  autoInsertRow: false,
},

// enable vertical autofill
// with `autoInsertRow` disabled
fillHandle: {
  autoInsertRow: false,
  direction: 'vertical'
},
```


### filter

::: ask-about-api filter|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2743

:::

_core.filter : boolean_

The `filter` option configures whether [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md) cells'
lists are updated by the end user's input.

You can set the `filter` option to one of the following:

| Setting          | Description                                                                                                           |
| ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| `true` (default) | When the end user types into the input area, only options matching the input are displayed                            |
| `false`          | When the end user types into the input area, all options are displayed<br>(options matching the input are put in bold |

Read more:
- [Autocomplete cell type](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
- [`source`](@/api/options.md#source)
- [`filteringCaseSensitive`](@/api/options.md#filteringcasesensitive)

**Default**: <code>true</code>  
**Example**  
```js
columns: [{
  // set the `type` of each cell in this column to `autocomplete`
  type: 'autocomplete',
  // set options available in every `autocomplete` cell of this column
  source: ['Apple', 'Apricot', 'Avocado', 'Banana', 'Blueberry'],
  // when the end user types in `a`, display options that contain `a`
  // when the end user types in `ap`, display only `Apple` and `Apricot`
  filter: true
}],
```


### filteringCaseSensitive

::: ask-about-api filteringCaseSensitive|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2782

:::

_core.filteringCaseSensitive : boolean_

The `filteringCaseSensitive` option configures whether [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md) and [`multiSelect`](@/guides/cell-types/multiselect-cell-type/multiselect-cell-type.md)-typed cells'
search inputs are case-sensitive.

You can set the `filteringCaseSensitive` option to one of the following:

| Setting           | Description                                                                                        |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| `false` (default) | [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md) cells' input is not case-sensitive |
| `true`            | [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md) cells' input is case-sensitive     |

Read more:
- [Autocomplete cell type](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
- [`source`](@/api/options.md#source)
- [`filter`](@/api/options.md#filter)

**Default**: <code>false</code>  
**Example**  
```js
columns: [
  {
    type: 'autocomplete',
    source: [ ... ],
    // match case while searching autocomplete options
    filteringCaseSensitive: true
  },
  {
    type: 'multiselect',
    source: [ ... ],
    // match case while searching multiSelect options
    filteringCaseSensitive: true
  }
],
```


### filterSelectedItems

::: ask-about-api filterSelectedItems|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2836

:::

_core.filterSelectedItems : boolean_

The `filterSelectedItems` option configures whether the selected items are filtered out of the dropdown, when using the search input of the [`multiSelect`](@/guides/cell-types/multiselect-cell-type/multiselect-cell-type.md) editor.

**Default**: <code>true</code>  
**Example**  
```js
// filter out the selected items from the dropdown
filterSelectedItems: true,

// keep the selected items in the dropdown
filterSelectedItems: false,


### fixedColumnsLeft

::: ask-about-api fixedColumnsLeft|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2862

:::

_core.fixedColumnsLeft : number_

`fixedColumnsLeft` is a legacy option.

If your grid's [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is LTR (default), `fixedColumnsLeft` acts like the [`fixedColumnsStart`](@/api/options.md#fixedcolumnsstart) option.

If your grid's [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is RTL, using `fixedColumnsLeft` throws an error.

Use [`fixedColumnsStart`](@/api/options.md#fixedcolumnsstart), which works in any layout direction.

Read more:
- [`fixedColumnsStart`](@/api/options.md#fixedcolumnsstart)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>0</code>  
**Example**  
```js
// freeze the first 3 columns from the left
fixedColumnsLeft: 3,
```


### fixedColumnsStart

::: ask-about-api fixedColumnsStart|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2902

:::

_core.fixedColumnsStart : number_

If your grid's [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is LTR (default), the `fixedColumnsStart` option sets the number of [frozen columns](@/guides/columns/column-freezing/column-freezing.md) at the left-hand edge of the grid.

If your grid's [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is RTL, the `fixedColumnsStart` option sets the number of [frozen columns](@/guides/columns/column-freezing/column-freezing.md) at the right-hand edge of the grid.

Read more:
- [Column freezing](@/guides/columns/column-freezing/column-freezing.md)
- [Layout direction](@/guides/internationalization/layout-direction/layout-direction.md)
- [`fixedColumnsLeft`](@/api/options.md#fixedcolumnsleft)
- [`layoutDirection`](@/api/options.md#layoutdirection)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>0</code>  
**Example**  
```js
// when `layoutDirection` is set to `inherit` (default)
// freeze the first 3 columns from the left or from the right
// depending on your HTML document's `dir` attribute
layoutDirection: 'inherit',
fixedColumnsStart: 3,

// when `layoutDirection` is set to `rtl`
// freeze the first 3 columns from the right
// regardless of your HTML document's `dir` attribute
layoutDirection: 'rtl',
fixedColumnsStart: 3,

// when `layoutDirection` is set to `ltr`
// freeze the first 3 columns from the left
// regardless of your HTML document's `dir` attribute
layoutDirection: 'ltr',
fixedColumnsStart: 3,
```


### fixedRowsBottom

::: ask-about-api fixedRowsBottom|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2930

:::

_core.fixedRowsBottom : number_

The `fixedRowsBottom` option sets the number of [frozen rows](@/guides/rows/row-freezing/row-freezing.md)
at the bottom of the grid.

::: tip
For the bottom frozen rows area to appear with a scroll separator, you must also set the [`height`](@/api/options.md#height) option
in Handsontable's configuration. If the grid expands to fill its parent container without a defined height,
no vertical scrollbar is created and the fixed bottom rows area is not displayed.
:::

Read more:
- [Row freezing](@/guides/rows/row-freezing/row-freezing.md)
- [`height`](@/api/options.md#height)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>0</code>  
**Example**  
```js
// freeze the bottom 3 rows
fixedRowsBottom: 3,
```


### fixedRowsTop

::: ask-about-api fixedRowsTop|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2957

:::

_core.fixedRowsTop : number_

The `fixedRowsTop` option sets the number of [frozen rows](@/guides/rows/row-freezing/row-freezing.md) at the top of the grid.

::: tip
For the top frozen rows area to be visually separated from the scrollable body, you must also set the [`height`](@/api/options.md#height) option
in Handsontable's configuration. If the grid expands to fill its parent container without a defined height,
no vertical scrollbar is created and the fixed top rows area is not displayed.
:::

Read more:
- [Row freezing](@/guides/rows/row-freezing/row-freezing.md)
- [`height`](@/api/options.md#height)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>0</code>  
**Example**  
```js
// freeze the top 3 rows
fixedRowsTop: 3,
```


### fragmentSelection

::: ask-about-api fragmentSelection|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3104

:::

_core.fragmentSelection : boolean | string_

The `fragmentSelection` option configures text selection settings.

You can set the `fragmentSelection` option to one of the following:

| Setting           | Description                                        |
| ----------------- | ------------------------------------------------- |
| `false` (default) | Disable text selection                            |
| `true`            | Enable text selection in multiple cells at a time |
| `'cell'`          | Enable text selection in one cell at a time       |

With `fragmentSelection: true`, copying text across multiple cells requires a
[`selectionMode`](@/api/options.md#selectionmode) that allows selecting more than one cell.
When [`selectionMode`](@/api/options.md#selectionmode) is set to `'single'`, copying is
limited to a single cell.

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>false</code>  
**Example**  
```js
// enable text selection in multiple cells at a time
fragmentSelection: true,

// enable text selection in one cell a time
fragmentSelection: 'cell',
```


### hashLength

::: ask-about-api hashLength|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3126

:::

_core.hashLength : number_

The `hashLength` option sets a fixed display length for the hash mask used by the
[`password`](@/guides/cell-types/password-cell-type/password-cell-type.md) cell type.

By default, the hash length equals the actual value length. Set `hashLength` to a positive
integer to always display that many hash symbols regardless of the real value length.

**Default**: <code>undefined</code>  
**Example**  
```js
columns: [
  {
    type: 'password',
    hashLength: 10,
  },
],
```


### hashRevealDelay

::: ask-about-api hashRevealDelay|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3150

:::

_core.hashRevealDelay : number_

The `hashRevealDelay` option enables a brief character-reveal on each keystroke in the
[`password`](@/guides/cell-types/password-cell-type/password-cell-type.md) cell type editor.

When set to a positive number (milliseconds), each typed character stays visible for that
duration and is then replaced by the `hashSymbol`. This lets the user confirm what they
typed without permanently exposing the value. Requires `type: 'password'`.

**Default**: <code>undefined</code>  
**Since**: 17.2.0  
**Example**  
```js
columns: [
  {
    type: 'password',
    hashRevealDelay: 1000,
  },
],
```


### hashSymbol

::: ask-about-api hashSymbol|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3171

:::

_core.hashSymbol : string_

The `hashSymbol` option sets the character used as the hash mask in the
[`password`](@/guides/cell-types/password-cell-type/password-cell-type.md) cell type renderer.

Defaults to `'*'`. You can use any character, HTML entity, or string.

**Default**: <code>"*"</code>  
**Example**  
```js
columns: [
  {
    type: 'password',
    hashSymbol: '•',
  },
],
```


### headerClassName

::: ask-about-api headerClassName|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3195

:::

_core.headerClassName : string_

The `headerClassName` option allows adding one or more class names to the column headers' inner `div` element.
It can be used to align the labels in the column headers to left, center or right by setting this option to
`htLeft`, `htCenter`, or `htRight` respectively.

**Default**: <code>undefined</code>  
**Since**: 14.5.0  
**Example**  
```js
// Adding class names to all column headers
headerClassName: 'htRight my-class',

columns: [
 {
   // Adding class names to the column header of a single column
   headerClassName: 'htRight my-class',
 }
]
```


### height

::: ask-about-api height|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3254

:::

_core.height : number | 'auto' | string | function_

The `height` option configures the height of your grid.

You can set the `height` option to one of the following:

| Setting                                                                    | Example                    |
| -------------------------------------------------------------------------- | -------------------------- |
| A number of pixels                                                         | `height: 500`              |
| A string with a [CSS unit](https://www.w3schools.com/cssref/css_units.asp) | `height: '75vw'`           |
| `'auto'`                                                                   | `height: 'auto'`           |
| A function that returns a valid number or string                           | `height() { return 500; }` |

### How `'auto'` differs from leaving `height` unset

When you set `height: 'auto'`, Handsontable writes `height: auto; overflow: clip;`
as inline styles on the root element. The grid then grows to match its content height.
No internal vertical scrollbar is created, so the page itself scrolls when the grid
exceeds the viewport.

When you leave `height` unset, Handsontable does not touch the root element's inline
styles. Sizing is governed by your CSS, and the nearest ancestor with `overflow: auto`
or `overflow: hidden` becomes the scroll parent. If no such ancestor exists, the window
scrolls. See the [Grid size](@/guides/getting-started/grid-size/grid-size.md) guide for
details.

::: tip
With `height: 'auto'`, every row is laid out in the DOM at once. Row-level
virtualization is effectively disabled. Avoid `'auto'` for large datasets and set a
numeric `height` instead, so Handsontable can virtualize off-screen rows.
:::

Read more:
- [Grid size](@/guides/getting-started/grid-size/grid-size.md)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Example**  
```js
// set the grid's height to 500px
height: 500,

// set the grid's height to 75vh
height: '75vh',

// let the grid grow to fit all its rows (no internal vertical scroll)
height: 'auto',

// set the grid's height to 500px, using a function
height() {
  return 500;
},
```


### imeFastEdit

::: ask-about-api imeFastEdit|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3414

:::

_core.imeFastEdit : boolean_

The `imeFastEdit` option allows using the "fast edit" feature for the IME users. It's disabled by default
because of its incompatibility with some of the accessibility features.

Enabling this option can make a negative impact on how some screen readers handle reading the table cells.

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Since**: 14.0.0  


### initialState

::: ask-about-api initialState|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3372

:::

_core.initialState : object | undefined_

The `initialState` option configures the grid's initial state.
This object accepts any grid configuration option. In case of conflicts between
`initialState` and table settings, the table settings take precedence.
Note: The `initialState` option is ignored when passed to the
`updateSettings()` method.

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Since**: 16.1.0  
**Example**  
```js
initialState: {
  // configure initial column order
  manualColumnMove: [1, 0],
},
```


### injectCoreCss

::: ask-about-api injectCoreCss|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6182

:::

_core.injectCoreCss : boolean_

The `injectCoreCss` option controls whether Handsontable injects its core CSS into the document.

You can set the `injectCoreCss` option to one of the following:

| Setting            | Description                                                                                                      |
| ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `true` (default)   | Inject core styles into the document head                                                                        |
| `false`            | Do not inject core styles (use when you load CSS yourself, e.g. `import 'handsontable/styles/handsontable.css'`) |

Read more:
- [Themes](@/guides/styling/themes/themes.md)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>true</code>  
**Since**: 17.0.0  
**Example**  
```js
// inject core CSS (default)
injectCoreCss: true,

// skip injection when you load Handsontable CSS yourself
injectCoreCss: false,
```


### invalidCellClassName

::: ask-about-api invalidCellClassName|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3400

:::

_core.invalidCellClassName : string_

The `invalidCellClassName` option lets you add a CSS class name to cells
that were marked as `invalid` by the [cell validator](@/guides/cell-functions/cell-validator/cell-validator.md).

Read more:
- [Cell validator](@/guides/cell-functions/cell-validator/cell-validator.md)
- [`currentRowClassName`](@/api/options.md#currentrowclassname)
- [`currentHeaderClassName`](@/api/options.md#currentheaderclassname)
- [`activeHeaderClassName`](@/api/options.md#activeheaderclassname)
- [`currentColClassName`](@/api/options.md#currentcolclassname)
- [`readOnlyCellClassName`](@/api/options.md#readonlycellclassname)
- [`commentedCellClassName`](@/api/options.md#commentedcellclassname)
- [`noWordWrapClassName`](@/api/options.md#nowordwrapclassname)
- [`TableClassName`](@/api/options.md#tableclassname)
- [`className`](@/api/options.md#classname)

**Default**: <code>"htInvalid"</code>  
**Example**  
```js
// add a `highlight-error` CSS class name
// to every `invalid` cell`
invalidCellClassName: 'highlight-error',
```


### label

::: ask-about-api label|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3540

:::

_core.label : object_

The `label` option configures [`checkbox`](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md) cells` labels.

You can set the `label` option to an object with the following properties:

| Property    | Possible values                   | Description                                                                                                                                                                                                             |
| ----------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `position`  | `'after'` (default) \| `'before'` | `'after'`: place the label to the right of the checkbox<br>`'before'`: place the label to the left of the checkbox                                                                                                      |
| `value`     | A string \| A function            | The label's text                                                                                                                                                                                                        |
| `separated` | `false` (default) \| `true`       | `false`: don't separate the label from the checkbox<br>`true`: separate the label from the checkbox                                                                                                                     |
| `property`  | A string                          | - A [`data`](@/api/options.md#data) object property name that's used as the label's text <br>- Works only when the [`data`](@/api/options.md#data) option is set to an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects) |

Read more:
- [Checkbox cell type: Checkbox labels](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md#checkbox-labels)

**Default**: <code>undefined</code>  
**Example**  
```js
columns: [{
  type: 'checkbox',
  // add 'My label:' after the checkbox
  label: { position: 'before', value: 'My label: ', separated: true }
}],
```


### language

::: ask-about-api language|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3592

:::

_core.language : string_

The `language` option configures Handsontable's [language](@/guides/internationalization/language/language.md) settings.

This option controls the language used for all built-in UI strings, including context menu labels,
column sorting labels, validation messages, and other user-visible text. It does not affect the locale
used for number or date formatting - use the [`locale`](@/api/options.md#locale) option for that.

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

You can set the `language` option to one of the following:

| Setting             | Description                 |
| ------------------- | --------------------------- |
| `'en-US'` (default) | English - United States     |
| `'ar-AR'`           | Arabic - Global<br><br>To properly render this language, set the [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) to RTL. |
| `'cs-CZ'`           | Czech - Czech Republic      |
| `'de-CH'`           | German - Switzerland        |
| `'de-DE'`           | German - Germany            |
| `'es-MX'`           | Spanish - Mexico            |
| `'fa-IR'`           | Persian - Iran              |
| `'fr-FR'`           | French - France             |
| `'hr-HR'`           | Croatian - Croatia          |
| `'it-IT'`           | Italian - Italy             |
| `'ja-JP'`           | Japanese - Japan            |
| `'ko-KR'`           | Korean - Korea              |
| `'lv-LV'`           | Latvian - Latvia            |
| `'nb-NO'`           | Norwegian (Bokmål) - Norway |
| `'nl-NL'`           | Dutch - Netherlands         |
| `'pl-PL'`           | Polish - Poland             |
| `'pt-BR'`           | Portuguese - Brazil         |
| `'ru-RU'`           | Russian - Russia            |
| `'sr-SP'`           | Serbian (Latin) - Serbia    |
| `'zh-CN'`           | Chinese - China             |
| `'zh-TW'`           | Chinese - Taiwan            |

Read more:
- [Language](@/guides/internationalization/language/language.md)
- [`locale`](@/api/options.md#locale)
- [`layoutDirection`](@/api/options.md#layoutdirection)

**Default**: <code>"en-US"</code>  
**Example**  
```js
// set Handsontable's language to Polish
language: 'pl-PL',
```


### layout

::: ask-about-api layout|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3664

:::

_core.layout : object_

The `layout` option configures the order of plugin UI elements within the user-orderable
wrapper slots rendered around the grid: `top` and `bottom`. Each slot takes an ordered array
of element keys (for example `'pagination'`). Keys you list are placed first in that order;
any remaining elements follow by their default weight. The grid and the overlays layer (the
modal layer, such as the dialog) are not orderable through this option. The license
notification is not orderable either; it always renders last in the `bottom` slot.

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Since**: 18.0.0  
**Example**  
```js
// render pagination above a custom 'summary' element registered in the bottom slot
layout: {
  bottom: ['pagination', 'summary'],
},
```


### layoutDirection

::: ask-about-api layoutDirection|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3639

:::

_core.layoutDirection : string_

The `layoutDirection` option configures whether Handsontable renders from the left to the right, or from the right to the left.

You can set the layout direction only at Handsontable's [initialization](@/guides/getting-started/installation/installation.md#initialize-handsontable). Any change of the `layoutDirection` option after the initialization (e.g. using the `updateSettings()` method) is ignored.

You can set the `layoutDirection` option only [for the entire grid](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
You can't set it for individual columns, rows, or cells.

You can set the `layoutDirection` option to one of the following strings:

| Setting             | Description                                                                                                                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `inherit` (default) | Set Handsontable's layout direction automatically,<br>based on the value of your HTML document's [`dir`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/dir) attribute  |
| `rtl`               | Render Handsontable from the right to the left,<br>even when your HTML document's [`dir`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/dir) attribute is set to `ltr` |
| `ltr`               | Render Handsontable from the left to the right,<br>even when your HTML document's [`dir`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/dir) attribute is set to `rtl` |

Read more:
- [Layout direction](@/guides/internationalization/layout-direction/layout-direction.md)
- [Language](@/guides/internationalization/language/language.md)
- [`language`](@/api/options.md#language)
- [`locale`](@/api/options.md#locale)
- [`fixedColumnsStart`](@/api/options.md#fixedcolumnsstart)
- [`customBorders`](@/api/options.md#customborders)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>"inherit"</code>  
**Example**  
```js
// inherit Handsontable's layout direction
// from the value of your HTML document's `dir` attribute
layoutDirection: 'inherit',

// render Handsontable from the right to the left
// regardless of your HTML document's `dir`
layoutDirection: 'rtl',

// render Handsontable from the left to the right
// regardless of your HTML document's `dir`
layoutDirection: 'ltr',
```


### licenseKey

::: ask-about-api licenseKey|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3699

:::

_core.licenseKey : string_

The `licenseKey` option sets your Handsontable license key.

You can set the `licenseKey` option to one of the following:

| Setting                                                                                                 | Description                                                                                       |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| A string with your [commercial license key](@/guides/getting-started/license-key/license-key.md#commercial-license) | For [commercial use](@/guides/technical-specification/software-license/software-license.md#commercial-use)         |
| A string with your [entitlement license key](@/guides/getting-started/license-key/license-key.md#entitlement-license-keys) (plain-English text ending with a `[...]` block) | For trial, subscription, or perpetual use |
| `'non-commercial-and-evaluation'`                                                                       | For [non-commercial use](@/guides/technical-specification/software-license/software-license.md#non-commercial-use) |

Read more:
- [License key](@/guides/getting-started/license-key/license-key.md)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Example**  
```js
// for commercial use (legacy 25-character format)
licenseKey: 'xxxxx-xxxxx-xxxxx-xxxxx-xxxxx', // your commercial license key

// for an entitlement license key (trial, subscription, or perpetual),
// pass the whole key string exactly as you received it
licenseKey: 'This is a Handsontable license key for Acme Corp, ... [eyJwcm9kdWN0cyI6...3a4f8361]',

// for non-commercial use
licenseKey: 'non-commercial-and-evaluation',
```


### locale

::: ask-about-api locale|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3734

:::

_core.locale : string_

The `locale` option configures Handsontable's [locale](@/guides/internationalization/locale/locale.md) settings.

You can set the `locale` option to any valid and canonicalized Unicode BCP 47 locale tag,
both for the [entire grid](@/guides/internationalization/locale/locale.md#set-the-grid-s-locale),
and for [individual columns](@/guides/internationalization/locale/locale.md#set-a-column-s-locale).

Read more:
- [Locale](@/guides/internationalization/locale/locale.md)
- [`language`](@/api/options.md#language)
- [`layoutDirection`](@/api/options.md#layoutdirection)

**Default**: <code>"en-US"</code>  
**Example**  
```js
// set the entire grid's locale to Polish
locale: 'pl-PL',

// set individual columns' locales
columns: [
  {
    // set the first column's locale to Polish
    locale: 'pl-PL',
  },
  {
    // set the second column's locale to German
    locale: 'de-DE',
  },
],
```


### maxCols

::: ask-about-api maxCols|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4012

:::

_core.maxCols : number_

The `maxCols` option sets a maximum number of columns.

The `maxCols` option is used:
- At initialization: if the `maxCols` value is lower than the initial number of columns,
Handsontable trims columns from the right.
- At runtime: for example, when inserting columns.

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>Infinity</code>  
**Example**  
```js
// set the maximum number of columns to 300
maxCols: 300,
```


### maxRows

::: ask-about-api maxRows|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4034

:::

_core.maxRows : number_

The `maxRows` option sets a maximum number of rows.

The `maxRows` option is used:
- At initialization: if the `maxRows` value is lower than the initial number of rows,
Handsontable trims rows from the bottom.
- At runtime: for example, when inserting rows.

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>Infinity</code>  
**Example**  
```js
// set the maximum number of rows to 300
maxRows: 300,
```


### maxSelections

::: ask-about-api maxSelections|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4053

:::

_core.maxSelections : number_

The `maxSelections` option sets a maximum number of selections for the [`multiSelect`](@/guides/cell-types/multiselect-cell-type/multiselect-cell-type.md)-typed cells.

**Default**: <code>undefined</code>  
**Since**: 17.0.0  
**Example**  
```js
columns: [{
  // set the `type` of each cell in this column to `multiSelect`
  type: 'multiselect',
  // set the maximum number of selections to 3
  maxSelections: 3,
}],
```


### minCols

::: ask-about-api minCols|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4148

:::

_core.minCols : number_

The `minCols` option sets a minimum number of columns.

The `minCols` option is used:
- At initialization: if the `minCols` value is higher than the initial number of columns,
Handsontable adds empty columns to the right.
- At runtime: for example, when removing columns.

The `minCols` option works only when your [`data`](@/api/options.md#data) is an [array of arrays](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-arrays).
When your [`data`](@/api/options.md#data) is an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects),
you can only have as many columns as defined in:
- The first data row
- The [`dataSchema`](@/api/options.md#dataschema) option
- The [`columns`](@/api/options.md#columns) option

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>0</code>  
**Example**  
```js
// set the minimum number of columns to 10
minCols: 10,
```


### minRowHeights

::: ask-about-api minRowHeights|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4181

:::

_core.minRowHeights : number | Array&lt;number&gt; | string | Array&lt;string&gt; | Array&lt;undefined&gt; | function_

Alias for the [`rowHeights`](@/api/options.md#rowheights) option.

See the [`rowHeights`](@/api/options.md#rowheights) option description for more information.

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Since**: 16.2.0  
**Example**  
```js
// set every row's minimum height to 100px
minRowHeights: 100,

// set every row's minimum height to 100px
minRowHeights: '100px',

// set the first (by visual index) row's minimum height to 100
// set the second (by visual index) row's minimum height to 120
// set any other row's minimum height to the default height value
minRowHeights: [100, 120],

// set each row's minimum height individually, using a function
minRowHeights(visualRowIndex) {
  return visualRowIndex * 10;
},
```


### minRows

::: ask-about-api minRows|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4203

:::

_core.minRows : number_

The `minRows` option sets a minimum number of rows.

The `minRows` option is used:
- At initialization: if the `minRows` value is higher than the initial number of rows,
Handsontable adds empty rows at the bottom.
- At runtime: for example, when removing rows.

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>0</code>  
**Example**  
```js
// set the minimum number of rows to 10
minRows: 10,
```


### minSpareCols

::: ask-about-api minSpareCols|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4233

:::

_core.minSpareCols : number_

The `minSpareCols` option sets a minimum number of empty columns
at the grid's right-hand end.

If there already are other empty columns at the grid's right-hand end,
they are counted into the `minSpareCols` value.

The total number of columns can't exceed the [`maxCols`](@/api/options.md#maxcols) value.

The `minSpareCols` option works only when your [`data`](@/api/options.md#data) is an [array of arrays](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-arrays).
When your [`data`](@/api/options.md#data) is an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects),
you can only have as many columns as defined in:
- The first data row
- The [`dataSchema`](@/api/options.md#dataschema) option
- The [`columns`](@/api/options.md#columns) option

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>0</code>  
**Example**  
```js
// at Handsontable's initialization, add at least 3 empty columns on the right
minSpareCols: 3,
```


### minSpareRows

::: ask-about-api minSpareRows|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4256

:::

_core.minSpareRows : number_

The `minSpareRows` option sets a minimum number of empty rows
at the bottom of the grid.

If there already are other empty rows at the bottom,
they are counted into the `minSpareRows` value.

The total number of rows can't exceed the [`maxRows`](@/api/options.md#maxrows) value.

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>0</code>  
**Example**  
```js
// at Handsontable's initialization, add at least 3 empty rows at the bottom
minSpareRows: 3,
```


### moveCells

::: ask-about-api moveCells|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5523

:::

_core.moveCells : boolean_

The `moveCells` option lets you move a [selection](@/guides/cell-features/selection/selection.md) by
dragging its edge. When enabled, hovering the border of a selected cell range shows a grab cursor;
dragging the border moves the block's data (values, the [`className`](@/api/options.md#classname) cell meta, and – with the
[`formulas`](@/api/options.md#formulas) plugin – adjusted formula references) to the new location.
Other cell meta (for example [`numericFormat`](@/api/options.md#numericformat) or [`readOnly`](@/api/options.md#readonly)) stays at the
source cells.
Hold <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> during the drag to copy instead of move.

The move applies to a single contiguous cell range only. It has no effect on full-row, full-column,
select-all, or multiple selections, the range may span at most 100,000 cells, and the source and
target must stay within the grid. Neither the target nor
the source may overlap read-only cells, because a move has to clear the source — a copy leaves the
source in place, so a read-only source cell blocks a move but not a copy.

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).

**Default**: <code>false</code>  
**Since**: 18.1.0  
**Example**  
```js
// enable drag-to-move for selections
moveCells: true,
```


### navigableHeaders

::: ask-about-api navigableHeaders|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4349

:::

_core.navigableHeaders : boolean_

When set to `true`, the `navigableHeaders` option lets you navigate [row headers](@/guides/rows/row-header/row-header.md) and [column headers](@/guides/columns/column-header/column-header.md), using the arrow keys or the <kbd>**Tab**</kbd> key (if the [`tabNavigation`](@/api/options.md#tabnavigation) option is set to `true`).

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>false</code>  
**Since**: 14.0.0  
**Example**  
```js
// you can navigate row and column headers with the keyboard
navigableHeaders: true,

// default behavior: you can't navigate row and column headers with the keyboard
navigableHeaders: false,
```


### noWordWrapClassName

::: ask-about-api noWordWrapClassName|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4512

:::

_core.noWordWrapClassName : string_

The `noWordWrapClassName` option lets you add a CSS class name
to each cell that has the [`wordWrap`](@/api/options.md#wordwrap) option set to `false`.

Read more:
- [`wordWrap`](@/api/options.md#wordwrap)
- [`currentRowClassName`](@/api/options.md#currentrowclassname)
- [`currentColClassName`](@/api/options.md#currentcolclassname)
- [`currentHeaderClassName`](@/api/options.md#currentheaderclassname)
- [`invalidCellClassName`](@/api/options.md#invalidcellclassname)
- [`readOnlyCellClassName`](@/api/options.md#readonlycellclassname)
- [`commentedCellClassName`](@/api/options.md#commentedcellclassname)
- [`noWordWrapClassName`](@/api/options.md#nowordwrapclassname)
- [`TableClassName`](@/api/options.md#tableclassname)
- [`className`](@/api/options.md#classname)

**Default**: <code>"htNoWrap"</code>  
**Example**  
```js
// add an `is-noWrapCell` CSS class name
// to each cell that doesn't wrap content
noWordWrapClassName: 'is-noWrapCell',
```


### numericFormat

::: ask-about-api numericFormat|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4603

:::

_core.numericFormat : object_

Configures the number format for [`numeric`](@/guides/cell-types/numeric-cell-type/numeric-cell-type.md)
cells, including currency, units, precision, and other display options.

Since v17.0.0, this option accepts all properties of the
[`Intl.NumberFormatOptions`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat)
object. The locale is controlled separately via the [`locale`](@/api/options.md#locale) option.

**Style options:**

| Property          | Possible values                                           | Description                                                    |
| ----------------- | --------------------------------------------------------- | -------------------------------------------------------------- |
| `style`           | `'decimal'` (default), `'currency'`, `'percent'`, `'unit'`| The formatting style to use                                    |
| `currency`        | ISO 4217 currency codes (e.g., `'USD'`, `'EUR'`, `'PLN'`) | Required when `style` is `'currency'`                          |
| `currencyDisplay` | `'symbol'` (default), `'narrowSymbol'`, `'code'`, `'name'`| How to display the currency                                    |
| `currencySign`    | `'standard'` (default), `'accounting'`                    | Use parentheses for negative values in accounting format       |
| `unit`            | Unit identifiers (e.g., `'kilometer'`, `'liter'`)         | Required when `style` is `'unit'`                              |
| `unitDisplay`     | `'short'` (default), `'narrow'`, `'long'`                 | How to display the unit                                        |

**Notation options:**

| Property          | Possible values                                               | Description                                              |
| ----------------- | ------------------------------------------------------------- | -------------------------------------------------------- |
| `notation`        | `'standard'` (default), `'scientific'`, `'engineering'`, `'compact'` | The formatting notation                           |
| `compactDisplay`  | `'short'` (default), `'long'`                                 | Display style for compact notation (e.g., `1.5M` vs `1.5 million`) |

**Sign and grouping options:**

| Property          | Possible values                                                     | Description                                        |
| ----------------- | ------------------------------------------------------------------- | -------------------------------------------------- |
| `signDisplay`     | `'auto'` (default), `'never'`, `'always'`, `'exceptZero'`, `'negative'` | When to display the sign                       |
| `useGrouping`     | `true`, `false` (default), `'always'`, `'auto'`, `'min2'`           | Whether to use grouping separators (e.g., `1,000`) |

**Digit options:**

| Property                  | Possible values | Description                                                   |
| ------------------------- | --------------- | ------------------------------------------------------------- |
| `minimumIntegerDigits`    | `1` to `21`     | Minimum number of integer digits (pads with zeros)            |
| `minimumFractionDigits`   | `0` to `100`    | Minimum number of fraction digits                             |
| `maximumFractionDigits`   | `0` to `100`    | Maximum number of fraction digits                             |
| `minimumSignificantDigits`| `1` to `21`     | Minimum number of significant digits                          |
| `maximumSignificantDigits`| `1` to `21`     | Maximum number of significant digits                          |

**Rounding options:**

| Property              | Possible values                                                                                     | Description                          |
| --------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `roundingMode`        | `'halfExpand'` (default), `'ceil'`, `'floor'`, `'expand'`, `'trunc'`, `'halfCeil'`, `'halfFloor'`, `'halfTrunc'`, `'halfEven'` | Rounding algorithm |
| `roundingPriority`    | `'auto'` (default), `'morePrecision'`, `'lessPrecision'`                                            | Priority between fraction and significant digits |
| `roundingIncrement`   | `1`, `2`, `5`, `10`, `20`, `25`, `50`, `100`, `200`, `250`, `500`, `1000`, `2000`, `2500`, `5000`    | Increment for rounding (e.g., nickel rounding) |
| `trailingZeroDisplay` | `'auto'` (default), `'stripIfInteger'`                                                              | Whether to strip trailing zeros for integers |

**Locale options:**

| Property          | Possible values                                           | Description                                        |
| ----------------- | --------------------------------------------------------- | -------------------------------------------------- |
| `localeMatcher`   | `'best fit'` (default), `'lookup'`                        | Locale matching algorithm                          |
| `numberingSystem` | `'latn'`, `'arab'`, `'hans'`, `'deva'`, `'thai'`, etc.    | Numbering system to use                            |

For complete reference, see [MDN: Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#options).

This option affects only the displayed output in the cell renderer.
It has no effect on the numeric cell editor. In the source data, numeric values
are stored as JavaScript numbers.

Read more:
- [`locale`](@/api/options.md#locale)
- [Numeric cell type](@/guides/cell-types/numeric-cell-type/numeric-cell-type.md)
- [Cell renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md)
- [Third-party licenses](@/guides/technical-specification/third-party-licenses/third-party-licenses.md)

**Default**: <code>undefined</code>  
**Since**: 0.35.0  
**Example**  
```js
columns: [
  {
    type: 'numeric',
    locale: 'en-US',
    numericFormat: {
      style: 'currency',
      currency: 'USD',
    }
  }
],
```


### observeDOMVisibility

::: ask-about-api observeDOMVisibility|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4667

:::

_core.observeDOMVisibility : boolean_

If the `observeDOMVisibility` option is set to `true`,
Handsontable rerenders every time it detects that the grid was made visible in the DOM.

Handsontable uses a `MutationObserver` to watch for CSS changes (such as `display: none` being removed)
on the container element and its ancestors. When visibility is restored after being hidden,
Handsontable automatically triggers a rerender to ensure correct layout and dimensions.
Set this option to `false` if you want to control rendering manually (e.g. by calling `render()` yourself).

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>true</code>  
**Example**  
```js
// don't rerender the grid on visibility changes
observeDOMVisibility: false,
```


### outsideClickDeselects

::: ask-about-api outsideClickDeselects|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4706

:::

_core.outsideClickDeselects : boolean | function_

The `outsideClickDeselects` option determines what happens to the current [selection](@/guides/cell-features/selection/selection.md)
when you click outside of the grid.

You can set the `outsideClickDeselects` option to one of the following:

| Setting          | Description                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------- |
| `true` (default) | On a mouse click outside of the grid, clear the current [selection](@/guides/cell-features/selection/selection.md) |
| `false`          | On a mouse click outside of the grid, keep the current [selection](@/guides/cell-features/selection/selection.md)  |
| A function       | A function that takes the click event target and returns a boolean                                       |

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>true</code>  
**Example**  
```js
// on a mouse click outside of the grid, clear the current selection
outsideClickDeselects: true,

// on a mouse click outside of the grid, keep the current selection
outsideClickDeselects: false,

// take the click event target and return `false`
outsideClickDeselects(event) {
  return false;
}

// take the click event target and return `true`
outsideClickDeselects(event) {
  return false;
}
```


### placeholder

::: ask-about-api placeholder|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4786

:::

_core.placeholder : string_

The `placeholder` option lets you display placeholder text in every empty cell.

You can set the `placeholder` option to one of the following:

| Setting            | Example        | Description                                                           |
| ------------------ | -------------- | --------------------------------------------------------------------- |
| A non-empty string | `'Empty cell'` | Display `Empty cell` text in empty cells                              |
| A non-string value | `000`          | Display `000` text in empty cells (non-string values get stringified) |

Read more:
- [`placeholderCellClassName`](@/api/options.md#placeholdercellclassname)

**Default**: <code>undefined</code>  
**Example**  
```js
// display 'Empty cell' text
// in every empty cell of the entire grid
placeholder: 'Empty cell',

// or
columns: [
  {
    data: 'date',
    dateFormat: { day: '2-digit', month: '2-digit', year: 'numeric' },
    // display 'Empty date cell' text
    // in every empty cell of the `date` column
    placeholder: 'Empty date cell'
  }
],
```


### placeholderCellClassName

::: ask-about-api placeholderCellClassName|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4815

:::

_core.placeholderCellClassName : string_

The `placeholderCellClassName` option lets you add a CSS class name to cells
that contain [`placeholder`](@/api/options.md#placeholder) text.

Read more:
- [Cell validator](@/guides/cell-functions/cell-validator/cell-validator.md)
- [`placeholder`](@/api/options.md#placeholder)
- [`currentRowClassName`](@/api/options.md#currentrowclassname)
- [`currentHeaderClassName`](@/api/options.md#currentheaderclassname)
- [`activeHeaderClassName`](@/api/options.md#activeheaderclassname)
- [`currentColClassName`](@/api/options.md#currentcolclassname)
- [`readOnlyCellClassName`](@/api/options.md#readonlycellclassname)
- [`commentedCellClassName`](@/api/options.md#commentedcellclassname)
- [`noWordWrapClassName`](@/api/options.md#nowordwrapclassname)
- [`TableClassName`](@/api/options.md#tableclassname)
- [`className`](@/api/options.md#classname)

**Default**: <code>"htPlaceholder"</code>  
**Example**  
```js
// add a `has-placeholder` CSS class name
// to each cell that contains `placeholder` text
placeholderCellClassName: 'has-placeholder',
```


### preserveNumericLiteral

::: ask-about-api preserveNumericLiteral|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4644

:::

_core.preserveNumericLiteral : boolean_

Controls whether a [`numeric`](@/guides/cell-types/numeric-cell-type/numeric-cell-type.md)
cell keeps the exact text you typed when converting it to a JavaScript number would lose
information.

By default (`false`), a numeric cell always stores the parsed JavaScript number, so a value
like `9.0` is stored as `9` and the editor shows `9` the next time you open it. Numbers whose
magnitude exceeds the safe-integer limit (`9007199254740991`) also lose precision.

When set to `true`, and only when parsing would be lossy, the cell keeps the original literal
string instead of the number. This preserves trailing decimal zeros (`9.0`, `9.50`) and the
full precision of large numbers in the cell editor, matching spreadsheet software. Values
that convert without loss (for example `9`, `9.5`, `1000`) are still stored as numbers, so
sorting, filtering, and formula calculations are unaffected. A preserved literal also keeps
behaving like a number in those features: column sorting and filter conditions compare it
numerically, and the [`Formulas`](@/api/formulas.md) engine parses the literal as a number,
so functions such as `SUM` still include the cell. The cell renderer still formats
the value according to [`numericFormat`](@/api/options.md#numericformat); only the editor
shows the preserved literal. One exception: the filter menu's "Filter by value" checkbox
list compares values strictly, so a preserved literal (`'9.0'`) and its plain number (`9`)
appear as two separate entries.

The default is `false` so existing configurations keep their current behavior.

**Default**: <code>false</code>  
**Since**: 18.1.0  
**Example**  
```js
columns: [
  {
    type: 'numeric',
    // keep `9.0` and very large numbers as typed in the editor
    preserveNumericLiteral: true,
  }
],
```


### preventOverflow

::: ask-about-api preventOverflow|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4845

:::

_core.preventOverflow : string | boolean_

The `preventOverflow` option configures preventing Handsontable
from overflowing outside of its parent element.

When enabled, Handsontable caps its own dimensions to match the parent container's size in the specified direction,
preventing the grid from extending beyond the visible bounds of its parent.
This is useful when the parent element has `overflow: hidden` or a fixed size and you want the grid to fit within it.

You can set the `preventOverflow` option to one of the following:

| Setting           | Description                      |
| ----------------- | -------------------------------- |
| `false` (default) | Don't prevent overflowing        |
| `'horizontal'`      | Prevent horizontal overflowing |
| `'vertical'`        | Prevent vertical overflowing   |

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>false</code>  
**Example**  
```js
// prevent horizontal overflowing
preventOverflow: 'horizontal',
```


### readOnly

::: ask-about-api readOnly|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4919

:::

_core.readOnly : boolean_

The `readOnly` option determines whether a [cell](@/guides/cell-features/read-only-cells/read-only-cells.md#make-specific-cells-read-only),
[comment](@/guides/cell-features/comments/comments.md#make-a-comment-read-only), [column](@/guides/cell-features/read-only-cells/read-only-cells.md#make-a-column-read-only)
or the [entire grid](@/guides/cell-features/read-only-cells/read-only-cells.md#make-the-grid-read-only) is editable or not. You can configure it as follows:

| Setting           | Description                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `false` (default) | Set as editable                                                                                                           |
| `true`            | - Set as read-only<br>- Add the [`readOnlyCellClassName`](@/api/options.md#readonlycellclassname) CSS class name (by default: `htDimmed`) |

`readOnly` cells can't be changed by the `populateFromArray()` method.

Read more:
- [Read-only cells](@/guides/cell-features/read-only-cells/read-only-cells.md)
- [Configuration options: Cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration)

**Default**: <code>false</code>  
**Example**  
```js
// make the entire grid read-only
const configurationOptions = {
  columnSorting: true,
};

// make the third column read-only
const configurationOptions = {
  columns: [
    {},
    {},
    {
      readOnly: true,
    },
  ],
};

// make a specific cell read-only
const configurationOptions = {
  cell: [
    {
      row: 0,
      col: 0,
      readOnly: true,
    },
};
```


### readOnlyCellClassName

::: ask-about-api readOnlyCellClassName|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4946

:::

_core.readOnlyCellClassName : string_

The `readOnlyCellClassName` option lets you add a CSS class name to [read-only](@/api/options.md#readonly) cells.

Read more:
- [`currentRowClassName`](@/api/options.md#currentrowclassname)
- [`currentColClassName`](@/api/options.md#currentcolclassname)
- [`currentHeaderClassName`](@/api/options.md#currentheaderclassname)
- [`activeHeaderClassName`](@/api/options.md#activeheaderclassname)
- [`invalidCellClassName`](@/api/options.md#invalidcellclassname)
- [`placeholderCellClassName`](@/api/options.md#placeholdercellclassname)
- [`commentedCellClassName`](@/api/options.md#commentedcellclassname)
- [`noWordWrapClassName`](@/api/options.md#nowordwrapclassname)
- [`readOnlyCellClassName`](@/api/options.md#readonlycellclassname)
- [`TableClassName`](@/api/options.md#tableclassname)

**Default**: <code>"htDimmed"</code>  
**Example**  
```js
// add a `is-readOnly` CSS class name
// to every read-only cell
readOnlyCellClassName: 'is-readOnly',
```


### renderAllColumns

::: ask-about-api renderAllColumns|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5004

:::

_core.renderAllColumns : boolean_

The `renderAllColumns` option configures Handsontable's [column virtualization](@/guides/columns/column-virtualization/column-virtualization.md).

You can set the `renderAllColumns` option to one of the following:

| Setting           | Description                                                                                                                                                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `false` (default) | Enable [column virtualization](@/guides/columns/column-virtualization/column-virtualization.md), rendering only visible columns for better performance with many columns.                                                                              |
| `true`            | Disable [column virtualization](@/guides/columns/column-virtualization/column-virtualization.md)<br>(render all columns of the grid), rendering all columns in the dataset, and ensuring all columns are available regardless of horizontal scrolling. |

Setting `renderAllColumns` to `true` overwrites the [`viewportColumnRenderingOffset`](@/api/options.md#viewportcolumnrenderingoffset) setting.

Read more:
- [Column virtualization](@/guides/columns/column-virtualization/column-virtualization.md)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>false</code>  
**Since**: 14.1.0  
**Example**  
```js
// disable column virtualization
renderAllColumns: true,
```


### renderAllRows

::: ask-about-api renderAllRows|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4974

:::

_core.renderAllRows : boolean_

The `renderAllRows` option controls Handsontable's [row virtualization](@/guides/rows/row-virtualization/row-virtualization.md).
You can configure it as follows:

| Setting           | Description                                                                                                                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `false` (default) | Enable [row virtualization](@/guides/rows/row-virtualization/row-virtualization.md), rendering only the visible rows for optimal performance with large datasets.                                                  |
| `true`            | Disable [row virtualization](@/guides/rows/row-virtualization/row-virtualization.md)<br>(render all rows of the grid), rendering all rows in the dataset for consistent rendering and screen reader accessibility. |

Setting `renderAllRows` to `true` overwrites the [`viewportRowRenderingOffset`](@/api/options.md#viewportrowrenderingoffset) setting.

Read more:
- [Row virtualization](@/guides/rows/row-virtualization/row-virtualization.md)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>false</code>  
**Example**  
```js
// disable row virtualization
renderAllRows: true,
```


### renderer

::: ask-about-api renderer|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5066

:::

_core.renderer : string | function_

The `renderer` option sets a [cell renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md) for a cell.

You can set the `renderer` option to one of the following:
- A custom renderer function
- One of the following [cell renderer aliases](@/guides/cell-functions/cell-renderer/cell-renderer.md):

| Alias               | Cell renderer function                                                         |
| ------------------- | ------------------------------------------------------------------------------ |
| A custom alias      | Your [custom cell renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md) function |
| `'autocomplete'`    | `AutocompleteRenderer`                                                         |
| `'base'`            | `BaseRenderer`                                                                 |
| `'checkbox'`        | `CheckboxRenderer`                                                             |
| `'date'`            | `DateRenderer`                                                                 |
| `'intl-date'`       | `IntlDateRenderer`                                                             |
| `'dropdown'`        | `DropdownRenderer`                                                             |
| `'html'`            | `HtmlRenderer`                                                                 |
| `'numeric'`         | `NumericRenderer`                                                              |
| `'password'`        | `PasswordRenderer`                                                             |
| `'text'`            | `TextRenderer`                                                                 |
| `'time'`            | `TimeRenderer`                                                                 |
| `'intl-time'`       | `IntlTimeRenderer`                                                             |

To set the [`renderer`](@/api/options.md#renderer), [`editor`](@/api/options.md#editor), and [`validator`](@/api/options.md#validator)
options all at once, use the [`type`](@/api/options.md#type) option.

Read more:
- [Cell renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md)
- [Cell type](@/guides/cell-types/cell-type/cell-type.md)
- [Configuration options: Cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration)
- [`type`](@/api/options.md#type)

**Default**: <code>undefined</code>  
**Example**  
```js
// use the `numeric` renderer for each cell of the entire grid
renderer: `'numeric'`,

// add a custom renderer function
renderer(hotInstance, td, row, column, prop, value, cellProperties) {
  // your custom renderer's logic
  ...
}

// apply the `renderer` option to individual columns
columns: [
  {
    // use the `autocomplete` renderer for each cell of this column
    renderer: 'autocomplete'
  },
  {
    // use the `myCustomRenderer` renderer for each cell of this column
    renderer: 'myCustomRenderer'
  }
]
```


### rowHeaders

::: ask-about-api rowHeaders|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5260

:::

_core.rowHeaders : boolean | Array&lt;string&gt; | function_

The `rowHeaders` option configures your grid's row headers.

You can set the `rowHeaders` option to one of the following:

| Setting    | Description                                                       |
| ---------- | ----------------------------------------------------------------- |
| `true`     | Enable the default row headers ('1', '2', '3', ...)               |
| `false`    | Disable row headers                                               |
| An array   | Define your own row headers (e.g. `['One', 'Two', 'Three', ...]`) |
| A function | Define your own row headers, using a function                     |

Read more:
- [Row header](@/guides/rows/row-header/row-header.md)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Example**  
```js
// enable the default row headers
rowHeaders: true,

// set your own row headers
rowHeaders: ['One', 'Two', 'Three'],

// set your own row headers, using a function
rowHeaders: function(visualRowIndex) {
  return `${visualRowIndex}: AB`;
},
```


### rowHeaderWidth

::: ask-about-api rowHeaderWidth|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5288

:::

_core.rowHeaderWidth : number | Array&lt;number&gt;_

The `rowHeaderWidth` option configures the width of row headers.

You can set the `rowHeaderWidth` option to one of the following:

| Setting  | Description                                     |
| -------- | ----------------------------------------------- |
| A number | Set the same width for every row header         |
| An array | Set different widths for individual row headers |

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Example**  
```js
// set the same width for every row header
rowHeaderWidth: 25,

// set different widths for individual row headers
rowHeaderWidth: [25, 30, 55],
```


### rowHeights

::: ask-about-api rowHeights|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5336

:::

_core.rowHeights : number | Array&lt;number&gt; | string | Array&lt;string&gt; | Array&lt;undefined&gt; | function_

The `rowHeights` option sets rows' heights, in pixels.

In the rendering process, the default row height is `classic: 26px`, `main: 29px`, `horizon: 37px` or whatever is defined in the used theme (based on the line height, vertical padding and cell borders).
You can change it to equal or greater than the default value, by setting the `rowHeights` option to one of the following:

| Setting     | Description                                                                                         | Example                                                      |
| ----------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| A number    | Set the same height for every row                                                                   | `rowHeights: 100`                                            |
| A string    | Set the same height for every row                                                                   | `rowHeights: '100px'`                                        |
| An array    | Set heights separately for each row                                                                 | `rowHeights: [100, 120, undefined]`                          |
| A function  | Set row heights dynamically,<br>on each render                                                      | `rowHeights(visualRowIndex) { return visualRowIndex * 10; }` |
| `undefined` | Used by the [modifyRowHeight](@/api/hooks.md#modifyrowheight) hook,<br>to detect row height changes | `rowHeights: undefined`                                      |

The `rowHeights` option also sets the minimum row height that can be set
via the [ManualRowResize](@/api/manualRowResize.md) and [AutoRowSize](@/api/autoRowSize.md) plugins (if they are enabled).

Read more:
- [Row height](@/guides/rows/row-height/row-height.md)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Example**  
```js
// set every row's height to 100px
rowHeights: 100,

// set every row's height to 100px
rowHeights: '100px',

// set the first (by visual index) row's height to 100
// set the second (by visual index) row's height to 120
// set the third (by visual index) row's height to `undefined`
// set any other row's height to the default height value
rowHeights: [100, 120, undefined],

// set each row's height individually, using a function
rowHeights(visualRowIndex) {
  return visualRowIndex * 10;
},
```


### sanitizer

::: ask-about-api sanitizer|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L7066

:::

_core.sanitizer : function_

The `sanitizer` option configures the function used to sanitize HTML before it is written to the DOM.
Sanitization is important when content comes from users or external sources to prevent XSS
(e.g. script injection, event handlers).

By default (when no sanitizer is set), HTML is applied as-is (pass-through). You are responsible for
XSS protection. Set a sanitizer when you need to allow rich content while stripping or neutralizing
dangerous markup.

The sanitizer covers the HTML that Handsontable writes on your behalf:

- cells rendered by the [`password`](@/guides/cell-types/password-cell-type/password-cell-type.md) cell type
- column and row headers, including [`nestedHeaders`](@/api/options.md#nestedheaders) labels
- [context menu](@/api/options.md#contextmenu) and [dropdown menu](@/api/options.md#dropdownmenu) item labels
- [`select`](@/api/options.md#selectoptions) editor options
- [dialog](@/api/options.md#dialog) and [notification](@/api/options.md#notification) content
- HTML pasted from the clipboard, and Handsontable's own clipboard payload carrying the source
  data behind copied cells

Two surfaces are deliberately excluded, because both exist to render raw markup you supply:
the [`html`](@/guides/cell-types/cell-type/cell-type.md) cell type, and
[`allowHtml`](@/api/options.md#allowhtml) sources in `autocomplete` and `dropdown` cells. Sanitize that content
yourself before passing it to the grid.

The function receives the raw HTML string and a second argument (source) naming the write surface
(`'header'`, `'password'`, `'contextMenu'`, `'selectEditor'`, `'dialog'`, `'notification'`,
`'CopyPaste.paste'`, `'CopyPaste.paste.sourceData'`), so you can apply different rules per source.
It must return a string that is safe to assign to `innerHTML`.

In TypeScript, annotate that parameter with the exported `SanitizerContext` type
(see [TypeScript types](@/guides/tools-and-building/typescript-types/typescript-types.md))
to get editor completion on the values above.

`'CopyPaste.paste.sourceData'` carries Handsontable's own clipboard payload, the one that lets an
object-valued cell survive a copy between grids. It is parsed into an inert document, so returning it
unchanged does not expose you to a crafted clipboard, and doing so is what keeps
[`parsePastedValue`](@/api/options.md#parsepastedvalue) working under a sanitizer that escapes HTML rather than
stripping it.

This option is only respected when set in the table settings. It does not work when defined per column
or per cell (e.g. in `columns` or cell meta).

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Since**: 17.0.0  
**Example**  
```js
// Allowlist-based sanitization using a custom library
sanitizer: (content, source) => myLibrary.sanitize(content),
```
**Example**  
```js
// Maximum safety: strip all tags and escape output (no rich HTML)
sanitizer: (content, source) => {
  const tpl = document.createElement('template');

  tpl.innerHTML = content;

  const text = tpl.content.textContent ?? '';

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
},
```
**Example**  
```js
// Trusted Types: wrap sanitization in a policy so the sink accepts the result.
// Add the policy name to the CSP trusted-types directive (e.g. trusted-types default handsontable).
const policy = window.trustedTypes?.createPolicy('handsontable', {
  createHTML: (input) => myLibrary.sanitize(input),
});

sanitizer: (content, source) =>
  policy ? policy.createHTML(content) : myLibrary.sanitize(content),
```


### searchInput

::: ask-about-api searchInput|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5430

:::

_core.searchInput : boolean_

The `searchInput` option configures whether the [`multiSelect`](@/guides/cell-types/multiselect-cell-type/multiselect-cell-type.md) editor's search input is visible.

**Default**: <code>true</code>  
**Since**: 17.0.0  
**Example**  
```js
columns: [{
  type: 'multiselect',
  // hide the `multiSelect` editor's search input
  searchInput: false,
}],
```


### selectionHandles

::: ask-about-api selectionHandles|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5494

:::

_core.selectionHandles : boolean_

The `selectionHandles` option enables draggable handles on the edges of a
[selection](@/guides/cell-features/selection/selection.md). When enabled, hovering over a
selected range shows a pill-shaped handle at the midpoint of each edge; dragging a handle
resizes that edge of the selection. This adjusts the selected area only – it does not move,
fill, or change any cell data.

Handles are shown on desktop only and are hidden on any edge that is flush with the grid
boundary -- or that lands on a frozen-pane line ([`fixedRowsTop`](@/api/options.md#fixedrowstop),
[`fixedRowsBottom`](@/api/options.md#fixedrowsbottom), [`fixedColumnsStart`](@/api/options.md#fixedcolumnsstart)). The option
has no effect when [`selectionMode`](@/api/options.md#selectionmode) is `'single'`.

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).

**Default**: <code>false</code>  
**Since**: 18.1.0  
**Example**  
```js
// enable draggable selection-edge handles
selectionHandles: true,
```


### selectionMode

::: ask-about-api selectionMode|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5468

:::

_core.selectionMode : string_

The `selectionMode` option configures how [selection](@/guides/cell-features/selection/selection.md) works.

You can set the `selectionMode` option to one of the following:

| Setting      | Description                                                  |
| ------------ | ------------------------------------------------------------ |
| `'single'`   | Allow the user to select only one cell at a time.            |
| `'range'`    | Allow the user to select one range of cells at a time.       |
| `'multiple'` | Allow the user to select multiple ranges of cells at a time. |

When `selectionMode` is set to `'single'`, copying with
[`fragmentSelection`](@/api/options.md#fragmentselection) enabled is limited to a single cell.

Read more:
- [Selection: Selecting ranges](@/guides/cell-features/selection/selection.md#select-ranges)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>"multiple"</code>  
**Example**  
```js
// you can only select one cell at at a time
selectionMode: 'single',

// you can select one range of cells at a time
selectionMode: 'range',

// you can select multiple ranges of cells at a time
selectionMode: 'multiple',
```


### selectOptions

::: ask-about-api selectOptions|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5579

:::

_core.selectOptions : Array&lt;string&gt; | object | function_

The `selectOptions` option configures options that the end user can choose from in [`select`](@/guides/cell-types/select-cell-type/select-cell-type.md) cells.

You can set the `selectOptions` option to one of the following:

| Setting                         | Description                                                                   |
| ------------------------------- | ----------------------------------------------------------------------------- |
| An array of strings             | Each string is one option's value and label                                   |
| An object with key-string pairs | - Each key is one option's value<br>- The key's string is that option's label |
| A function                      | A function that returns an object with key-string pairs                       |

Read more:
- [Select cell type](@/guides/cell-types/select-cell-type/select-cell-type.md)

**Default**: <code>undefined</code>  
**Example**  
```js
columns: [
  {
    // set the `type` of each cell in this column to `select`
    type: 'select',
    // set the first option's value and label to `A`
    // set the second option's value and label to `B`
    // set the third option's value and label to `C`
    selectOptions: ['A', 'B', 'C'],
  },
  {
    // set the `type` of each cell in this column to `select`
    type: 'select',
    selectOptions: {
      // set the first option's value to `value1` and label to `Label 1`
      value1: 'Label 1',
      // set the second option's value to `value2` and label to `Label 2`
      value2: 'Label 2',
      // set the third option's value to `value3` and label to `Label 3`
      value3: 'Label 3',
    },
  },
  {
    // set the `type` of each cell in this column to `select`
    type: 'select',
    // set `selectOption` to a function that returns available options as an object
    selectOptions(visualRow, visualColumn, prop) {
      return {
        value1: 'Label 1',
        value2: 'Label 2',
        value3: 'Label 3',
      };
  },
],
```


### skipColumnOnPaste

::: ask-about-api skipColumnOnPaste|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5610

:::

_core.skipColumnOnPaste : boolean_

The `skipColumnOnPaste` option determines whether you can paste data into a given column.

You can only apply the `skipColumnOnPaste` option to an entire column, using the [`columns`](@/api/options.md#columns) option. This option is not supported for the global table level settings.

You can set the `skipColumnOnPaste` option to one of the following:

| Setting           | Description                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| `false` (default) | Enable pasting data into this column                                                                  |
| `true`            | - Disable pasting data into this column<br>- On pasting, paste data into the next column to the right |

Read more:
- [Configuration options: Setting column options](@/guides/getting-started/configuration-options/configuration-options.md#set-column-options)

**Default**: <code>false</code>  
**Example**  
```js
columns: [
  {
    // disable pasting data into this column
    skipColumnOnPaste: true
  }
],
```


### skipRowOnPaste

::: ask-about-api skipRowOnPaste|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5646

:::

_core.skipRowOnPaste : boolean_

The `skipRowOnPaste` option determines whether you can paste data into a given row.

You can only apply the `skipRowOnPaste` option to an entire row, using the [`cells`](@/api/options.md#cells) option. This option is not supported for the global table level settings.

You can set the `skipRowOnPaste` option to one of the following:

| Setting           | Description                                                                         |
| ----------------- | ----------------------------------------------------------------------------------- |
| `false` (default) | Enable pasting data into this row                                                   |
| `true`            | - Disable pasting data into this row<br>- On pasting, paste data into the row below |

Read more:
- [Configuration options: Setting row options](@/guides/getting-started/configuration-options/configuration-options.md#set-row-options)

**Default**: <code>false</code>  
**Example**  
```js
cells(row, column) {
 const cellProperties = {};

 // disable pasting data into row 1
 if (row === 1) {
   cellProperties.skipRowOnPaste = true;
 }

 return cellProperties;
}
```


### sortByRelevance

::: ask-about-api sortByRelevance|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5678

:::

_core.sortByRelevance : boolean_

The `sortByRelevance` option configures whether [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md) cells'
lists are sorted in the same order as provided in the [`source`](@/api/options.md#source) option.

You can set the `sortByRelevance` option to one of the following:

| Setting          | Description                                                                  |
| ---------------- | ---------------------------------------------------------------------------- |
| `true` (default) | Sort options in the same order as provided in the [`source`](@/api/options.md#source) option |
| `false`          | Sort options alphabetically                                                  |

Read more:
- [`source`](@/api/options.md#source)
- [Autocomplete cell type](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)

**Default**: <code>true</code>  
**Example**  
```js
columns: [{
  // set the `type` of each cell in this column to `autocomplete`
  type: 'autocomplete',
  // set options available in every `autocomplete` cell of this column
  source: ['D', 'C', 'B', 'A'],
  // sort the `autocomplete` option in this order: D, C, B, A
  sortByRelevance: true
}],
```


### source

::: ask-about-api source|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5764

:::

_core.source : Array | function_

The `source` option sets options available in [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
and [`dropdown`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md) cells.

You can set the `source` option to one of the following:

- An array of string values
- An array of objects with `key` and `value` properties
- A function

Note: When defining the `source` option as an array of objects with `key` and `value` properties, the data format for that cell
needs to be an object with `key` and `value` properties as well.

Read more:
- [Autocomplete cell type](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
- [Dropdown cell type](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md)
- [`strict`](@/api/options.md#strict)
- [`allowHtml`](@/api/options.md#allowhtml)
- [`filter`](@/api/options.md#filter)
- [`sortByRelevance`](@/api/options.md#sortbyrelevance)

**Default**: <code>undefined</code>  
**Example**  
```js
// set `source` to an array of string values
columns: [{
  // set the `type` of each cell in this column to `autocomplete`
  type: 'autocomplete',
  // set options available in every `autocomplete` cell of this column
  source: ['A', 'B', 'C', 'D']
}],

// set `source` to an array of objects with `key` and `value` properties
columns: [{
  // set the `type` of each cell in this column to `autocomplete`
  type: 'autocomplete',
  // set options available in every `autocomplete` cell of this column
  source: [{
    key: 'A',
    value: 'Label A'
  }, {
    key: 'B',
    value: 'Label B'
  }]
}],

// set `source` to a function
columns: [{
  // set the `type` of each cell in this column to `autocomplete`
  type: 'autocomplete',
  // for every `autocomplete` cell in this column, fetch data from an external source
  source(query, callback) {
    fetch('https://example.com/query?q=' + query, function(response) {
      callback(response.items);
    })
  }
}],
```


### sourceDataValidator

::: ask-about-api sourceDataValidator|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6611

:::

_core.sourceDataValidator : function_

The [`sourceDataValidator`](@/api/options.md#sourcedatavalidator) option sets a function that validates values
when they are written to the source data layer. Validation runs on table initialization and when calling
`loadData`, `updateData`, or
`setSourceDataAtCell`. It does not run for the `setData*` family of methods.

Return `true` from the function to mark the value as valid, or `false` to mark it invalid. When a value is
invalid and [`allowInvalid`](@/api/options.md#allowinvalid) is `false`, it is replaced with `null` in the
source (on initialization and when calling `loadData` or `updateData`). When `allowInvalid` is `true`, invalid
values are kept; a warning is still logged when the validator returns `false`. An exception:
`setSourceDataAtCell` - when the validator returns `false`, the write is
skipped and the cell is not nullified; the previous value in the source remains unchanged. Use
[`allowEmpty`](@/api/options.md#allowempty) to treat `null`, `undefined`, or `''` as valid when appropriate.

Optionally set [`sourceDataWarningMessage`](@/api/options.md#sourcedatawarningmessage) to customize the
message logged for invalid values.

__Limitation:__ source-data validation only sees a `sourceDataValidator` (and a validating cell
[`type`](@/api/options.md#type)) that you define in the global settings, the
[`columns`](@/api/options.md#columns) option, the [`cell`](@/api/options.md#cell) option, or with
`setCellMeta()`. It does __not__ run the [`cells`](@/api/options.md#cells)
function or the [`beforeGetCellMeta`](@/api/hooks.md#beforegetcellmeta) /
[`afterGetCellMeta`](@/api/hooks.md#aftergetcellmeta) hooks, so a validator that you add only through those
is skipped. Define the validator in one of the supported places to validate the source data.

**Default**: <code>undefined</code>  
**Since**: 17.0.0  
**Example**  
```js
sourceDataWarningMessage: 'The source data is invalid.',
sourceDataValidator: (value, cellMeta) => {
  if (cellMeta.allowEmpty && value == null) {
    return true;
  }

  if (typeof value === 'string') {
    return true;
  }

  return false;
}
```


### sourceDataWarningMessage

::: ask-about-api sourceDataWarningMessage|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6627

:::

_core.sourceDataWarningMessage : string_

The [`sourceDataWarningMessage`](@/api/options.md#sourcedatawarningmessage) option sets the message used when
a value fails [`sourceDataValidator`](@/api/options.md#sourcedatavalidator). When not set, no message is logged.

**Default**: <code>undefined</code>  
**Since**: 17.0.0  
**Example**  
```js
sourceDataWarningMessage: 'The source data is invalid.',
```


### sourceSortFunction

::: ask-about-api sourceSortFunction|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5701

:::

_core.sourceSortFunction : function_

The `sourceSortFunction` option sets a function to sort the options available in [`multiSelect`](@/guides/cell-types/multiselect-cell-type/multiselect-cell-type.md)-typed cells.

**Default**: <code>undefined</code>  
**Since**: 17.0.0  
**Example**  
```js
columns: [{
  // set the `type` of each cell in this column to `multiSelect`
  type: 'multiselect',
  // set options available in every `multiSelect` cell of this column
  source: ['A', 'B', 'C', 'D'],
  // sort the `multiSelect` options in this order: D, C, B, A
  sourceSortFunction: (entries) => {
    return entries.sort((a, b) => b.localeCompare(a));
  }
}],
```


### startCols

::: ask-about-api startCols|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5790

:::

_core.startCols : number_

If the [`data`](@/api/options.md#data) option is not set, the `startCols` option sets the initial number of empty columns.

The `startCols` option works only in Handsontable's constructor and only when [`data`](@/api/options.md#data) is not provided.

::: tip
When [`minSpareCols`](@/api/options.md#minsparecols) is set alongside `startCols`, the `startCols` columns count toward the
minimum number of spare columns. As a result, the total initial column count will be the maximum of
`startCols` and `minSpareCols`.
:::

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>5</code>  
**Example**  
```js
// start with 15 empty columns
startCols: 15,
```


### startRows

::: ask-about-api startRows|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5816

:::

_core.startRows : number_

If the [`data`](@/api/options.md#data) option is not set, the `startRows` option sets the initial number of empty rows.

The `startRows` option works only in Handsontable's constructor and only when [`data`](@/api/options.md#data) is not provided.

::: tip
When [`minSpareRows`](@/api/options.md#minsparerows) is set alongside `startRows`, the `startRows` rows count toward the
minimum number of spare rows. As a result, the total initial row count will be the maximum of
`startRows` and `minSpareRows`.
:::

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>5</code>  
**Example**  
```js
// start with 15 empty rows
startRows: 15,
```


### stretchH

::: ask-about-api stretchH|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5852

:::

_core.stretchH : string_

The `stretchH` option determines what happens when the declared grid width
is different from the calculated sum of all column widths.

You can set the `stretchH` option to one of the following:

| Setting            | Description                                                       |
| ------------------ | ----------------------------------------------------------------- |
| `'none'` (default) | Don't fit the grid to the container (disable column stretching)   |
| `'last'`           | Fit the grid to the container, by stretching only the last column |
| `'all'`            | Fit the grid to the container, by stretching all columns evenly   |

Read more:
- [Column width: Column stretching](@/guides/columns/column-width/column-width.md#column-stretching)
- [Column width: Column stretching and manual resizing](@/guides/columns/column-width/column-width.md#column-stretching-and-manual-resizing)

When used with [`manualColumnResize`](@/api/options.md#manualcolumnresize), columns that have a width set
through pre-defined manual sizes are excluded from stretching. Only the remaining columns
are stretched to fill the container.

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>"none"</code>  
**Example**  
```js
// fit the grid to the container
// by stretching all columns evenly
stretchH: 'all',
```


### strict

::: ask-about-api strict|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5888

:::

_core.strict : boolean_

The `strict` option configures the behavior of [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md) cells.

You can set the `strict` option to one of the following:

| Setting | Mode                                                                                          | Description                                                                                |
| ------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `true`  | [Strict mode](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md#autocomplete-strict-mode)         | The end user:<br>- Can only choose one of suggested values<br>- Can't enter a custom value |
| `false` | [Flexible mode](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md#autocomplete-flexible-mode)     | The end user:<br>- Can choose one of suggested values<br>- Can enter a custom value        |

This option can be set at any level of the [cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration):
the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options), the [`columns`](@/api/options.md#columns) level, the [`cells`](@/api/options.md#cells) level, and the [`cell`](@/api/options.md#cell) level.

Read more:
- [Autocomplete cell type](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
- [`source`](@/api/options.md#source)

**Default**: <code>undefined</code>  
**Example**  
```js
columns: [
  {
  // set the `type` of each cell in this column to `autocomplete`
  type: 'autocomplete',
  // set options available in every `autocomplete` cell of this column
  source: ['A', 'B', 'C'],
  // values entered must match `A`, `B`, or `C`
  strict: true
  },
],
```


### tableClassName

::: ask-about-api tableClassName|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5930

:::

_core.tableClassName : string | Array&lt;string&gt;_

The `tableClassName` option lets you add CSS class names
to every Handsontable instance inside the `container` element.

You can set the `tableClassName` option to one of the following:

| Setting             | Description                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------ |
| A string            | Add a single CSS class name to every Handsontable instance inside the `container` element  |
| An array of strings | Add multiple CSS class names to every Handsontable instance inside the `container` element |

Read more:
- [`currentRowClassName`](@/api/options.md#currentrowclassname)
- [`currentColClassName`](@/api/options.md#currentcolclassname)
- [`currentHeaderClassName`](@/api/options.md#currentheaderclassname)
- [`activeHeaderClassName`](@/api/options.md#activeheaderclassname)
- [`invalidCellClassName`](@/api/options.md#invalidcellclassname)
- [`placeholderCellClassName`](@/api/options.md#placeholdercellclassname)
- [`readOnlyCellClassName`](@/api/options.md#readonlycellclassname)
- [`noWordWrapClassName`](@/api/options.md#nowordwrapclassname)
- [`commentedCellClassName`](@/api/options.md#commentedcellclassname)
- [`className`](@/api/options.md#classname)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Example**  
```js
// add a `your-class-name` CSS class name
// to every Handsontable instance inside the `container` element
tableClassName: 'your-class-name',

// add `first-class-name` and `second-class-name` CSS class names
// to every Handsontable instance inside the `container` element
tableClassName: ['first-class-name', 'second-class-name'],
```


### tabMoves

::: ask-about-api tabMoves|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6215

:::

_core.tabMoves : object | function_

The `tabMoves` option configures the action of the <kbd>**Tab**</kbd> key.

You can set the `tabMoves` option to an object with the following properties
(or to a function that returns such an object):

| Property | Type   | Description                                                                                                                                              |
| -------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `row`    | Number | - On pressing <kbd>**Tab**</kbd>, move selection `row` rows down<br>- On pressing <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd>, move selection `row` rows up              |
| `col`    | Number | - On pressing <kbd>**Tab**</kbd>, move selection `col` columns right<br>- On pressing <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd>, move selection `col` columns left     |

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>{row: 0, col: 1}</code>  
**Example**  
```js
// on pressing Tab, move selection 2 rows down and 2 columns right
// on pressing Shift+Tab, move selection 2 rows up and 2 columns left
tabMoves: {row: 2, col: 2},

// the same setting, as a function
// `event` is a DOM Event object received on pressing Tab
// you can use it to check whether the user pressed Tab or Shift+Tab
tabMoves(event) {
  return {row: 2, col: 2};
},
```


### tabNavigation

::: ask-about-api tabNavigation|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4373

:::

_core.tabNavigation : boolean_

When set to `false`, the `tabNavigation` option changes the behavior of the
<kbd>Tab</kbd> and <kbd>Shift</kbd>+<kbd>Tab</kbd> keyboard shortcuts. The Handsontable
no more captures that shortcuts to make the grid navigation available (`tabNavigation: true`)
but returns control to the browser so the native page navigation is possible.

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>true</code>  
**Since**: 14.0.0  
**Example**  
```js
// you can't navigate row and column headers using <kbd>Tab</kbd> or <kbd>Shift</kbd>+<kbd>Tab</kbd> keyboard shortcuts
tabNavigation: false,

// default behavior: you can navigate row and column headers using <kbd>Tab</kbd> or <kbd>Shift</kbd>+<kbd>Tab</kbd> keyboard shortcuts
tabNavigation: true,
```


### textEllipsis

::: ask-about-api textEllipsis|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5960

:::

_core.textEllipsis : boolean_

The `textEllipsis` option configures whether the text content in the cells should be truncated with an ellipsis (three dots).

You can set the `textEllipsis` option to one of the following:

| Setting           | Description                                   |
| ----------------- | --------------------------------------------- |
| `false` (default) | Don't truncate text content with an ellipsis  |
| `true`            | Truncate text content with an ellipsis        |

**Default**: <code>false</code>  
**Since**: 16.0.0  
**Example**  
```js
columns: [
  {
    // truncate text content with an ellipsis
    textEllipsis: true,
  },
  {
    // don't truncate text content with an ellipsis
    textEllipsis: false,
  }
],
```


### theme

::: ask-about-api theme|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6049

:::

_core.theme : ThemeBuilder | string | undefined_

The `theme` option configures the visual theme for your Handsontable instance.

You can set the `theme` option to one of the following:

| Setting                               | Description                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------- |
| `undefined` (default)                 | Don't apply any theme and use the default main theme                                  |
| A string (e.g., `'ht-theme-horizon'`) | Apply a registered theme by name (required to import CSS file)                        |
| A plain theme config object           | Apply a theme with default settings (import and pass the config, e.g. `horizonTheme`) |
| A `ThemeBuilder` object               | Apply a theme with runtime configuration (recommended)                                |

When using a `ThemeBuilder` object, you can configure the theme at runtime using these methods:

| Method                           | Description                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------ |
| `setColorScheme(mode)`           | Sets the color scheme: `'light'`, `'dark'`, or `'auto'` (default: `'auto'`)                |
| `setDensityType(type)`           | Sets the row density: `'compact'`, `'default'`, or `'comfortable'` (default: `'default'`)  |
| `params(paramsObject)`           | Sets custom theme parameters e.g. `icons`, `colors`, `tokens`                              |

Read more:
- [Themes](@/guides/styling/themes/themes.md)
- [`themeName`](@/api/options.md#themename)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Since**: 17.0.0  
**Example**  
```js
// Enable a theme by class name (requires loading the theme CSS)
theme: 'ht-theme-horizon',
```
**Example**  
```js
// Pass a plain theme config object
import { horizonTheme } from 'handsontable/themes';

const hot = new Handsontable(container, {
  theme: horizonTheme,
});
```
**Example**  
```js
// Pass a ThemeBuilder object (for customization before initialization)
import { horizonTheme, registerTheme } from 'handsontable/themes';

const theme = registerTheme(horizonTheme)
  .setColorScheme('dark')
  .setDensityType('compact')
  .params({
    tokens: {
      fontSize: '14px',
      iconSize: 'size_5',
      borderColor: ['colors.palette.100', 'colors.palette.800'],
    },
  });

const hot = new Handsontable(container, {
  theme,
});
```


### themeName

::: ask-about-api themeName|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5980

:::

_core.themeName : string | undefined_

The `themeName` option allows enabling a theme by that name.

Read more:
- [Themes](@/guides/styling/themes/themes.md)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Since**: 15.0.0  
**Example**  
```js
themeName: 'ht-theme-name',
```


### timeFormat

::: ask-about-api timeFormat|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1939

:::

_core.timeFormat : object_

Configures the time format for `intl-time` cells using an
[`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat)
options object. The locale is controlled separately via the [`locale`](@/api/options.md#locale) option.

::: tip Source data format
Source data must be in 24-hour time format (`HH:mm`, `HH:mm:ss`, or `HH:mm:ss.SSS`), matching
the HTML `input type="time"` value. Otherwise operations such as sorting and filtering can be unstable or unpredictable.
The `timeFormat` object affects only how times are displayed; the underlying value should remain in that format.
:::

**Style shortcuts:**

| Property     | Possible values                                    | Description                                              |
| ------------ | -------------------------------------------------- | -------------------------------------------------------- |
| `timeStyle`  | `'full'`, `'long'`, `'medium'`, `'short'`          | Time formatting style (expands to hour, minute, second, timeZoneName) |

**Time component options:**

| Property                 | Possible values                                                                 | Description                          |
| ------------------------ | ------------------------------------------------------------------------------- | ------------------------------------ |
| `hour`                   | `'numeric'`, `'2-digit'`                                                        | Representation of the hour           |
| `minute`                 | `'numeric'`, `'2-digit'`                                                        | Representation of the minute         |
| `second`                 | `'numeric'`, `'2-digit'`                                                        | Representation of the second         |
| `fractionalSecondDigits` | `1`, `2`, `3`                                                                   | Fraction-of-second digits            |
| `dayPeriod`              | `'narrow'`, `'short'`, `'long'`                                                 | Day period (e.g. "am", "noon")       |
| `timeZoneName`           | `'long'`, `'short'`, `'shortOffset'`, `'longOffset'`, `'shortGeneric'`, `'longGeneric'` | Time zone display                 |

**Locale and other options:**

| Property          | Possible values                                    | Description                    |
| ----------------- | -------------------------------------------------- | ------------------------------ |
| `localeMatcher`   | `'best fit'` (default), `'lookup'`                  | Locale matching algorithm      |
| `timeZone`        | IANA time zone (e.g. `'UTC'`, `'America/New_York'`) | Time zone for formatting       |
| `hour12`          | `true`, `false`                                    | Use 12-hour vs 24-hour time   |
| `hourCycle`       | `'h11'`, `'h12'`, `'h23'`, `'h24'`                 | Hour cycle                     |
| `formatMatcher`   | `'basic'`, `'best fit'` (default)                  | Format matching algorithm      |

For complete reference, see [MDN: Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat).

Read more:
- [Time cell type](@/guides/cell-types/time-cell-type/time-cell-type.md)
- [`locale`](@/api/options.md#locale)

**Default**: <code>{ hour: &#x27;2-digit&#x27;, minute: &#x27;2-digit&#x27; }</code>  
**Example**  
```js
columns: [
  {
    type: 'intl-time',
    locale: 'en-US',
    timeFormat: {
      timeStyle: 'medium'
    }
  }
]
```


### title

::: ask-about-api title|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6255

:::

_core.title : string_

The `title` option configures [column header](@/guides/columns/column-header/column-header.md) names.

You can set the `title` option to a string.

To set the labels of all column headers at once, use the [`colHeaders`](@/api/options.md#colheaders) option.

Read more:
- [Column header](@/guides/columns/column-header/column-header.md)
- [`colHeaders`](@/api/options.md#colheaders)
- [`columns`](@/api/options.md#columns)

This option can only be set at the [`columns`](@/api/options.md#columns) level.
It has no effect when set at the grid level, or in the [`cells`](@/api/options.md#cells) or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Example**  
```js
columns: [
  {
    // set the first column header name to `First name`
    title: 'First name',
    type: 'text',
  },
  {
    // set the second column header name to `Last name`
    title: 'Last name',
    type: 'text',
  }
],
```


### trimDropdown

::: ask-about-api trimDropdown|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6300

:::

_core.trimDropdown : boolean_

The `trimDropdown` option configures the width of the [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
and [`dropdown`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md) lists.

When set to `true` (default), the list is trimmed to match the width of the edited cell,
which can truncate long option labels. When set to `false`, the list expands to fit its
longest option – it can grow wider than the cell, but never narrower.

You can set the `trimDropdown` option to one of the following:

| Setting          | Description                                                                     |
| ---------------- | ------------------------------------------------------------------------------- |
| `true` (default) | Make the dropdown/autocomplete list's width the same as the edited cell's width |
| `false`          | Expand the list to its content, but keep it at least as wide as the edited cell |

This option can be set at any level of the [cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration):
the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options), the [`columns`](@/api/options.md#columns) level, the [`cells`](@/api/options.md#cells) level, and the [`cell`](@/api/options.md#cell) level.

Read more:
- [Autocomplete cell type](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
- [Dropdown cell type](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md)

**Default**: <code>true</code>  
**Example**  
```js
columns: [
  {
    type: 'autocomplete',
    // for each cell of this column
    // make the `autocomplete` list's width the same as the edited cell's width
    trimDropdown: true,
  },
  {
    type: 'dropdown',
    // for each cell of this column
    // scale the `dropdown` list's width to the list's content
    trimDropdown: false,
  }
],
```


### trimWhitespace

::: ask-about-api trimWhitespace|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6361

:::

_core.trimWhitespace : boolean_

The `trimWhitespace` option configures automatic whitespace removal. This option
affects the cell renderer and the cell editor.

You can set the `trimWhitespace` option to one of the following:

| Setting          | Description                                                     |
| ---------------- | --------------------------------------------------------------- |
| `true` (default) | Remove whitespace at the beginning and at the end of each cell |
| `false`          | Don't remove whitespace                                         |

**Default**: <code>true</code>  
**Example**  
```js
columns: [
  {
    // don't remove whitespace
    // from any cell of this column
    trimWhitespace: false
  }
]
```


### type

::: ask-about-api type|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6419

:::

_core.type : string_

The `type` option lets you set the [`renderer`](@/api/options.md#renderer), [`editor`](@/api/options.md#editor), and [`validator`](@/api/options.md#validator)
options all at once, by selecting a [cell type](@/guides/cell-types/cell-type/cell-type.md).

You can set the `type` option to one of the following:

| Cell type                                                         | Renderer, editor & validator                                                                                                                                                                                                                       |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A [custom cell type](@/guides/cell-types/cell-type/cell-type.md)            | Renderer: your [custom cell renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md)<br>Editor: your [custom cell editor](@/guides/cell-functions/cell-editor/cell-editor.md)<br>Validator: your [custom cell validator](@/guides/cell-functions/cell-validator/cell-validator.md) |
| [`'autocomplete'`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md) | Renderer: `AutocompleteRenderer`<br>Editor: `AutocompleteEditor`<br>Validator: `AutocompleteValidator`                                                                         |
| [`'checkbox'`](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md)         | Renderer: `CheckboxRenderer`<br>Editor: `CheckboxEditor`<br>Validator: -                                                                                                                               |
| [`'date'`](@/guides/cell-types/date-cell-type/date-cell-type.md)                 | Renderer: `DateRenderer`<br>Editor: `DateEditor`<br>Validator: `DateValidator`                                                                                                 |
| [`'intl-date'`](@/guides/cell-types/date-cell-type/date-cell-type.md)                 | Renderer: `IntlDateRenderer`<br>Editor: `IntlDateEditor`<br>Validator: `IntlDateValidator`                                                                                                 |
| [`'dropdown'`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md)         | Renderer: `DropdownRenderer`<br>Editor: `DropdownEditor`<br>Validator: `DropdownValidator`                                                                                     |
| [`'handsontable'`](@/guides/cell-types/handsontable-cell-type/handsontable-cell-type.md) | Renderer: `AutocompleteRenderer`<br>Editor: `HandsontableEditor`<br>Validator: -                                                                                                                       |
| [`'numeric'`](@/guides/cell-types/numeric-cell-type/numeric-cell-type.md)           | Renderer: `NumericRenderer`<br>Editor: `NumericEditor`<br>Validator: `NumericValidator`                                                                                        |
| [`'password'`](@/guides/cell-types/password-cell-type/password-cell-type.md)         | Renderer: `PasswordRenderer`<br>Editor: `PasswordEditor`<br>Validator: -                                                                                                                               |
| `'text'`                                                          | Renderer: `TextRenderer`<br>Editor: `TextEditor`<br>Validator: -                                                                                                                                       |
| [`'time`'](@/guides/cell-types/time-cell-type/time-cell-type.md)                 | Renderer: `TimeRenderer`<br>Editor: `TimeEditor`<br>Validator: `TimeValidator`                                                                                                 |
| [`'intl-time'`](@/guides/cell-types/time-cell-type/time-cell-type.md)                 | Renderer: `IntlTimeRenderer`<br>Editor: `IntlTimeEditor`<br>Validator: `IntlTimeValidator`                                                                                                 |
| [`'intl-datetime'`](@/guides/cell-types/datetime-cell-type/datetime-cell-type.md)                 | Renderer: `IntlDatetimeRenderer`<br>Editor: `IntlDatetimeEditor`<br>Validator: `IntlDatetimeValidator`                                                                                                 |

Read more:
- [Cell type](@/guides/cell-types/cell-type/cell-type.md)
- [Cell renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md)
- [Cell editor](@/guides/cell-functions/cell-editor/cell-editor.md)
- [Cell validator](@/guides/cell-functions/cell-validator/cell-validator.md)
- [Configuration options: Cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration)
- [`renderer`](@/api/options.md#renderer)
- [`editor`](@/api/options.md#editor)
- [`validator`](@/api/options.md#validator)
- [`valueParser`](@/api/options.md#valueparser)
- [`valueFormatter`](@/api/options.md#valueformatter)

**Default**: <code>"text"</code>  
**Example**  
```js
// set the `numeric` cell type for each cell of the entire grid
type: `'numeric'`,

// apply the `type` option to individual columns
columns: [
  {
    // set the `autocomplete` cell type for each cell of this column
    type: 'autocomplete'
  },
  {
    // set the `myCustomCellType` cell type for each cell of this column
    type: 'myCustomCellType'
  }
]
```


### uncheckedTemplate

::: ask-about-api uncheckedTemplate|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6469

:::

_core.uncheckedTemplate : boolean | string | number_

The `uncheckedTemplate` option lets you configure what value
an unchecked [`checkbox`](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md) cell has.

You can set the `uncheckedTemplate` option to one of the following:

| Setting           | Description                                                                                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `false` (default) | If a [`checkbox`](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md) cell is unchecked,<br>the `getDataAtCell` method for this cell returns `false`                 |
| A string          | If a [`checkbox`](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md) cell is unchecked,<br>the `getDataAtCell` method for this cell returns a string of your choice |

::: warning
When you set `uncheckedTemplate` to a custom string value (e.g. `'No'`), using `false` in your data source to
represent an unchecked state is no longer valid. Only the exact custom string value matches an unchecked checkbox.
Pair `uncheckedTemplate` with [`checkedTemplate`](@/api/options.md#checkedtemplate) to define both states explicitly.
:::

This option can be set at any level of the [cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration):
the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options), the [`columns`](@/api/options.md#columns) level, the [`cells`](@/api/options.md#cells) level, and the [`cell`](@/api/options.md#cell) level.

Read more:
- [Checkbox cell type: Checkbox template](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md#checkbox-template)
- [`checkedTemplate`](@/api/options.md#checkedtemplate)

**Default**: <code>false</code>  
**Example**  
```js
columns: [
  {
    // set the `type` of each cell in this column to `checkbox`
    // when unchecked, the cell's value is `false`
    // when checked, the cell's value is `true`
    type: 'checkbox',
  },
  {
    // set the `type` of each cell in this column to `checkbox`
    // when unchecked, the cell's value is `'No'`
    // when checked, the cell's value is `'Yes'`
    type: 'checkbox',
    uncheckedTemplate: 'No'
    checkedTemplate: 'Yes',
 }
],
```


### validator

::: ask-about-api validator|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6563

:::

_core.validator : function | RegExp | string_

The `validator` option sets a [cell validator](@/guides/cell-functions/cell-validator/cell-validator.md) for a cell.

You can set the `validator` option to one of the following:

| Setting              | Description                                                                      |
| -------------------- | -------------------------------------------------------------------------------- |
| A string             | A [cell validator alias](@/guides/cell-functions/cell-validator/cell-validator.md)              |
| A function           | Your [custom cell validator function](@/guides/cell-functions/cell-validator/cell-validator.md) |
| A regular expression | A regular expression used for cell validation                                    |

This option can be set at any level of the [cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration):
the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options), the [`columns`](@/api/options.md#columns) level, the [`cells`](@/api/options.md#cells) level, and the [`cell`](@/api/options.md#cell) level.

By setting the `validator` option to a string,
you can use one of the following [cell validator aliases](@/guides/cell-functions/cell-validator/cell-validator.md):

| Alias               | Cell validator function                                                 |
| ------------------- | ----------------------------------------------------------------------- |
| A custom alias      | Your [custom cell validator](@/guides/cell-functions/cell-validator/cell-validator.md) |
| `'autocomplete'`    | `AutocompleteValidator`                                                 |
| `'date'`            | `DateValidator`                                                         |
| `'intl-date'`       | `IntlDateValidator`                                                     |
| `'dropdown'`        | `DropdownValidator`                                                     |
| `'numeric'`         | `NumericValidator`                                                      |
| `'time'`            | `TimeValidator`                                                         |
| `'intl-time'`       | `IntlTimeValidator`                                                     |

To set the [`editor`](@/api/options.md#editor), [`renderer`](@/api/options.md#renderer), and [`validator`](@/api/options.md#validator)
options all at once, use the [`type`](@/api/options.md#type) option.

Read more:
- [Cell validator](@/guides/cell-functions/cell-validator/cell-validator.md)
- [Cell type](@/guides/cell-types/cell-type/cell-type.md)
- [Configuration options: Cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration)
- [`type`](@/api/options.md#type)

**Default**: <code>undefined</code>  
**Example**  
```js
columns: [
   {
     // use a built-in `numeric` cell validator
     validator: 'numeric'
   },
   {
     // validate against a regular expression
     validator: /^[0-9]$/
   },
   {
     // add a custom cell validator function
     validator(value, callback) {
       callback(value >= 0 && value <= 100);
     }
   },
],
```


### valueFormatter

::: ask-about-api valueFormatter|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5151

:::

_core.valueFormatter : function_

The `valueFormatter` option sets a custom function for formatting cell values before display.

Unlike the [`renderer`](@/api/options.md#renderer) option, which is responsible for the complete cell rendering process
(DOM structure, performance-optimized content insertion via `innerText`/`innerHTML`, a11y attributes, applying
styles from `className`, `readOnlyCellClassName`, `textEllipsis`, and other options), the `valueFormatter`
focuses solely on transforming the cell's value.

The `valueFormatter` function is called by the rendering engine right before the actual renderer function is
called. Separating the value formatting from the renderer logic allows for more flexibility and reuse.
This simplifies common formatting use cases where you only need to transform
the displayed value (e.g., adding units, formatting dates, or applying custom text transformations).

**When to use `valueFormatter` vs `renderer`:**

| Use case                                          | Recommended option   |
| ------------------------------------------------- | -------------------- |
| Transform displayed value (add prefix, units)     | `valueFormatter`     |
| Custom date/number/text formatting                | `valueFormatter`     |
| Modify DOM structure (add icons, custom elements) | `renderer`           |

The function receives the raw value and cell properties, and should return the formatted value
to be displayed. The formatting can be applied to a single cell, column, or the entire grid.

**Function signature:**
```js
valueFormatter(value, cellProperties) => formattedValue
```

| Parameter        | Type       | Description                                    |
| ---------------- | ---------- | ---------------------------------------------- |
| `value`          | `*`        | The raw cell value                             |
| `cellProperties` | `object`   | The cell's meta object (see [Core#getCellMeta](@/api/core.md#getcellmeta)) |
| Returns          | `*`        | The formatted value to display                 |

Read more:
- [Cell renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md)
- [Configuration options: Cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration)

**Default**: <code>undefined</code>  
**Since**: 17.0.0  
**Example**  
```js
// add a currency symbol to numeric values
valueFormatter(value, cellProperties) {
  if (value === null || value === undefined) {
    return '';
  }

  return `$${value}`;
}

// format dates in a custom format
valueFormatter(value, cellProperties) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// apply valueFormatter to individual columns
columns: [
  {
    // add "kg" suffix to weight values
    valueFormatter(value) {
      return value ? `${value} kg` : '';
    }
  },
  {
    // format percentages
    valueFormatter(value) {
      return value !== null ? `${(value * 100).toFixed(1)}%` : '';
    }
  }
]
```


### valueGetter

::: ask-about-api valueGetter|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6650

:::

_core.valueGetter : function_

The `valueGetter` option configures a function that defines what value will be used when displaying the cell content.
It can be used to modify the value of a cell before it is displayed (for example, for object-based data).

**Default**: <code>undefined</code>  
**Since**: 16.1.0  
**Example**  
```js
// use the `label` property of the value object with a fallback to the value itself
valueGetter: (value, row, column, cellMeta) => {
  return value?.label ?? value;
}
```

| Param | Type | Description |
| --- | --- | --- |
| value | `*` | The value to be displayed in the cell. |
| row | `number` | The visual row index of the cell. |
| column | `number` | The visual column index of the cell. |
| cellMeta | `object` | The cell meta object. |



### valueParser

::: ask-about-api valueParser|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5223

:::

_core.valueParser : function_

The `valueParser` option sets a custom function for converting editor output into the source data format.

Unlike [`valueFormatter`](@/api/options.md#valueformatter), which formats values for display, `valueParser` runs only when a
value comes from the [cell editor](@/guides/cell-functions/cell-editor/cell-editor.md) - after the user finishes
editing. It maps whatever the editor returns (e.g. a localized date string, a formatted number) into the
canonical shape stored in the data source (e.g. ISO date string, raw number).

**When to use `valueParser` vs `valueFormatter`:**

| Use case                               | Option           |
| -------------------------------------- | ---------------- |
| Display: raw value -> shown text       | `valueFormatter` |
| Edit: editor value -> source data      | `valueParser`    |

**Function signature:**
```js
valueParser(value, cellProperties) => sourceValue
```

| Parameter        | Type     | Description                                    |
| ---------------- | -------- | ---------------------------------------------- |
| `value`          | `*`      | The value produced by the editor               |
| `cellProperties` | `object` | The cell's meta object (see [Core#getCellMeta](@/api/core.md#getcellmeta)) |
| Returns          | `*`      | The value to store in the source data          |

Read more:
- [Cell editor](@/guides/cell-functions/cell-editor/cell-editor.md)
- [`editor`](@/api/options.md#editor)
- [`renderer`](@/api/options.md#renderer)
- [`valueFormatter`](@/api/options.md#valueformatter)
- [`sourceDataValidator`](@/api/options.md#sourcedatavalidator)
- [Configuration options: Cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration)

**Default**: <code>undefined</code>  
**Since**: 17.0.0  
**Example**  
```js
// parse editor string to ISO date (e.g. intl-date: display format => source format)
valueParser(value, cellProperties) {
  if (value == null || value === '') {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? value : date.toISOString().slice(0, 10);
}

// parse formatted number string to number
valueParser(value, cellProperties) {
  if (value == null || value === '') {
    return null;
  }

  const num = Number(value.replace(/[^\d.-]/g, ''));

  return Number.isNaN(num) ? value : num;
}

// apply valueParser per column
columns: [
  { data: 'date', valueParser: (value) => value ? new Date(value).toISOString().slice(0, 10) : null },
  { data: 'amount', valueParser: (value) => value != null ? Number(value) : null }
]
```


### valueSetter

::: ask-about-api valueSetter|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6673

:::

_core.valueSetter : function_

The `valueSetter` option configures a function that defines what value will be used when setting the cell content.
It can be used to modify the value of a cell before it is saved (for example, for object-based data).

**Default**: <code>undefined</code>  
**Since**: 16.1.0  
**Example**  
```js
// Modify the value of a cell before it is saved
valueSetter: (value, row, column, cellMeta) => {
  return { id: value?.id ?? value, value: `${value?.value ?? value} at ${row}, ${column}` }
},
```

| Param | Type | Description |
| --- | --- | --- |
| value | `*` | The value to be set to a cell. |
| row | `number` | The visual row index of the cell. |
| column | `number` | The visual column index of the cell. |
| cellMeta | `object` | The cell meta object. |



### viewportColumnRenderingOffset

::: ask-about-api viewportColumnRenderingOffset|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6719

:::

_core.viewportColumnRenderingOffset : number | 'auto'_

The `viewportColumnRenderingOffset` option configures the number of columns
to be rendered outside of the grid's viewport.

You can set the `viewportColumnRenderingOffset` option to one of the following:

| Setting            | Description                                             |
| ------------------ | ------------------------------------------------------- |
| `auto` (default)   | Use the offset calculated automatically by Handsontable |
| A number           | Set the offset manually                                 |

With `auto`, the option works in a dynamic overscan mode: Handsontable renders 1 extra
column on each side of the viewport and, while you scroll horizontally, extends the
rendered area by up to 8 extra columns in the scroll direction, so consecutive scroll
steps reuse the already-rendered columns instead of re-rendering them.

The scroll-direction overscan works only when Handsontable knows every column's width up
front and all columns share the same width: set [`colWidths`](@/api/options.md#colwidths) to a single
number. Features that measure or change individual column widths turn the overscan off for
the column axis – for example, [`autoColumnSize`](@/api/options.md#autocolumnsize) (enabled by default),
[`manualColumnResize`](@/api/options.md#manualcolumnresize), or [`hiddenColumns`](@/api/options.md#hiddencolumns). The grid
then keeps the static offset of 1 column on each side.

An explicit number switches the option to a manual mode: exactly that many extra columns
render on both sides, with no scroll-direction overscan.

The `viewportColumnRenderingOffset` setting is ignored when [`renderAllColumns`](@/api/options.md#renderallcolumns) is set to `true`.

Read more:
- [Performance: Define the number of pre-rendered rows and columns](@/guides/optimization/performance/performance.md#define-the-number-of-pre-rendered-rows-and-columns)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>&#x27;auto&#x27;</code>  
**Example**  
```js
// render 70 columns outside of the grid's viewport
viewportColumnRenderingOffset: 70,
```


### viewportColumnRenderingThreshold

::: ask-about-api viewportColumnRenderingThreshold|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6801

:::

_core.viewportColumnRenderingThreshold : number | 'auto'_

The `viewportColumnRenderingThreshold` option configures what column number starting from the left or right
(depends on the scroll direction) should trigger the rendering of columns outside of the grid's viewport.

You can set the `viewportColumnRenderingThreshold` option to one of the following:

| Setting            | Description                                             |
| ------------------ | ------------------------------------------------------- |
| `auto`             | Triggers rendering at half the offset defined by [`viewportColumnRenderingOffset`](@/api/options.md#viewportcolumnrenderingoffset) option |
| A number           | Sets the offset manually (`0` is a default)             |

The `viewportColumnRenderingThreshold` setting is ignored when [`renderAllColumn`](@/api/options.md#renderallcolumn) is set to `true`.

Read more:
- [Performance: Define the number of pre-rendered rows and columns](@/guides/optimization/performance/performance.md#define-the-number-of-pre-rendered-rows-and-columns)
- [Column virtualization](@/guides/columns/column-virtualization/column-virtualization.md)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>0</code>  
**Since**: 1.14.7  
**Example**  
```js
// render 12 columns outside of the grid's viewport
viewportColumnRenderingOffset: 12,
// the columns outside of the viewport will be rendered when the user scrolls to the 8th column from/to
viewportColumnRenderingThreshold: 8,
```


### viewportRowRenderingOffset

::: ask-about-api viewportRowRenderingOffset|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6766

:::

_core.viewportRowRenderingOffset : number | 'auto'_

The `viewportRowRenderingOffset` option configures the number of rows
to be rendered outside of the grid's viewport.

You can set the `viewportRowRenderingOffset` option to one of the following:

| Setting            | Description                                             |
| ------------------ | ------------------------------------------------------- |
| `auto` (default)   | Use the offset calculated automatically by Handsontable |
| A number           | Set the offset manually                                 |

With `auto`, the option works in a dynamic overscan mode: Handsontable renders 1 extra row
on each side of the viewport and, while you scroll vertically, extends the rendered area by
up to 4 extra rows in the scroll direction, so consecutive scroll steps reuse the
already-rendered rows instead of re-rendering them.

The scroll-direction overscan works only when Handsontable knows every row's height up
front and all rows share the same height: keep the default [`rowHeights`](@/api/options.md#rowheights) or
set it to a single number. Features that measure or change individual row heights turn the
overscan off for the row axis – for example, [`autoRowSize`](@/api/options.md#autorowsize),
[`manualRowResize`](@/api/options.md#manualrowresize), or [`hiddenRows`](@/api/options.md#hiddenrows). The grid then keeps
the static offset of 1 row on each side.

An explicit number switches the option to a manual mode: exactly that many extra rows
render on both sides, with no scroll-direction overscan.

The `viewportRowRenderingOffset` setting is ignored when [`renderAllRows`](@/api/options.md#renderallrows) is set to `true`.

Read more:
- [Performance: Define the number of pre-rendered rows and columns](@/guides/optimization/performance/performance.md#define-the-number-of-pre-rendered-rows-and-columns)
- [Column virtualization](@/guides/columns/column-virtualization/column-virtualization.md)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>&#x27;auto&#x27;</code>  
**Example**  
```js
// render 70 rows outside of the grid's viewport
viewportRowRenderingOffset: 70,
```


### viewportRowRenderingThreshold

::: ask-about-api viewportRowRenderingThreshold|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6836

:::

_core.viewportRowRenderingThreshold : number | 'auto'_

The `viewportRowRenderingThreshold` option configures what row number starting from the top or bottom
(depends on the scroll direction) should trigger the rendering of rows outside of the grid's viewport.

You can set the `viewportRowRenderingThreshold` option to one of the following:

| Setting            | Description                                             |
| ------------------ | ------------------------------------------------------- |
| `auto`             | Triggers rendering at half the offset defined by [`viewportRowRenderingOffset`](@/api/options.md#viewportrowrenderingoffset) option |
| A number           | Sets the offset manually (`0` is a default)             |

The `viewportRowRenderingThreshold` setting is ignored when [`renderAllRows`](@/api/options.md#renderallrows) is set to `true`.

Read more:
- [Performance: Define the number of pre-rendered rows and columns](@/guides/optimization/performance/performance.md#define-the-number-of-pre-rendered-rows-and-columns)
- [Row virtualization](@/guides/rows/row-virtualization/row-virtualization.md)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>0</code>  
**Since**: 1.14.7  
**Example**  
```js
// render 12 rows outside of the grid's viewport
viewportRowRenderingOffset: 12,
// the rows outside of the viewport will be rendered when the user scrolls to the 8th row from/to
viewportRowRenderingThreshold: 8,
```


### visibleRows

::: ask-about-api visibleRows|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6884

:::

_core.visibleRows : number_

The `visibleRows` option sets the height of the [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
, [`dropdown`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md) and [`multiSelect`](@/guides/cell-types/multiselect-cell-type/multiselect-cell-type.md)-typed cells' lists.

When the number of list options exceeds the `visibleRows` number, a scrollbar appears.

::: tip
If the grid has a fixed [`height`](@/api/options.md#height) set, the dropdown list may be visually constrained by the available
space and show fewer rows than the `visibleRows` value. In such cases, the list is clipped to fit within the grid.
:::

This option can be set at any level of the [cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration):
the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options), the [`columns`](@/api/options.md#columns) level, the [`cells`](@/api/options.md#cells) level, and the [`cell`](@/api/options.md#cell) level.

Read more:
- [Autocomplete cell type](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
- [Dropdown cell type](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md)
- [MultiSelect cell type](@/guides/cell-types/multiselect-cell-type/multiselect-cell-type.md)

**Default**: <code>10</code>  
**Example**  
```js
columns: [
  {
    type: 'autocomplete',
    // set the `autocomplete` list's height to 15 options
    // for each cell of this column
    visibleRows: 15,
  },
  {
    type: 'dropdown',
    // set the `dropdown` list's height to 5 options
    // for each cell of this column
    visibleRows: 5,
  },
  {
    type: 'multiselect',
    // set the `multiSelect` list's height to 5 options
    // for each cell of this column
    visibleRows: 5,
  }
],
```


### width

::: ask-about-api width|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6932

:::

_core.width : number | 'auto' | string | function_

The `width` option configures the width of your grid.

You can set the `width` option to one of the following:

| Setting                                                                    | Example                   |
| -------------------------------------------------------------------------- | ------------------------- |
| A number of pixels                                                         | `width: 500`              |
| A string with a [CSS unit](https://www.w3schools.com/cssref/css_units.asp) | `width: '75vw'`           |
| `'auto'`                                                                   | `width: 'auto'`           |
| A function that returns a valid number or string                           | `width() { return 500; }` |

With `width: 'auto'`, Handsontable writes `width: auto` as an inline style on the root
element. The grid then follows the width of its parent container. Use this value when
you want the grid to stay flexible horizontally while still setting an explicit
[`height`](@/api/options.md#height).

::: tip
For horizontal scrolling to work, you must also set the [`height`](@/api/options.md#height) option in Handsontable's configuration.
Setting `width` alone (without `height`) does not activate the scrollable viewport.
Setting the height via inline CSS on the container element is not supported - use the `height` configuration option instead.
:::

Read more:
- [Grid size](@/guides/getting-started/grid-size/grid-size.md)

**Default**: <code>undefined</code>  
**Example**  
```js
// set the grid's width to 500px
width: 500,

// set the grid's width to 75vw
width: '75vw',

// let the grid follow its parent container's width
width: 'auto',

// set the grid's width to 500px, using a function
width() {
  return 500;
},
```


### wordWrap

::: ask-about-api wordWrap|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6978

:::

_core.wordWrap : boolean_

The `wordWrap` option configures whether content that exceeds a column's width is wrapped or not.

You can set the `wordWrap` option to one of the following:

| Setting          | Description                                             |
| ---------------- | ------------------------------------------------------- |
| `true` (default) | If content exceeds the column's width, wrap the content |
| `false`          | Don't wrap content                                      |

To style cells that don't wrap content, use the [`noWordWrapClassName`](@/api/options.md#nowordwrapclassname) option.

::: tip
Word wrapping only applies to content that contains spaces or other soft-wrap opportunities.
A long unbroken string without spaces (e.g. a URL or a continuous number sequence) does not wrap
regardless of this setting.
:::

This option can be set at any level of the [cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration):
the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options), the [`columns`](@/api/options.md#columns) level, the [`cells`](@/api/options.md#cells) level, and the [`cell`](@/api/options.md#cell) level.

Read more:
- [`noWordWrapClassName`](@/api/options.md#nowordwrapclassname)

**Default**: <code>true</code>  
**Example**  
```js
// set column width for every column of the entire grid
colWidths: 100,

columns: [
  {
    // don't wrap content in this column
    wordWrap: false,
  },
  {
    // if content exceeds this column's width, wrap the content
    wordWrap: true,
  }
],
```

## Members

### columnIndexMapper

::: ask-about-api columnIndexMapper|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L482

:::

_core.columnIndexMapper : [IndexMapper](@/api/indexMapper.md)_

Instance of index mapper which is responsible for managing the column indexes.



### columnsSettingIndexes

::: ask-about-api columnsSettingIndexes|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L4019

:::

_Core~columnsSettingIndexes_

Caches the index translation that `getColHeader` derives from the `columns` option when that
option is a function: the source column indexes for which `columns(index)` returns a truthy
settings object. Only the membership array is cached — titles are still read live from the
`columns` function. Rebuilt when the function reference or the column count changes; cleared
by `updateSettings`.



### isDestroyed

::: ask-about-api isDestroyed|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L373

:::

_core.isDestroyed : boolean_

A boolean to tell if the Handsontable has been fully destroyed. This is set to `true`
after `afterDestroy` hook is called.



### rowIndexMapper

::: ask-about-api rowIndexMapper|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L489

:::

_core.rowIndexMapper : [IndexMapper](@/api/indexMapper.md)_

Instance of index mapper which is responsible for managing the row indexes.


## Methods

### isEmptyCol

::: ask-about-api isEmptyCol|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3439

:::

_core.isEmptyCol(col) ⇒ boolean_

The `isEmptyCol` option lets you define your own custom method
for checking if a column at a given visual index is empty.

The `isEmptyCol` setting overwrites the built-in `isEmptyCol` method.
The function receives a visual column index and must return a `boolean`.

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Example**  
```js
// overwrite the built-in `isEmptyCol` method
isEmptyCol(visualColumnIndex) {
   // your custom method
   ...
},
```

| Param | Type | Description |
| --- | --- | --- |
| col | `number` | Visual column index. |



### isEmptyRow

::: ask-about-api isEmptyRow|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3487

:::

_core.isEmptyRow(row) ⇒ boolean_

The `isEmptyRow` option lets you define your own custom method
for checking if a row at a given visual index is empty.

The `isEmptyRow` setting overwrites the built-in `isEmptyRow` method.
The function receives a visual row index and must return a `boolean`.

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Example**  
```js
// overwrite the built-in `isEmptyRow` method
isEmptyRow(visualRowIndex) {
   // your custom method
   ...
},
```

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |



### addHook

::: ask-about-api addHook|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L5070

:::

_core.addHook(key, callback, [orderIndex])_

Adds listener to the specified hook name (only for this Handsontable instance).

**See**: [Hooks#add](@/api/hooks.md#add)  
**Example**  
```js
hot.addHook('beforeInit', myCallback);
```

| Param | Type | Description |
| --- | --- | --- |
| key | `string` | Hook name (see [Hooks](@/api/hooks.md)). |
| callback | `function` <br/> `Array` | Function or array of functions. |
| [orderIndex] | `number` | `optional` Order index of the callback.                              If > 0, the callback will be added after the others, for example, with an index of 1, the callback will be added before the ones with an index of 2, 3, etc., but after the ones with an index of 0 and lower.                              If < 0, the callback will be added before the others, for example, with an index of -1, the callback will be added after the ones with an index of -2, -3, etc., but before the ones with an index of 0 and higher.                              If 0 or no order index is provided, the callback will be added between the "negative" and "positive" indexes. |



### addHookOnce

::: ask-about-api addHookOnce|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L5106

:::

_core.addHookOnce(key, callback, [orderIndex])_

Adds listener to specified hook name (only for this Handsontable instance). After the listener is triggered,
it will be automatically removed.

**See**: [Hooks#once](@/api/hooks.md#once)  
**Example**  
```js
hot.addHookOnce('beforeInit', myCallback);
```

| Param | Type | Description |
| --- | --- | --- |
| key | `string` | Hook name (see [Hooks](@/api/hooks.md)). |
| callback | `function` <br/> `Array` | Function or array of functions. |
| [orderIndex] | `number` | `optional` Order index of the callback.                              If > 0, the callback will be added after the others, for example, with an index of 1, the callback will be added before the ones with an index of 2, 3, etc., but after the ones with an index of 0 and lower.                              If < 0, the callback will be added before the others, for example, with an index of -1, the callback will be added after the ones with an index of -2, -3, etc., but before the ones with an index of 0 and higher.                              If 0 or no order index is provided, the callback will be added between the "negative" and "positive" indexes. |



### alter

::: ask-about-api alter|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3009

:::

_core.alter(action, [index], [amount], [source], [keepEmptyRows])_

The `alter()` method lets you alter the grid's structure
by adding or removing rows and columns at specified positions.

::: tip
If you use an array of objects in your [`data`](@/api/options.md#data), the column-related actions won't work.
:::

```js
// above row 10 (by visual index), insert 1 new row
hot.alter('insert_row_above', 10);
```

 | Action               | With `index` | Without `index` |
 | -------------------- | ------------ | --------------- |
 | `'insert_row_above'` | Inserts rows above the `index` row. | Inserts rows above the first row. |
 | `'insert_row_below'` | Inserts rows below the `index` row. | Inserts rows below the last row. |
 | `'remove_row'`       | Removes rows, starting from the `index` row. | Removes rows, starting from the last row. |
 | `'insert_col_start'` | Inserts columns before the `index` column. | Inserts columns before the first column. |
 | `'insert_col_end'`   | Inserts columns after the `index` column. | Inserts columns after the last column. |
 | `'remove_col'`       | Removes columns, starting from the `index` column. | Removes columns, starting from the last column. |

Additional information about `'insert_col_start'` and `'insert_col_end'`:
- Their behavior depends on your [`layoutDirection`](@/api/options.md#layoutdirection).
- If the provided `index` is higher than the actual number of columns, Handsontable doesn't generate
the columns missing in between. Instead, the new columns are inserted next to the last column.

**Example**  
```js
// above row 10 (by visual index), insert 1 new row
hot.alter('insert_row_above', 10);

// below row 10 (by visual index), insert 3 new rows
hot.alter('insert_row_below', 10, 3);

// in the LTR layout direction: to the left of column 10 (by visual index), insert 3 new columns
// in the RTL layout direction: to the right of column 10 (by visual index), insert 3 new columns
hot.alter('insert_col_start', 10, 3);

// in the LTR layout direction: to the right of column 10 (by visual index), insert 1 new column
// in the RTL layout direction: to the left of column 10 (by visual index), insert 1 new column
hot.alter('insert_col_end', 10);

// remove 2 rows, starting from row 10 (by visual index)
hot.alter('remove_row', 10, 2);

// remove 2 columns, starting from column 3 (by visual index)
hot.alter('remove_col', 3, 2);

// remove 3 rows, starting from row 1 (by visual index)
// remove 2 rows, starting from row 5 (by visual index)
hot.alter('remove_row', [[1, 3], [5, 2]]);

// pass a custom source string to hooks
hot.addHook('afterCreateRow', (index, amount, source) => {
  if (source === 'inventory-import') {
    // Run logic only for rows created by the inventory import.
  }
});
hot.alter('insert_row_above', 0, 1, 'inventory-import');

// remove a row without immediately adding empty rows required by `minRows` or `minSpareRows`
hot.alter('remove_row', 4, 1, 'inventory-cleanup', true);
```

| Param | Type | Description |
| --- | --- | --- |
| action | `string` | Available operations: <ul>    <li> `'insert_row_above'` </li>    <li> `'insert_row_below'` </li>    <li> `'remove_row'` </li> </li>    <li> `'insert_col_start'` </li>    <li> `'insert_col_end'` </li>    <li> `'remove_col'` </li> </ul> |
| [index] | `number` <br/> `Array<number>` | `optional` A visual index of the row/column before or after which the new row/column will be                                inserted or removed. Can also be an array of arrays, in format `[[index, amount],...]`. |
| [amount] | `number` | `optional` The amount of rows or columns to be inserted or removed (default: `1`). |
| [source] | `string` | `optional` Source indicator passed to related hooks. |
| [keepEmptyRows] | `boolean` | `optional` If set to `true`, skips the automatic adjustment that normally adds empty rows                                  or columns after the operation to satisfy `minRows`, `minSpareRows`,                                  `minCols`, or `minSpareCols`. |



### applyThemeOverrides

::: ask-about-api applyThemeOverrides|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L1349

:::

_Core~applyThemeOverrides(settings, init) ⇒ boolean_

Applies the `colorScheme` and `density` options to the ThemeManager of this instance.

The options are per-instance overrides, so the shared theme object stays untouched and other
grids using the same theme keep their own look.


| Param | Type | Description |
| --- | --- | --- |
| settings | `object` | The settings object that may carry the overrides. |
| init | `boolean` | `true` when called during initialization. The initial styles are injected by the ThemeManager constructor, so nothing has to be refreshed in that case. |


**Returns**: `boolean` - `true` when the overrides changed and `afterSetTheme` still has to run.  

### batch

::: ask-about-api batch|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L2332

:::

_core.batch(wrappedOperations) ⇒ \*_

It batches the rendering process and index recalculations. The method aggregates
multi-line API calls into a callback and postpones the table rendering process
as well aggregates the table logic changes such as index changes into one call
after which the cache is updated. After the execution of the operations, the
table is rendered, and the cache is updated once. As a result, it improves the
performance of wrapped operations.

**Since**: 8.3.0  
**Example**  
```js
hot.batch(() => {
  hot.alter('insert_row_above', 5, 45);
  hot.alter('insert_col_start', 10, 40);
  hot.setDataAtCell(1, 1, 'x');
  hot.setDataAtCell(2, 2, 'c');
  hot.setDataAtCell(3, 3, 'v');
  hot.setDataAtCell(4, 4, 'b');
  hot.setDataAtCell(5, 5, 'n');
  hot.selectCell(0, 0);

  const filters = hot.getPlugin('filters');

  filters.addCondition(2, 'contains', ['3']);
  filters.filter();
  hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
  // The table will be re-rendered and cache will be recalculated once after executing the callback
});
```

| Param | Type | Description |
| --- | --- | --- |
| wrappedOperations | `function` | Batched operations wrapped in a function. |


**Returns**: `*` - Returns result from the wrappedOperations callback.  

### batchExecution

::: ask-about-api batchExecution|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L2301

:::

_core.batchExecution(wrappedOperations, [forceFlushChanges]) ⇒ \*_

The method aggregates multi-line API calls into a callback and postpones the
table execution process. After the execution of the operations, the internal table
cache is recalculated once. As a result, it improves the performance of wrapped
operations. Without batching, a similar case could trigger multiple table cache rebuilds.

**Since**: 8.3.0  
**Example**  
```js
hot.batchExecution(() => {
  const filters = hot.getPlugin('filters');

  filters.addCondition(2, 'contains', ['3']);
  filters.filter();
  hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
  // The table cache will be recalculated once after executing the callback
});
```

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| wrappedOperations | `function` |  | Batched operations wrapped in a function. |
| [forceFlushChanges] | `boolean` | <code>false</code> | `optional` If `true`, the table internal data cache is recalculated after the execution of the batched operations. For nested calls, it can be a desire to recalculate the table after each batch. |


**Returns**: `*` - Returns result from the wrappedOperations callback.  

### batchRender

::: ask-about-api batchRender|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L2200

:::

_core.batchRender(wrappedOperations) ⇒ \*_

The method aggregates multi-line API calls into a callback and postpones the
table rendering process. After the execution of the operations, the table is
rendered once. As a result, it improves the performance of wrapped operations.
Without batching, a similar case could trigger multiple table render calls.

**Since**: 8.3.0  
**Example**  
```js
hot.batchRender(() => {
  hot.alter('insert_row_above', 5, 45);
  hot.alter('insert_col_start', 10, 40);
  hot.setDataAtCell(1, 1, 'John');
  hot.setDataAtCell(2, 2, 'Mark');
  hot.setDataAtCell(3, 3, 'Ann');
  hot.setDataAtCell(4, 4, 'Sophia');
  hot.setDataAtCell(5, 5, 'Mia');
  hot.selectCell(0, 0);
  // The table will be rendered once after executing the callback
});
```

| Param | Type | Description |
| --- | --- | --- |
| wrappedOperations | `function` | Batched operations wrapped in a function. |


**Returns**: `*` - Returns result from the wrappedOperations callback.  

### clear

::: ask-about-api clear|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L2999

:::

_core.clear()_

Clears the data from the table (the table settings remain intact) and clears the current selection.



### colToProp

::: ask-about-api colToProp|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3153

:::

_core.colToProp(column) ⇒ string | number_

Returns the property name that corresponds with the given column index.
If the data source is an array of arrays, it returns the columns index.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |


**Returns**: `string` | `number` - Column property or physical column index.  

### countColHeaders

::: ask-about-api countColHeaders|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L4312

:::

_core.countColHeaders() ⇒ number_

Returns the number of rendered column headers.

**Since**: 14.0.0  

**Returns**: `number` - Number of column headers.  

### countCols

::: ask-about-api countCols|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L4246

:::

_core.countCols() ⇒ number_

Returns the total number of rendered columns. If the columns option is defined, it returns the number of columns set in that configuration, not the number of columns in the data source.


**Returns**: `number` - Total number of columns.  

### countEmptyCols

::: ask-about-api countEmptyCols|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L4342

:::

_core.countEmptyCols([ending]) ⇒ number_

Returns the number of empty columns. If the optional ending parameter is `true`, returns the number of empty
columns at right hand edge of the table.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [ending] | `boolean` | <code>false</code> | `optional` If `true`, will only count empty columns at the end of the data source row. |


**Returns**: `number` - Count empty cols.  

### countEmptyRows

::: ask-about-api countEmptyRows|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L4323

:::

_core.countEmptyRows([ending]) ⇒ number_

Returns the number of empty rows. If the optional ending parameter is `true`, returns the
number of empty rows at the bottom of the table.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [ending] | `boolean` | <code>false</code> | `optional` If `true`, will only count empty rows at the end of the data source. |


**Returns**: `number` - Count empty rows.  

### countRenderedCols

::: ask-about-api countRenderedCols|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L4279

:::

_core.countRenderedCols() ⇒ number_

Returns the number of rendered rows including columns that are partially or fully rendered
outside the table viewport.


**Returns**: `number` - Returns -1 if table is not visible.  

### countRenderedRows

::: ask-about-api countRenderedRows|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L4257

:::

_core.countRenderedRows() ⇒ number_

Returns the number of rendered rows including rows that are partially or fully rendered
outside the table viewport.


**Returns**: `number` - Returns -1 if table is not visible.  

### countRowHeaders

::: ask-about-api countRowHeaders|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L4301

:::

_core.countRowHeaders() ⇒ number_

Returns the number of rendered row headers.

**Since**: 14.0.0  

**Returns**: `number` - Number of row headers.  

### countRows

::: ask-about-api countRows|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L4237

:::

_core.countRows() ⇒ number_

Returns the total number of visual rows in the table.


**Returns**: `number` - Total number of rows.  

### countSourceCols

::: ask-about-api countSourceCols|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L4228

:::

_core.countSourceCols() ⇒ number_

Returns the total number of columns in the data source. It will take value either from schema, columns settings or the first row from the data set. Unlike [countCols()](@/api/core.md#countcols), this value is not affected by the columns configuration option.


**Returns**: `number` - Total number of columns.  

### countSourceRows

::: ask-about-api countSourceRows|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L4219

:::

_core.countSourceRows() ⇒ number_

Returns the total number of rows in the data source.


**Returns**: `number` - Total number of rows.  

### countVisibleCols

::: ask-about-api countVisibleCols|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L4290

:::

_core.countVisibleCols() ⇒ number_

Returns the number of rendered columns that are only visible in the table viewport.
The columns that are partially visible are not counted.


**Returns**: `number` - Number of visible columns or -1.  

### countVisibleRows

::: ask-about-api countVisibleRows|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L4268

:::

_core.countVisibleRows() ⇒ number_

Returns the number of rendered rows that are only visible in the table viewport.
The rows that are partially visible are not counted.


**Returns**: `number` - Number of visible rows or -1.  

### deselectCell

::: ask-about-api deselectCell|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L4589

:::

_core.deselectCell()_

Deselects the current cell selection on the table.



### destroy

::: ask-about-api destroy|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L4792

:::

_core.destroy()_

Removes the table from the DOM and destroys the instance of the Handsontable.

**Emits**: [`Hooks#event:afterDestroy`](@/api/hooks.md#afterdestroy)  


### destroyEditor

::: ask-about-api destroyEditor|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L1878

:::

_core.destroyEditor([revertOriginal], [prepareEditorIfNeeded])_

Destroys the current editor, render the table and prepares the editor of the newly selected cell.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [revertOriginal] | `boolean` | <code>false</code> | `optional` If `true`, the previous value will be restored. Otherwise, the edited value will be saved. |
| [prepareEditorIfNeeded] | `boolean` | <code>true</code> | `optional` If `true`, the editor under the selected cell will be prepared to open. |



### emptySelectedCells

::: ask-about-api emptySelectedCells|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L2053

:::

_core.emptySelectedCells([source])_

Erases content from cells that have been selected in the table.

**Emits**: [`Hooks#event:beforeChange`](@/api/hooks.md#beforechange), [`Hooks#event:afterChange`](@/api/hooks.md#afterchange)  
**Since**: 0.36.0  

| Param | Type | Description |
| --- | --- | --- |
| [source] | `string` | `optional` String that identifies how this change will be described in the changes array (useful in [Hooks#afterChange](@/api/hooks.md#afterchange) or [Hooks#beforeChange](@/api/hooks.md#beforechange) callbacks). Set to 'edit' if left empty. |



### getActiveEditor

::: ask-about-api getActiveEditor|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L4877

:::

_core.getActiveEditor() ⇒ [BaseEditor](@/api/baseEditor.md) | undefined_

Returns the active editor class instance.

The active editor is the editor instance associated with the currently selected cell.
An editor becomes active when a cell is selected and the editor is prepared (but not
necessarily open). If no cell is selected, the method returns `undefined`.


**Returns**: [`BaseEditor`](@/api/baseEditor.md) | `undefined` - The active editor instance, or `undefined` if no cell is selected.  

### getActiveSelectionLayerIndex

::: ask-about-api getActiveSelectionLayerIndex|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L2042

:::

_core.getActiveSelectionLayerIndex() ⇒ number_

Returns the index of the active selection layer. Active selection layer is the layer that
has visible focus highlight.

**Since**: 16.1.0  

**Returns**: `number` - The index of the active selection layer. `0` to `N` where `0` is the last (oldest) layer and `N` is the first (newest) layer.  

### getCell

::: ask-about-api getCell|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3094

:::

_core.getCell(row, column, [topmost]) ⇒ HTMLTableCellElement | null_

Returns a TD element for the given `row` and `column` arguments, if it is rendered on screen.
Returns `null` if the TD is not rendered on screen (probably because that part of the table is not visible).


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| row | `number` |  | Visual row index. |
| column | `number` |  | Visual column index. |
| [topmost] | `boolean` | <code>false</code> | `optional` If set to `true`, it returns the TD element from the topmost overlay. For example, if the wanted cell is in the range of fixed rows, it will return a TD element from the `top` overlay. |


**Returns**: `HTMLTableCellElement` | `null` - The cell's TD element.  

### getCellEditor

::: ask-about-api getCellEditor|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3779

:::

_core.getCellEditor(rowOrMeta, column) ⇒ function | boolean_

Returns the cell editor class by the provided `row` and `column` arguments.

**Example**  
```js
// Get cell editor class using `row` and `column` coordinates.
hot.getCellEditor(1, 1);
// Get cell editor class using cell meta object.
hot.getCellEditor(hot.getCellMeta(1, 1));
```

| Param | Type | Description |
| --- | --- | --- |
| rowOrMeta | `number` | Visual row index or cell meta object (see [Core#getCellMeta](@/api/core.md#getcellmeta)). |
| column | `number` | Visual column index. |


**Returns**: `function` | `boolean` - Returns the editor class or `false` is cell editor is disabled.  

### getCellMeta

::: ask-about-api getCellMeta|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3643

:::

_core.getCellMeta(row, column, options) ⇒ object_

Returns the cell properties object for the given `row` and `column` coordinates.

The returned object reflects the effective cell configuration after
[cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration)
(grid, column, and cell levels). To read global grid settings only, use [[getSettings]].
To read column-level meta, use [[getColumnMeta]].

**Emits**: [`Hooks#event:beforeGetCellMeta`](@/api/hooks.md#beforegetcellmeta), [`Hooks#event:afterGetCellMeta`](@/api/hooks.md#aftergetcellmeta)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| row | `number` |  | Visual row index. |
| column | `number` |  | Visual column index. |
| options | `object` |  | Execution options for the `getCellMeta` method. |
| [options.skipMetaExtension] | `boolean` | <code>false</code> | `optional` If `true`, skips extending the cell meta object. This means, the `cells` function, as well as the `afterGetCellMeta` and `beforeGetCellMeta` hooks, will not be called. |


**Returns**: `object` - The cell properties object.  

### getCellMetaAtRow

::: ask-about-api getCellMetaAtRow|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3732

:::

_core.getCellMetaAtRow(row) ⇒ Array_

Returns an array of cell meta objects for specified physical row index.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Physical row index. |



### getCellMetaTransient

::: ask-about-api getCellMetaTransient|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3677

:::

_core.getCellMetaTransient(row, column) ⇒ object_

Returns the cell properties object for the given `row` and `column` coordinates without
retaining it in the cell meta cache.

Like [[getCellMeta]], the returned object reflects the effective cell configuration after
[cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration)
and dynamic extension (the `cells` function and the `beforeGetCellMeta`/`afterGetCellMeta`
hooks run). Unlike `getCellMeta`, when the cell has no stored meta object the extension runs
on a temporary object that is not saved, so scanning many cells (for example, a whole column
or the entire dataset) does not permanently allocate one meta object per visited cell. Cells
that already carry stored meta (for example, written by [[setCellMeta]] or the `cell` option)
return their stored object, exactly as `getCellMeta` would.

Use this method for read-only bulk scans. Do not write to the returned object - for cells
without stored meta the write lands on the temporary object and is lost; use `setCellMeta`
to persist values.

**Emits**: [`Hooks#event:beforeGetCellMeta`](@/api/hooks.md#beforegetcellmeta), [`Hooks#event:afterGetCellMeta`](@/api/hooks.md#aftergetcellmeta)  
**Since**: 18.1.0  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |


**Returns**: `object` - The cell properties object.  

### getCellRenderer

::: ask-about-api getCellRenderer|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3757

:::

_core.getCellRenderer(rowOrMeta, column) ⇒ function_

Returns the cell renderer function by given `row` and `column` arguments.

**Example**  
```js
// Get cell renderer using `row` and `column` coordinates.
hot.getCellRenderer(1, 1);
// Get cell renderer using cell meta object.
hot.getCellRenderer(hot.getCellMeta(1, 1));
```

| Param | Type | Description |
| --- | --- | --- |
| rowOrMeta | `number` <br/> `object` | Visual row index or cell meta object (see [Core#getCellMeta](@/api/core.md#getcellmeta)). |
| column | `number` | Visual column index. |


**Returns**: `function` - Returns the renderer function.  

### getCellsMeta

::: ask-about-api getCellsMeta|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3634

:::

_core.getCellsMeta() ⇒ Array_

Get all the cells meta settings at least once generated in the table (in order of cell initialization).


**Returns**: `Array` - Returns an array of ColumnSettings object instances.  

### getCellValidator

::: ask-about-api getCellValidator|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3801

:::

_core.getCellValidator(rowOrMeta, column) ⇒ function | RegExp | undefined_

Returns the cell validator by `row` and `column`.

**Example**  
```js
// Get cell validator using `row` and `column` coordinates.
hot.getCellValidator(1, 1);
// Get cell validator using cell meta object.
hot.getCellValidator(hot.getCellMeta(1, 1));
```

| Param | Type | Description |
| --- | --- | --- |
| rowOrMeta | `number` <br/> `object` | Visual row index or cell meta object (see [Core#getCellMeta](@/api/core.md#getcellmeta)). |
| column | `number` | Visual column index. |


**Returns**: `function` | `RegExp` | `undefined` - The validator function.  

### getColHeader

::: ask-about-api getColHeader|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L4020

:::

_core.getColHeader([column], [headerLevel]) ⇒ Array | string | number_

Gets the values of column headers (if column headers are [enabled](@/api/options.md#colheaders)).

To get an array with the values of all
[bottom-most](@/guides/cell-features/clipboard/clipboard.md#copy-with-headers) column headers,
call `getColHeader()` with no arguments.

To get the value of the bottom-most header of a specific column, use the `column` parameter.

To get the value of a [specific-level](@/guides/columns/column-groups/column-groups.md) header
of a specific column, use the `column` and `headerLevel` parameters.

Read more:
- [Guides: Column groups](@/guides/columns/column-groups/column-groups.md)
- [Options: `colHeaders`](@/api/options.md#colheaders)
- [Guides: Copy with headers](@/guides/cell-features/clipboard/clipboard.md#copy-with-headers)

```js
// get the contents of all bottom-most column headers
hot.getColHeader();

// get the contents of the bottom-most header of a specific column
hot.getColHeader(5);

// get the contents of a specific column header at a specific level
hot.getColHeader(5, -2);
```

**Emits**: [`Hooks#event:modifyColHeader`](@/api/hooks.md#modifycolheader), [`Hooks#event:modifyColumnHeaderValue`](@/api/hooks.md#modifycolumnheadervalue)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [column] | `number` |  | `optional` A visual column index. |
| [headerLevel] | `number` | <code>-1</code> | `optional` (Since 12.3.0) Header level index. Accepts positive (0 to n)                                  and negative (-1 to -n) values. For positive values, 0 points to the                                  topmost header. For negative values, -1 points to the bottom-most                                  header (the header closest to the cells). |


**Returns**: `Array` | `string` | `number` - Column header values.  

### getColumnMeta

::: ask-about-api getColumnMeta|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3716

:::

_core.getColumnMeta(column) ⇒ object_

Returns the meta information for the provided column.

The returned object reflects the column-level configuration after
[cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration)
(grid and column levels). To read global grid settings only, use [[getSettings]].
To read the effective configuration for a specific cell, use [[getCellMeta]].

**Since**: 14.5.0  

| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |



### getColWidth

::: ask-about-api getColWidth|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L4141

:::

_core.getColWidth(column, [source]) ⇒ number_

Returns the width of the requested column.

**Emits**: [`Hooks#event:modifyColWidth`](@/api/hooks.md#modifycolwidth)  

| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |
| [source] | `string` | `optional` The source of the call. |


**Returns**: `number` - Column width.  

### getCoords

::: ask-about-api getCoords|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3125

:::

_core.getCoords(element) ⇒ [CellCoords](@/api/cellCoords.md) | null_

Returns the coordinates of the cell, provided as a HTML table cell element.

**Example**  
```js
hot.getCoords(hot.getCell(1, 1));
// it returns CellCoords object instance with props row: 1 and col: 1.
```

| Param | Type | Description |
| --- | --- | --- |
| element | `HTMLTableCellElement` | The HTML Element representing the cell. |


**Returns**: [`CellCoords`](@/api/cellCoords.md) | `null` - Visual coordinates object.  

### getCopyableData

::: ask-about-api getCopyableData|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L2593

:::

_core.getCopyableData(row, column) ⇒ string_

Returns the data's copyable value at specified `row` and `column` index.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |



### getCopyableSourceData

::: ask-about-api getCopyableSourceData|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L2604

:::

_core.getCopyableSourceData(row, column) ⇒ string_

Returns the source data's copyable value at specified `row` and `column` index.

**Since**: 16.1.0  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |



### getCopyableText

::: ask-about-api getCopyableText|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L2579

:::

_core.getCopyableText(startRow, startCol, endRow, endCol) ⇒ string_

Returns a string value of the selected range. Each column is separated by tab, each row is separated by a new
line character.


| Param | Type | Description |
| --- | --- | --- |
| startRow | `number` | From visual row index. |
| startCol | `number` | From visual column index. |
| endRow | `number` | To visual row index. |
| endCol | `number` | To visual column index. |



### getCurrentThemeName

::: ask-about-api getCurrentThemeName|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L5222

:::

_core.getCurrentThemeName() ⇒ string | undefined_

Gets the name of the currently used theme.

**Since**: 15.0.0  

**Returns**: `string` | `undefined` - The name of the currently used theme.  

### getData

::: ask-about-api getData|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L2544

:::

_core.getData([row], [column], [row2], [column2]) ⇒ Array&lt;Array&gt;_

Returns the current visual data as a 2D array.

Unlike the source data (which may be an array of objects), `getData()` always
returns an array of arrays regardless of the original data format. The returned
data reflects the current visual state of the grid: rows and columns are in their
current visual order, after any sorting, filtering, or reordering.

To retrieve the data in its original source format, use the [Core#getSourceData](@/api/core.md#getsourcedata) method instead.

Optionally you can provide a cell range by defining `row`, `column`, `row2`, `column2`
to get only a fragment of the data.

**Example**  
```js
// Get all data (in order how it is rendered in the table).
hot.getData();
// Get data fragment (from top-left 0, 0 to bottom-right 3, 3).
hot.getData(3, 3);
// Get data fragment (from top-left 2, 1 to bottom-right 3, 3).
hot.getData(2, 1, 3, 3);
```

| Param | Type | Description |
| --- | --- | --- |
| [row] | `number` | `optional` From visual row index. |
| [column] | `number` | `optional` From visual column index. |
| [row2] | `number` | `optional` To visual row index. |
| [column2] | `number` | `optional` To visual column index. |


**Returns**: `Array<Array>` - A 2D array of cell values in the current visual order.  

### getDataAtCell

::: ask-about-api getDataAtCell|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3218

:::

_core.getDataAtCell(row, column) ⇒ \*_

Returns the cell value at `row`, `column`.

__Note__: If data is reordered, sorted or trimmed, the currently visible order will be used.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |


**Returns**: `*` - Data at cell.  

### getDataAtCol

::: ask-about-api getDataAtCol|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3245

:::

_core.getDataAtCol(column) ⇒ Array_

Returns array of column values from the data source.

__Note__: If columns were reordered or sorted, the currently visible order will be used.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |


**Returns**: `Array` - Array of cell values.  

### getDataAtProp

::: ask-about-api getDataAtProp|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3265

:::

_core.getDataAtProp(prop) ⇒ Array_

Given the object property name (e.g. `'first.name'` or `'0'`), returns an array of column's values from the table data.
You can also provide a column index as the first argument.


| Param | Type | Description |
| --- | --- | --- |
| prop | `string` <br/> `number` | Property name or physical column index. |


**Returns**: `Array` - Array of cell values.  

### getDataAtRow

::: ask-about-api getDataAtRow|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3431

:::

_core.getDataAtRow(row) ⇒ Array_

Returns a single row of the data.

__Note__: If rows were reordered, sorted or trimmed, the currently visible order will be used.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |


**Returns**: `Array` - Array of row's cell data.  

### getDataAtRowProp

::: ask-about-api getDataAtRowProp|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3232

:::

_core.getDataAtRowProp(row, prop) ⇒ \*_

Returns value at visual `row` and `prop` indexes.

__Note__: If data is reordered, sorted or trimmed, the currently visible order will be used.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| prop | `string` | Property name. |


**Returns**: `*` - Cell value.  

### getDataType

::: ask-about-api getDataType|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3445

:::

_core.getDataType(rowFrom, columnFrom, rowTo, columnTo) ⇒ string_

Returns a data type defined in the Handsontable settings under the `type` key ([Options#type](@/api/options.md#type)).
If there are cells with different types in the selected range, it returns `'mixed'`.

__Note__: If data is reordered, sorted or trimmed, the currently visible order will be used.


| Param | Type | Description |
| --- | --- | --- |
| rowFrom | `number` | From visual row index. |
| columnFrom | `number` | From visual column index. |
| rowTo | `number` | To visual row index. |
| columnTo | `number` | To visual column index. |


**Returns**: `string` - Cell type (e.q: `'mixed'`, `'text'`, `'numeric'`, `'autocomplete'`).  

### getDirectionFactor

::: ask-about-api getDirectionFactor|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L426

:::

_core.getDirectionFactor() ⇒ number_

Returns 1 for LTR; -1 for RTL. Useful for calculations.

**Since**: 12.0.0  

**Returns**: `number` - Returns 1 for LTR; -1 for RTL.  

### getFirstFullyVisibleColumn

::: ask-about-api getFirstFullyVisibleColumn|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L4975

:::

_core.getFirstFullyVisibleColumn() ⇒ number | null_

Returns the first fully visible column in the table viewport. When the table has overlays the method returns
the first row of the main table that is not overlapped by overlay.

**Since**: 14.6.0  


### getFirstFullyVisibleRow

::: ask-about-api getFirstFullyVisibleRow|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L4953

:::

_core.getFirstFullyVisibleRow() ⇒ number | null_

Returns the first fully visible row in the table viewport. When the table has overlays the method returns
the first row of the main table that is not overlapped by overlay.

**Since**: 14.6.0  


### getFirstPartiallyVisibleColumn

::: ask-about-api getFirstPartiallyVisibleColumn|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L5019

:::

_core.getFirstPartiallyVisibleColumn() ⇒ number | null_

Returns the first partially visible column in the table viewport. When the table has overlays the method returns
the first row of the main table that is not overlapped by overlay.

**Since**: 14.6.0  


### getFirstPartiallyVisibleRow

::: ask-about-api getFirstPartiallyVisibleRow|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L4997

:::

_core.getFirstPartiallyVisibleRow() ⇒ number | null_

Returns the first partially visible row in the table viewport. When the table has overlays the method returns
the first row of the main table that is not overlapped by overlay.

**Since**: 14.6.0  


### getFirstRenderedVisibleColumn

::: ask-about-api getFirstRenderedVisibleColumn|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L4923

:::

_core.getFirstRenderedVisibleColumn() ⇒ number | null_

Returns the first rendered column in the DOM (usually, it is not visible in the table's viewport).

When the [MergeCells](@/api/mergeCells.md) plugin is enabled with its default `virtualized: false` setting, a merged
cell that crosses the viewport edge extends the rendered column range, so this method can return a
column index further from the viewport than usual. For the actual visible viewport, use
[Core#getFirstFullyVisibleColumn](@/api/core.md#getfirstfullyvisiblecolumn) or [Core#getFirstPartiallyVisibleColumn](@/api/core.md#getfirstpartiallyvisiblecolumn).

**Since**: 14.6.0  


### getFirstRenderedVisibleRow

::: ask-about-api getFirstRenderedVisibleRow|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L4893

:::

_core.getFirstRenderedVisibleRow() ⇒ number | null_

Returns the first rendered row in the DOM (usually, it is not visible in the table's viewport).

When the [MergeCells](@/api/mergeCells.md) plugin is enabled with its default `virtualized: false` setting, a merged
cell that crosses the viewport edge extends the rendered row range, so this method can return a row
index further from the viewport than usual. For the actual visible viewport, use
[Core#getFirstFullyVisibleRow](@/api/core.md#getfirstfullyvisiblerow) or [Core#getFirstPartiallyVisibleRow](@/api/core.md#getfirstpartiallyvisiblerow).

**Since**: 14.6.0  


### getFocusManager

::: ask-about-api getFocusManager|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L5369

:::

_core.getFocusManager() ⇒ FocusManager_

Return the Focus Manager responsible for managing the browser's focus in the table.

**Since**: 14.0.0  


### getFocusScopeManager

::: ask-about-api getFocusScopeManager|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L5379

:::

_core.getFocusScopeManager() ⇒ [FocusScopeManager](@/api/focusScopeManager.md)_

Returns the Focus Scope Manager. The module allows to register focus scopes for different parts of the grid
e.g. for dialogs, pagination, and other plugins that have own UI elements and need separate context.

**Since**: 16.2.0  
**Example**  
```js
hot.getFocusScopeManager().registerScope('myPluginName', containerElement, {
  shortcutsContextName: 'plugin:myPluginName',
  onActivate: (focusSource) => {
    // Focus the internal focusable element within the plugin UI element
    // depends on the activation focus source.
  },
});
```

**Returns**: [`FocusScopeManager`](@/api/focusScopeManager.md) - Instance of [FocusScopeManager](@/api/focusScopeManager.md)  

### getInstance

::: ask-about-api getInstance|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L5061

:::

_core.getInstance() ⇒ [Handsontable](@/api/core.md)_

Returns the Handsontable instance.


**Returns**: [`Handsontable`](@/api/core.md) - The Handsontable instance.  

### getLastFullyVisibleColumn

::: ask-about-api getLastFullyVisibleColumn|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L4986

:::

_core.getLastFullyVisibleColumn() ⇒ number | null_

Returns the last fully visible column in the table viewport. When the table has overlays the method returns
the first row of the main table that is not overlapped by overlay.

**Since**: 14.6.0  


### getLastFullyVisibleRow

::: ask-about-api getLastFullyVisibleRow|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L4964

:::

_core.getLastFullyVisibleRow() ⇒ number | null_

Returns the last fully visible row in the table viewport. When the table has overlays the method returns
the first row of the main table that is not overlapped by overlay.

**Since**: 14.6.0  


### getLastPartiallyVisibleColumn

::: ask-about-api getLastPartiallyVisibleColumn|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L5030

:::

_core.getLastPartiallyVisibleColumn() ⇒ number | null_

Returns the last partially visible column in the table viewport. When the table has overlays the method returns
the first row of the main table that is not overlapped by overlay.

**Since**: 14.6.0  


### getLastPartiallyVisibleRow

::: ask-about-api getLastPartiallyVisibleRow|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L5008

:::

_core.getLastPartiallyVisibleRow() ⇒ number | null_

Returns the last partially visible row in the table viewport. When the table has overlays the method returns
the first row of the main table that is not overlapped by overlay.

**Since**: 14.6.0  


### getLastRenderedVisibleColumn

::: ask-about-api getLastRenderedVisibleColumn|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L4938

:::

_core.getLastRenderedVisibleColumn() ⇒ number | null_

Returns the last rendered column in the DOM (usually, it is not visible in the table's viewport).

When the [MergeCells](@/api/mergeCells.md) plugin is enabled with its default `virtualized: false` setting, a merged
cell that crosses the viewport edge extends the rendered column range, so this method can return a
column index further from the viewport than usual. For the actual visible viewport, use
[Core#getLastFullyVisibleColumn](@/api/core.md#getlastfullyvisiblecolumn) or [Core#getLastPartiallyVisibleColumn](@/api/core.md#getlastpartiallyvisiblecolumn).

**Since**: 14.6.0  


### getLastRenderedVisibleRow

::: ask-about-api getLastRenderedVisibleRow|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L4908

:::

_core.getLastRenderedVisibleRow() ⇒ number | null_

Returns the last rendered row in the DOM (usually, it is not visible in the table's viewport).

When the [MergeCells](@/api/mergeCells.md) plugin is enabled with its default `virtualized: false` setting, a merged
cell that crosses the viewport edge extends the rendered row range, so this method can return a row
index further from the viewport than usual. For the actual visible viewport, use
[Core#getLastFullyVisibleRow](@/api/core.md#getlastfullyvisiblerow) or [Core#getLastPartiallyVisibleRow](@/api/core.md#getlastpartiallyvisiblerow).

**Since**: 14.6.0  


### getLayoutManager

::: ask-about-api getLayoutManager|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L5404

:::

_core.getLayoutManager() ⇒ LayoutManager_

Returns the Layout Manager. The module manages the order of plugin UI elements within the
user-orderable wrapper slots (`top`, `bottom`). Use it to add or remove custom UI and
order it via weights or the `layout` setting. Only available for the main instance.

**Since**: 18.0.0  
**Example**  
```js
hot.getLayoutManager().register('myToolbar', toolbarElement, { side: 'top', weight: 100 });
```

**Returns**: `LayoutManager` - Instance of [LayoutManager](@/api/layoutManager.md)  

### getPlugin

::: ask-about-api getPlugin|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L5041

:::

_core.getPlugin(pluginName) ⇒ [BasePlugin](@/api/basePlugin.md) | undefined_

Returns plugin instance by provided its name.


| Param | Type | Description |
| --- | --- | --- |
| pluginName | `string` | The plugin name. |


**Returns**: [`BasePlugin`](@/api/basePlugin.md) | `undefined` - The plugin instance or undefined if there is no plugin.  

### getRowHeader

::: ask-about-api getRowHeader|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3958

:::

_core.getRowHeader([row]) ⇒ Array | string | number_

Returns an array of row headers' values (if they are enabled). If param `row` was given, it returns the header of the given row as a string.

**Emits**: [`Hooks#event:modifyRowHeader`](@/api/hooks.md#modifyrowheader)  

| Param | Type | Description |
| --- | --- | --- |
| [row] | `number` | `optional` Visual row index. |


**Returns**: `Array` | `string` | `number` - Array of header values / single header value.  

### getRowHeight

::: ask-about-api getRowHeight|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L4188

:::

_core.getRowHeight(row, [source]) ⇒ number | undefined_

Returns a row's height, as recognized by Handsontable.

Depending on your configuration, the method returns (in order of priority):
  1. The row height set by the [`ManualRowResize`](@/api/manualRowResize.md) plugin
    (if the plugin is enabled).
  2. The row height set by the [`rowHeights`](@/api/options.md#rowheights) configuration option
    (if the option is set).
  3. The row height as measured in the DOM by the [`AutoRowSize`](@/api/autoRowSize.md) plugin
    (if the plugin is enabled).
  4. `undefined`, if neither [`ManualRowResize`](@/api/manualRowResize.md),
    nor [`rowHeights`](@/api/options.md#rowheights),
    nor [`AutoRowSize`](@/api/autoRowSize.md) is used.

The height returned includes 1 px of the row's bottom border.

Mind that this method is different from the
[`getRowHeight()`](@/api/autoRowSize.md#getrowheight) method
of the [`AutoRowSize`](@/api/autoRowSize.md) plugin.

**Emits**: [`Hooks#event:modifyRowHeight`](@/api/hooks.md#modifyrowheight)  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | A visual row index. |
| [source] | `string` | `optional` The source of the call. |


**Returns**: `number` | `undefined` - The height of the specified row, in pixels.  

### getSchema

::: ask-about-api getSchema|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L2616

:::

_core.getSchema() ⇒ object_

Returns schema provided by constructor settings. If it doesn't exist then it returns the schema based on the data
structure in the first row.


**Returns**: `object` - Schema object.  

### getSelected

::: ask-about-api getSelected|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L1943

:::

_core.getSelected() ⇒ Array&lt;Array&gt; | undefined_

Returns indexes of the currently selected cells as an array of arrays `[[startRow, startCol, endRow, endCol],...]`.

Start row and start column are the coordinates of the active cell (where the selection was started).

The version 0.36.0 adds a non-consecutive selection feature. Since this version, the method returns an array of arrays.
Additionally to collect the coordinates of the currently selected area (as it was previously done by the method)
you need to use `getSelectedLast` method.


**Returns**: `Array<Array>` | `undefined` - An array of arrays of the selection's coordinates.  

### getSelectedActive

::: ask-about-api getSelectedActive|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L1980

:::

_core.getSelectedActive() ⇒ Array&lt;number&gt; | undefined_

Returns the range coordinates of the active selection layer as an array. Active selection layer is the layer that
has visible focus highlight.

**Since**: 16.1.0  

**Returns**: `Array<number>` | `undefined` - Selected range as an array of coordinates or `undefined` if there is no selection.  

### getSelectedLast

::: ask-about-api getSelectedLast|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L1965

:::

_core.getSelectedLast() ⇒ Array | undefined_

Returns the last coordinates applied to the table as a an array `[startRow, startCol, endRow, endCol]`.

**Since**: 0.36.0  

**Returns**: `Array` | `undefined` - An array of the selection's coordinates.  

### getSelectedRange

::: ask-about-api getSelectedRange|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L2001

:::

_core.getSelectedRange() ⇒ Array&lt;[CellRange](@/api/cellRange.md)&gt; | undefined_

Returns the current selection as an array of CellRange objects.

The version 0.36.0 adds a non-consecutive selection feature. Since this version, the method returns an array of arrays.
Additionally to collect the coordinates of the active selected area (as it was previously done by the method)
you need to use `getSelectedRangeActive()` method.


**Returns**: <code>Array<[CellRange](@/api/cellRange.md)></code> | `undefined` - Selected range object or `undefined` if there is no selection.  

### getSelectedRangeActive

::: ask-about-api getSelectedRangeActive|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L2031

:::

_core.getSelectedRangeActive() ⇒ [CellRange](@/api/cellRange.md) | undefined_

Returns the range coordinates of the active selection layer. Active selection layer is the layer that
has visible focus highlight.

**Since**: 16.1.0  

**Returns**: [`CellRange`](@/api/cellRange.md) | `undefined` - Selected range object or `undefined` if there is no selection.  

### getSelectedRangeLast

::: ask-about-api getSelectedRangeLast|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L2016

:::

_core.getSelectedRangeLast() ⇒ [CellRange](@/api/cellRange.md) | undefined_

Returns the last coordinates applied to the table as a CellRange object.

**Since**: 0.36.0  

**Returns**: [`CellRange`](@/api/cellRange.md) | `undefined` - Selected range object or `undefined` if there is no selection.  

### getSettings

::: ask-about-api getSettings|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L2965

:::

_core.getSettings() ⇒ TableMeta_

Returns the current global grid settings object.

The returned object contains the settings passed to the constructor or the most recent
`updateSettings()` call. It reflects the
[grid-level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options)
configuration only.

It does not include merged per-cell or per-column values. Configuration options cascade from
grid to column to cell (see
[Cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration)).
To read the effective value for a specific cell, use [[getCellMeta]]. To read column-level meta, use [[getColumnMeta]].

**Example**  
```js
const hot = new Handsontable(container, {
  readOnly: false,
  columns: (index) => ({
    readOnly: index === 2 || index === 8,
  }),
});

// returns `false` (global grid-level setting)
hot.getSettings().readOnly;

// returns `true` for column 2 (merged column and cell meta)
hot.getCellMeta(0, 2).readOnly;
```

**Returns**: `TableMeta` - Object containing the current global grid settings.  

### getShortcutManager

::: ask-about-api getShortcutManager|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L5352

:::

_core.getShortcutManager() ⇒ [ShortcutManager](@/api/shortcutManager.md)_

Returns instance of a manager responsible for handling shortcuts stored in some contexts. It run actions after
pressing key combination in active Handsontable instance.

**Since**: 12.0.0  

**Returns**: [`ShortcutManager`](@/api/shortcutManager.md) - Instance of [ShortcutManager](@/api/shortcutManager.md)  

### getSourceData

::: ask-about-api getSourceData|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3284

:::

_core.getSourceData([row], [column], [row2], [column2]) ⇒ Array&lt;Array&gt; | Array&lt;object&gt;_

Returns a clone of the source data object.
Optionally you can provide a cell range by using the `row`, `column`, `row2`, `column2` arguments, to get only a
fragment of the table data.

__Note__: This method does not participate in data transformation. If the visual data of the table is reordered,
sorted or trimmed only physical indexes are correct.

__Note__: This method may return incorrect values for cells that contain
[formulas](@/guides/formulas/formula-calculation/formula-calculation.md). This is because `getSourceData()`
operates on source data ([physical indexes](@/api/indexMapper.md)),
whereas formulas operate on visual data (visual indexes).


| Param | Type | Description |
| --- | --- | --- |
| [row] | `number` | `optional` From physical row index. |
| [column] | `number` | `optional` From physical column index (or visual index, if data type is an array of objects). |
| [row2] | `number` | `optional` To physical row index. |
| [column2] | `number` | `optional` To physical column index (or visual index, if data type is an array of objects). |


**Returns**: `Array<Array>` | `Array<object>` - The table data.  

### getSourceDataArray

::: ask-about-api getSourceDataArray|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3313

:::

_core.getSourceDataArray([row], [column], [row2], [column2]) ⇒ Array_

Returns the source data object as an arrays of arrays format even when source data was provided in another format.
Optionally you can provide a cell range by using the `row`, `column`, `row2`, `column2` arguments, to get only a
fragment of the table data.

__Note__: This method does not participate in data transformation. If the visual data of the table is reordered,
sorted or trimmed only physical indexes are correct.


| Param | Type | Description |
| --- | --- | --- |
| [row] | `number` | `optional` From physical row index. |
| [column] | `number` | `optional` From physical column index (or visual index, if data type is an array of objects). |
| [row2] | `number` | `optional` To physical row index. |
| [column2] | `number` | `optional` To physical column index (or visual index, if data type is an array of objects). |


**Returns**: `Array` - An array of arrays.  

### getSourceDataAtCell

::: ask-about-api getSourceDataAtCell|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3419

:::

_core.getSourceDataAtCell(row, column) ⇒ \*_

Returns a single value from the data source.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Physical row index. |
| column | `number` | Visual column index. |


**Returns**: `*` - Cell data.  

### getSourceDataAtCol

::: ask-about-api getSourceDataAtCol|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3337

:::

_core.getSourceDataAtCol(column) ⇒ Array_

Returns an array of column values from the data source.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |


**Returns**: `Array` - Array of the column's cell values.  

### getSourceDataAtRow

::: ask-about-api getSourceDataAtRow|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3406

:::

_core.getSourceDataAtRow(row) ⇒ Array | object_

Returns a single row of the data (array or object, depending on what data format you use).

__Note__: This method does not participate in data transformation. If the visual data of the table is reordered,
sorted or trimmed only physical indexes are correct.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Physical row index. |


**Returns**: `Array` | `object` - Single row of data.  

### getTableHeight

::: ask-about-api getTableHeight|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L5232

:::

_core.getTableHeight() ⇒ number_

Gets the table's root container element height.

**Since**: 16.0.0  


### getTableWidth

::: ask-about-api getTableWidth|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L5242

:::

_core.getTableWidth() ⇒ number_

Gets the table's root container element width.

**Since**: 16.0.0  


### getTranslatedPhrase

::: ask-about-api getTranslatedPhrase|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L5167

:::

_core.getTranslatedPhrase(dictionaryKey, extraArguments) ⇒ string_

Get language phrase for specified dictionary key.

**Since**: 0.35.0  

| Param | Type | Description |
| --- | --- | --- |
| dictionaryKey | `string` | Constant which is dictionary key. |
| extraArguments | `*` | Arguments which will be handled by formatters. |



### getValue

::: ask-about-api getValue|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L2942

:::

_core.getValue() ⇒ \*_

Gets the value of the currently focused cell.

For column headers and row headers, returns `null`.


**Returns**: `*` - The value of the focused cell.  

### hasColHeaders

::: ask-about-api hasColHeaders|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3996

:::

_core.hasColHeaders() ⇒ boolean_

Returns information about if this table is configured to display column headers.


**Returns**: `boolean` - `true` if the instance has the column headers enabled, `false` otherwise.  

### hasHook

::: ask-about-api hasHook|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L5089

:::

_core.hasHook(key) ⇒ boolean_

Check if for a specified hook name there are added listeners (only for this Handsontable instance). All available
hooks you will find [Hooks](@/api/hooks.md).

**See**: [Hooks#has](@/api/hooks.md#has)  
**Example**  
```js
const hasBeforeInitListeners = hot.hasHook('beforeInit');
```

| Param | Type | Description |
| --- | --- | --- |
| key | `string` | Hook name. |



### hasRowHeaders

::: ask-about-api hasRowHeaders|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3987

:::

_core.hasRowHeaders() ⇒ boolean_

Returns information about if this table is configured to display row headers.


**Returns**: `boolean` - `true` if the instance has the row headers enabled, `false` otherwise.  

### initializeThemeManager

::: ask-about-api initializeThemeManager|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L1379

:::

_Core~initializeThemeManager(theme, [overrides])_

Initializes the ThemeManager with the given theme configuration.


| Param | Type | Description |
| --- | --- | --- |
| theme | `object` <br/> `boolean` | The theme configuration object or `true` to use the default theme. |
| [overrides] | `object` | `optional` The per-instance color scheme and density overrides. |



### isColumnModificationAllowed

::: ask-about-api isColumnModificationAllowed|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3742

:::

_core.isColumnModificationAllowed() ⇒ boolean_

Checks if your [data format](@/guides/getting-started/binding-to-data/binding-to-data.md#compatible-data-types)
and [configuration options](@/guides/getting-started/configuration-options/configuration-options.md)
allow for changing the number of columns.

Returns `false` when your data is an array of objects,
or when you use the [`columns`](@/api/options.md#columns) option.
Otherwise, returns `true`.



### isEmptyCol

::: ask-about-api isEmptyCol|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L4371

:::

_core.isEmptyCol(column) ⇒ boolean_

Check if all cells in the the column declared by the `column` argument are empty.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Column index. |


**Returns**: `boolean` - `true` if the column at the given `col` is empty, `false` otherwise.  

### isEmptyRow

::: ask-about-api isEmptyRow|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L4361

:::

_core.isEmptyRow(row) ⇒ boolean_

Check if all cells in the row declared by the `row` argument are empty.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |


**Returns**: `boolean` - `true` if the row at the given `row` is empty, `false` otherwise.  

### isExecutionSuspended

::: ask-about-api isExecutionSuspended|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L2231

:::

_core.isExecutionSuspended() ⇒ boolean_

Checks if the table indexes recalculation process was suspended. See explanation
in [Core#suspendExecution](@/api/core.md#suspendexecution).

**Since**: 8.3.0  


### isListening

::: ask-about-api isListening|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L1869

:::

_core.isListening() ⇒ boolean_

Returns `true` if the current Handsontable instance is listening to keyboard input on document body.


**Returns**: `boolean` - `true` if the instance is listening, `false` otherwise.  

### isLtr

::: ask-about-api isLtr|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L416

:::

_core.isLtr() ⇒ boolean_

Checks if the grid is rendered using the left-to-right layout direction.

**Since**: 12.0.0  

**Returns**: `boolean` - True if LTR.  

### isRenderSuspended

::: ask-about-api isRenderSuspended|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L2099

:::

_core.isRenderSuspended() ⇒ boolean_

Checks if the table rendering process was suspended. See explanation in [Core#suspendRender](@/api/core.md#suspendrender).

**Since**: 8.3.0  


### isRtl

::: ask-about-api isRtl|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L406

:::

_core.isRtl() ⇒ boolean_

Checks if the grid is rendered using the right-to-left layout direction.

**Since**: 12.0.0  

**Returns**: `boolean` - True if RTL.  

### listen

::: ask-about-api listen|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L1839

:::

_core.listen()_

Listen to the keyboard input on document body. This allows Handsontable to capture keyboard events and respond
in the right way.

**Emits**: [`Hooks#event:afterListen`](@/api/hooks.md#afterlisten)  


### loadData

::: ask-about-api loadData|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L2454

:::

_core.loadData(data, [source])_

The `loadData()` method replaces Handsontable's [`data`](@/api/options.md#data) with a new dataset.

Additionally, the `loadData()` method:
- Resets cells' states (e.g. cells' [formatting](@/guides/cell-features/formatting-cells/formatting-cells.md) and cells' [`readOnly`](@/api/options.md#readonly) states)
- Resets rows' states (e.g. row order)
- Resets columns' states (e.g. column order)

To replace Handsontable's [`data`](@/api/options.md#data) without resetting states, use the [`updateData()`](#updatedata) method.

Read more:
- [Binding to data](@/guides/getting-started/binding-to-data/binding-to-data.md)
- [Saving data](@/guides/getting-started/saving-data/saving-data.md)

**Emits**: [`Hooks#event:beforeLoadData`](@/api/hooks.md#beforeloaddata), [`Hooks#event:afterLoadData`](@/api/hooks.md#afterloaddata), [`Hooks#event:afterChange`](@/api/hooks.md#afterchange)  

| Param | Type | Description |
| --- | --- | --- |
| data | `Array` | An [array of arrays](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-arrays), or an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects), that contains Handsontable's data. |
| [source] | `string` | `optional` The source of the `loadData()` call. |



### populateFromArray

::: ask-about-api populateFromArray|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L1892

:::

_core.populateFromArray(row, column, input, [endRow], [endCol], [source], [method]) ⇒ object | undefined_

Populates cells at position with 2D input array (e.g. `[[1, 2], [3, 4]]`). Use `endRow`, `endCol` when you
want to cut input when a certain row is reached.

The `populateFromArray()` method can't change [`readOnly`](@/api/options.md#readonly) cells.

Optional `method` argument has the same effect as pasteMode option (see [Options#pasteMode](@/api/options.md#pastemode)).


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| row | `number` |  | Start visual row index. |
| column | `number` |  | Start visual column index. |
| input | `Array` |  | 2d array. |
| [endRow] | `number` |  | `optional` End visual row index (use when you want to cut input when certain row is reached). |
| [endCol] | `number` |  | `optional` End visual column index (use when you want to cut input when certain column is reached). |
| [source] | `string` | <code>&quot;populateFromArray&quot;</code> | `optional` Used to identify this call in the resulting events (beforeChange, afterChange). |
| [method] | `string` | <code>&quot;overwrite&quot;</code> | `optional` Populate method, possible values: `'shift_down'`, `'shift_right'`, `'overwrite'`. |


**Returns**: `object` | `undefined` - Ending td in pasted area (only if any cell was changed).  

### propToCol

::: ask-about-api propToCol|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3164

:::

_core.propToCol(prop) ⇒ number_

Returns column index that corresponds with the given property.


| Param | Type | Description |
| --- | --- | --- |
| prop | `string` <br/> `number` | Property name or physical column index. |


**Returns**: `number` - Visual column index.  

### readStoredThemeOverrides

::: ask-about-api readStoredThemeOverrides|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L1333

:::

_Core~readStoredThemeOverrides() ⇒ object_

Reads the color scheme and density currently configured on this instance.

Unlike `readThemeOverrides()`, this reads the effective values rather than only the keys that
one payload carries. `updateSettings()` stores grid options on the global meta, which the table
meta inherits through its prototype, so an own-property check would miss them. Use this when
rebuilding a ThemeManager, which has to pick up options set by an earlier call.


**Returns**: `object` - The theme overrides object.  

### readThemeOverrides

::: ask-about-api readThemeOverrides|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L1314

:::

_Core~readThemeOverrides(settings) ⇒ object_

Reads the per-instance color scheme and density overrides from a settings object.

Only the keys actually present are returned, so a missing key keeps the value already applied
instead of resetting it to the theme default.


| Param | Type | Description |
| --- | --- | --- |
| settings | `object` | The settings object to read the overrides from. |


**Returns**: `object` - The theme overrides object.  

### refreshDimensions

::: ask-about-api refreshDimensions|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L2373

:::

_core.refreshDimensions()_

Updates dimensions of the table. The method compares previous dimensions with the current ones and updates accordingly.

**Emits**: [`Hooks#event:beforeRefreshDimensions`](@/api/hooks.md#beforerefreshdimensions), [`Hooks#event:afterRefreshDimensions`](@/api/hooks.md#afterrefreshdimensions)  


### removeCellMeta

::: ask-about-api removeCellMeta|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3499

:::

_core.removeCellMeta(row, column, key)_

Remove a property defined by the `key` argument from the cell meta object for the provided `row` and `column` coordinates.

**Emits**: [`Hooks#event:beforeRemoveCellMeta`](@/api/hooks.md#beforeremovecellmeta), [`Hooks#event:afterRemoveCellMeta`](@/api/hooks.md#afterremovecellmeta)  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| key | `string` | Property name. |



### removeHook

::: ask-about-api removeHook|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L5126

:::

_core.removeHook(key, callback)_

Removes the hook listener previously registered with [Core#addHook](@/api/core.md#addhook).

**See**: [Hooks#remove](@/api/hooks.md#remove)  
**Example**  
```js
hot.removeHook('beforeInit', myCallback);
```

| Param | Type | Description |
| --- | --- | --- |
| key | `string` | Hook name. |
| callback | `function` | Reference to the function which has been registered using [Core#addHook](@/api/core.md#addhook). |



### render

::: ask-about-api render|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L2181

:::

_core.render()_

Rerender the table. Calling this method starts the process of recalculating, redrawing and applying the changes
to the DOM. While rendering the table all cell renderers are recalled.

Calling this method manually is not recommended. Handsontable tries to render itself by choosing the most
optimal moments in its lifecycle. After [setCellMeta()](@/api/core.md#setcellmeta) changes visual cell
properties, call this method to apply them, or wrap multiple calls in [batch()](@/api/core.md#batch).



### resolveRenderableScrollTarget

::: ask-about-api resolveRenderableScrollTarget|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L4658

:::

_Core~resolveRenderableScrollTarget(row, col) ⇒ Object | false_

Resolves renderable row and column indexes for scrolling, accounting for hidden indexes.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` <br/> `undefined` | Visual row index. |
| col | `number` <br/> `undefined` | Visual column index. |


**Returns**: `Object` | `false` - Resolved
  renderable indexes, or `false` when scrolling target is not reachable.  

### resumeExecution

::: ask-about-api resumeExecution|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L2268

:::

_core.resumeExecution([forceFlushChanges])_

Resumes the execution process. In combination with the [Core#suspendExecution](@/api/core.md#suspendexecution)
method it allows aggregating the table logic changes after which the cache is
updated. Resuming the state automatically invokes the table cache updating process.

The method is intended to be used by advanced users. Suspending the execution
process could cause visual glitches caused by not updated the internal table cache.

**Since**: 8.3.0  
**Example**  
```js
hot.suspendExecution();
const filters = hot.getPlugin('filters');

filters.addCondition(2, 'contains', ['3']);
filters.filter();
hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
hot.resumeExecution(); // It updates the cache internally
```

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [forceFlushChanges] | `boolean` | <code>false</code> | `optional` If `true`, the table internal data cache is recalculated after the execution of the batched operations. For nested [Core#batchExecution](@/api/core.md#batchexecution) calls, it can be desire to recalculate the table after each batch. |



### resumeRender

::: ask-about-api resumeRender|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L2145

:::

_core.resumeRender()_

Resumes the rendering process. In combination with the [Core#suspendRender](@/api/core.md#suspendrender)
method it allows aggregating the table render cycles triggered by API calls or UI
actions (or both) and calls the "render" once in the end. When the table is in
the suspend state, most operations will have no visual effect until the rendering
state is resumed. Resuming the state automatically invokes the table rendering.

The method is intended to be used by advanced users. Suspending the rendering
process could cause visual glitches when wrongly implemented.

Every [`suspendRender()`](@/api/core.md#suspendrender) call needs to correspond with one [`resumeRender()`](@/api/core.md#resumerender) call.
For example, if you call [`suspendRender()`](@/api/core.md#suspendrender) 5 times, you need to call [`resumeRender()`](@/api/core.md#resumerender) 5 times as well.

**Since**: 8.3.0  
**Example**  
```js
hot.suspendRender();
hot.alter('insert_row_above', 5, 45);
hot.alter('insert_col_start', 10, 40);
hot.setDataAtCell(1, 1, 'John');
hot.setDataAtCell(2, 2, 'Mark');
hot.setDataAtCell(3, 3, 'Ann');
hot.setDataAtCell(4, 4, 'Sophia');
hot.setDataAtCell(5, 5, 'Mia');
hot.selectCell(0, 0);
hot.resumeRender(); // It re-renders the table internally
```


### runHooks

::: ask-about-api runHooks|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L5142

:::

_core.runHooks(key, [p1], [p2], [p3], [p4], [p5], [p6]) ⇒ \*_

Run the callbacks for the hook provided in the `key` argument using the parameters given in the other arguments.

**See**: [Hooks#run](@/api/hooks.md#run)  
**Example**  
```js
// Run built-in hook
hot.runHooks('beforeInit');
// Run custom hook
hot.runHooks('customAction', 10, 'foo');
```

| Param | Type | Description |
| --- | --- | --- |
| key | `string` | Hook name. |
| [p1] | `*` | `optional` Argument passed to the callback. |
| [p2] | `*` | `optional` Argument passed to the callback. |
| [p3] | `*` | `optional` Argument passed to the callback. |
| [p4] | `*` | `optional` Argument passed to the callback. |
| [p5] | `*` | `optional` Argument passed to the callback. |
| [p6] | `*` | `optional` Argument passed to the callback. |



### scrollToFocusedCell

::: ask-about-api scrollToFocusedCell|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L4765

:::

_core.scrollToFocusedCell([callback]) ⇒ boolean_

Scrolls the viewport to coordinates specified by the currently focused cell.

**Emits**: [`Hooks#event:afterScroll`](@/api/hooks.md#afterscroll)  
**Since**: 14.0.0  

| Param | Type | Description |
| --- | --- | --- |
| [callback] | `function` | `optional` The callback function to call after the viewport is scrolled. |


**Returns**: `boolean` - `true` if the viewport was scrolled, `false` otherwise.  

### scrollViewportTo

::: ask-about-api scrollViewportTo|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L4673

:::

_core.scrollViewportTo(options, [callback]) ⇒ boolean_

Scroll viewport to coordinates specified by the `row` and/or `col` object properties.

The object-based signature was introduced in v14.0.0. The positional arguments form is retained
for backward compatibility.

```js
// scroll the viewport to the visual row index (leave the horizontal scroll untouched)
hot.scrollViewportTo({ row: 50 });

// scroll the viewport to the passed coordinates so that the cell at 50, 50 will be snapped to
// the bottom-end table's edge.
hot.scrollViewportTo({
  row: 50,
  col: 50,
  verticalSnap: 'bottom',
  horizontalSnap: 'end',
}, () => {
  // callback function executed after the viewport is scrolled
});

// scroll the viewport using the backward-compatible positional arguments form
hot.scrollViewportTo(50, 50, true, true);
```


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | `object` |  | A dictionary containing the following parameters: |
| [options.row] | `number` |  | `optional` Specifies the number of visual rows along the Y axis to scroll the viewport. |
| [options.col] | `number` |  | `optional` Specifies the number of visual columns along the X axis to scroll the viewport. |
| [options.verticalSnap] | `'top'` <br/> `'bottom'` |  | `optional` Determines to which edge of the table the viewport will be scrolled based on the passed coordinates. This option is a string which must take one of the following values: - `top`: The viewport will be scrolled to a row in such a way that it will be positioned on the top of the viewport; - `bottom`: The viewport will be scrolled to a row in such a way that it will be positioned on the bottom of the viewport; - If the property is not defined the vertical auto-snapping is enabled. Depending on where the viewport is scrolled from, a row will be positioned at the top or bottom of the viewport. |
| [options.horizontalSnap] | `'start'` <br/> `'end'` |  | `optional` Determines to which edge of the table the viewport will be scrolled based on the passed coordinates. This option is a string which must take one of the following values: - `start`: The viewport will be scrolled to a column in such a way that it will be positioned on the start (left edge or right, if the layout direction is set to `rtl`) of the viewport; - `end`: The viewport will be scrolled to a column in such a way that it will be positioned on the end (right edge or left, if the layout direction is set to `rtl`) of the viewport; - If the property is not defined the horizontal auto-snapping is enabled. Depending on where the viewport is scrolled from, a column will be positioned at the start or end of the viewport. |
| [options.considerHiddenIndexes] | `boolean` | <code>true</code> | `optional` If `true`, we handle visual indexes, otherwise we handle only indexes which may be rendered when they are in the viewport (we don't consider hidden indexes as they aren't rendered). |
| [callback] | `function` |  | `optional` The callback function to call after the viewport is scrolled. |


**Returns**: `boolean` - `true` if viewport was scrolled, `false` otherwise.  

### selectAll

::: ask-about-api selectAll|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L4597

:::

_core.selectAll([includeRowHeaders], [includeColumnHeaders], [options])_

Select all cells in the table excluding headers and corner elements.

The previous selection is overwritten.

```js
// Select all cells in the table along with row headers, including all headers and the corner cell.
// Doesn't select column headers and corner elements.
hot.selectAll();

// Select all cells in the table, including row headers but excluding the corner cell and column headers.
hot.selectAll(true, false);

// Select all cells in the table, including all headers and the corner cell, but move the focus.
// highlight to position 2, 1
hot.selectAll(-2, -1, {
   focusPosition: { row: 2, col: 1 }
});

// Select all cells in the table, without headers and corner elements.
hot.selectAll(false);
```

**Since**: 0.38.2  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [includeRowHeaders] | `boolean` | <code>false</code> | `optional` If `true`, includes the row headers in the selection. |
| [includeColumnHeaders] | `boolean` | <code>false</code> | `optional` If `true`, includes the column headers in the selection. |
| [options] | `object` |  | `optional` Additional object with options. Since 14.0.0. |
| [options.focusPosition] | `Object` <br/> `boolean` |  | `optional` The argument allows changing the cell/header focus position. The value takes an object with a `row` and `col` properties from -N to N, where negative values point to the headers and positive values point to the cell range. If `false`, the focus position won't be changed. When the [Options#navigableHeaders](@/api/options.md#navigableheaders) option is disabled (the default), a `focusPosition` that points to a header is relocated to the nearest cell in the data set. Example: ```js hot.selectAll(0, 0, { focusPosition: { row: 0, col: 1 }, disableHeadersHighlight: true }) ``` |
| [options.disableHeadersHighlight] | `boolean` |  | `optional` If `true`, disables highlighting the headers even when the logical coordinates points on them. This only suppresses the highlight shown on headers of a fully-selected row or column. It doesn't affect the focus indicator on the individual cell or header that holds the focus, which stays visible even when [Options#navigableHeaders](@/api/options.md#navigableheaders) moves the focus onto a header. |



### selectCell

::: ask-about-api selectCell|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L4381

:::

_core.selectCell(row, column, [endRow], [endColumn], [scrollToCell], [changeListener]) ⇒ boolean_

Select a single cell, or a single range of adjacent cells.

To select a cell, pass its visual row and column indexes, for example: `selectCell(2, 4)`.

To select a range, pass the visual indexes of the first and last cell in the range, for example: `selectCell(2, 4, 3, 5)`.

If your columns have properties, you can pass those properties' values instead of column indexes, for example: `selectCell(2, 'first_name')`.

By default, `selectCell()` also:
 - Scrolls the viewport to the newly-selected cells.
 - Switches the keyboard focus to Handsontable (by calling Handsontable's [`listen()`](#listen) method).

**Example**  
```js
// select a single cell
hot.selectCell(2, 4);

// select a range of cells
hot.selectCell(2, 4, 3, 5);

// select a single cell, using a column property
hot.selectCell(2, 'first_name');

// select a range of cells, using column properties
hot.selectCell(2, 'first_name', 3, 'last_name');

// select a range of cells, without scrolling to them
hot.selectCell(2, 4, 3, 5, false);

// select a range of cells, without switching the keyboard focus to Handsontable
hot.selectCell(2, 4, 3, 5, null, false);
```

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| row | `number` |  | A visual row index. |
| column | `number` <br/> `string` |  | A visual column index (`number`), or a column property's value (`string`). |
| [endRow] | `number` |  | `optional` If selecting a range: the visual row index of the last cell in the range. |
| [endColumn] | `number` <br/> `string` |  | `optional` If selecting a range: the visual column index (or a column property's value) of the last cell in the range. |
| [scrollToCell] | `boolean` | <code>true</code> | `optional` If `true`, scrolls the viewport to the newly-selected cells. If `false`, keeps the previous viewport. |
| [changeListener] | `boolean` | <code>true</code> | `optional` If `true`, switches the keyboard focus to Handsontable. If `false`, keeps the previous keyboard focus. If an element outside Handsontable (such as a custom input) currently owns the browser focus, it remains focused after the call. |


**Returns**: `boolean` - `true`: the selection was successful, `false`: the selection failed.  

### selectCells

::: ask-about-api selectCells|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L4442

:::

_core.selectCells(coords, [scrollToCell], [changeListener]) ⇒ boolean_

Select multiple cells or ranges of cells, adjacent or non-adjacent.

You can pass one of the below:
- An array of arrays (which matches the output of Handsontable's [`getSelected()`](#getselected) method).
- An array of [`CellRange`](@/api/cellRange.md) objects (which matches the output of Handsontable's [`getSelectedRange()`](#getselectedrange) method).

To select multiple cells, pass the visual row and column indexes of each cell, for example: `hot.selectCells([[1, 1], [5, 5]])`.

To select multiple ranges, pass the visual indexes of the first and last cell in each range, for example: `hot.selectCells([[1, 1, 2, 2], [6, 2, 0, 2]])`.

If your columns have properties, you can pass those properties' values instead of column indexes, for example: `hot.selectCells([[1, 'first_name'], [5, 'last_name']])`.

By default, `selectCell()` also:
 - Scrolls the viewport to the newly-selected cells.
 - Switches the keyboard focus to Handsontable (by calling Handsontable's [`listen()`](#listen) method).

**Since**: 0.38.0  
**Example**  
```js
// select non-adjacent cells
hot.selectCells([[1, 1], [5, 5], [10, 10]]);

// select non-adjacent ranges of cells
hot.selectCells([[1, 1, 2, 2], [10, 10, 20, 20]]);

// select cells and ranges of cells
hot.selectCells([[1, 1, 2, 2], [3, 3], [6, 2, 0, 2]]);

// select cells, using column properties
hot.selectCells([[1, 'id', 2, 'first_name'], [3, 'full_name'], [6, 'last_name', 0, 'first_name']]);

// select multiple ranges, using an array of `CellRange` objects
const selected = hot.getSelectedRange();

selected[0].from.row = 0;
selected[0].from.col = 0;
selected[0].to.row = 5;
selected[0].to.col = 5;

selected[1].from.row = 10;
selected[1].from.col = 10;
selected[1].to.row = 20;
selected[1].to.col = 20;

hot.selectCells(selected);
```

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| coords | `Array<Array>` <br/> `Array<CellRange>` |  | Visual coordinates, passed either as an array of arrays (`[[rowStart, columnStart, rowEnd, columnEnd], ...]`) or as an array of [`CellRange`](@/api/cellRange.md) objects. |
| [scrollToCell] | `boolean` | <code>true</code> | `optional` If `true`, scrolls the viewport to the newly-selected cells. If `false`, keeps the previous viewport. |
| [changeListener] | `boolean` | <code>true</code> | `optional` If `true`, switches the keyboard focus to Handsontable. If `false`, keeps the previous keyboard focus. If an element outside Handsontable (such as a custom input) currently owns the browser focus, it remains focused after the call. |


**Returns**: `boolean` - `true`: the selection was successful, `false`: the selection failed.  

### selectColumns

::: ask-about-api selectColumns|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L4523

:::

_core.selectColumns(startColumn, [endColumn], [focusPosition]) ⇒ boolean_

Select column specified by `startColumn` visual index, column property or a range of columns finishing at `endColumn`.

**Since**: 0.38.0  
**Example**  
```js
// Select column using visual index.
hot.selectColumns(1);
// Select column using column property.
hot.selectColumns('id');
// Select range of columns using visual indexes.
hot.selectColumns(1, 4);
// Select range of columns using visual indexes and mark the first header as highlighted.
hot.selectColumns(1, 2, -1);
// Select range of columns using visual indexes and mark the second cell as highlighted.
hot.selectColumns(2, 1, 1);
// Select range of columns using visual indexes and move the focus position somewhere in the middle of the range.
hot.selectColumns(2, 5, { row: 2, col: 3 });
// Select range of columns using column properties.
hot.selectColumns('id', 'last_name');
```

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| startColumn | `number` <br/> `string` |  | The visual column index or column property from which the selection starts. |
| [endColumn] | `number` <br/> `string` | <code>startColumn</code> | `optional` The visual column index or column property to which the selection finishes. If `endColumn` is not defined the column defined by `startColumn` will be selected. |
| [focusPosition] | `number` <br/> `Object` <br/> `CellCoords` | <code>0</code> | `optional` The argument allows changing the cell/header focus position. The value can take visual row index from -N to N, where negative values point to the headers and positive values point to the cell range. An object with `row` and `col` properties also can be passed to change the focus position horizontally. |


**Returns**: `boolean` - `true` if selection was successful, `false` otherwise.  

### selectRows

::: ask-about-api selectRows|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L4558

:::

_core.selectRows(startRow, [endRow], [focusPosition]) ⇒ boolean_

Select row specified by `startRow` visual index or a range of rows finishing at `endRow`.

**Since**: 0.38.0  
**Example**  
```js
// Select row using visual index.
hot.selectRows(1);
// select a range of rows, using visual indexes.
hot.selectRows(1, 4);
// select a range of rows, using visual indexes, and mark the header as highlighted.
hot.selectRows(1, 2, -1);
// Select range of rows using visual indexes and mark the second cell as highlighted.
hot.selectRows(2, 1, 1);
// Select range of rows using visual indexes and move the focus position somewhere in the middle of the range.
hot.selectRows(2, 5, { row: 2, col: 3 });
```

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| startRow | `number` |  | The visual row index from which the selection starts. |
| [endRow] | `number` | <code>startRow</code> | `optional` The visual row index to which the selection finishes. If `endRow` is not defined the row defined by `startRow` will be selected. |
| [focusPosition] | `number` <br/> `Object` <br/> `CellCoords` | <code>0</code> | `optional` The argument allows changing the cell/header focus position. The value can take visual row index from -N to N, where negative values point to the headers and positive values point to the cell range. An object with `row` and `col` properties also can be passed to change the focus position vertically. |


**Returns**: `boolean` - `true` if selection was successful, `false` otherwise.  

### setCellMeta

::: ask-about-api setCellMeta|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3603

:::

_core.setCellMeta(row, column, key, value)_

Sets a property defined by the `key` property to the meta object of a cell corresponding to params `row` and `column`.

This method updates internal cell metadata only. It does not repaint the grid. To reflect visual changes (such as
`className`, `type`, or `readOnly`), call [render()](@/api/core.md#render) afterward, or wrap multiple calls in
[batch()](@/api/core.md#batch).

**Emits**: [`Hooks#event:beforeSetCellMeta`](@/api/hooks.md#beforesetcellmeta), [`Hooks#event:afterSetCellMeta`](@/api/hooks.md#aftersetcellmeta)  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| key | `string` | Property name. |
| value | `string` | Property value. |



### setCellMetaObject

::: ask-about-api setCellMetaObject|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3548

:::

_core.setCellMetaObject(row, column, prop)_

Set cell meta data object defined by `prop` to the corresponding params `row` and `column`.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| prop | `object` | Meta object. |



### setDataAtCell

::: ask-about-api setDataAtCell|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L1748

:::

_core.setDataAtCell(row, [column], [value], [source])_

Set new value to a cell. To change many cells at once (recommended way), pass an array of `changes` in format
`[[row, col, value],...]` as the first argument.

**Emits**: [`Hooks#event:beforeChange`](@/api/hooks.md#beforechange), [`Hooks#event:afterChange`](@/api/hooks.md#afterchange)  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` <br/> `Array` | Visual row index or array of changes in format `[[row, col, value],...]`. |
| [column] | `number` | `optional` Visual column index. |
| [value] | `string` | `optional` New value. |
| [source] | `string` | `optional` String that identifies how this change will be described in the changes array (useful in [Hooks#afterChange](@/api/hooks.md#afterchange) or [Hooks#beforeChange](@/api/hooks.md#beforechange) callbacks). Set to 'edit' if left empty. |



### setDataAtRowProp

::: ask-about-api setDataAtRowProp|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L1800

:::

_core.setDataAtRowProp(row, prop, value, [source])_

Set new value to a cell. To change many cells at once (recommended way), pass an array of `changes` in format
`[[row, prop, value],...]` as the first argument.

**Emits**: [`Hooks#event:beforeChange`](@/api/hooks.md#beforechange), [`Hooks#event:afterChange`](@/api/hooks.md#afterchange)  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` <br/> `Array` | Visual row index or array of changes in format `[[row, prop, value], ...]`. |
| prop | `string` | Property name or the source string (e.g. `'first.name'` or `'0'`). |
| value | `string` | Value to be set. |
| [source] | `string` | `optional` String that identifies how this change will be described in changes array (useful in [Hooks#afterChange](@/api/hooks.md#afterchange) or [Hooks#beforeChange](@/api/hooks.md#beforechange) callbacks). |



### setSourceDataAtCell

::: ask-about-api setSourceDataAtCell|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3348

:::

_core.setSourceDataAtCell(row, column, value, [source])_

Set the provided value in the source data set at the provided coordinates.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` <br/> `Array` | Physical row index or array of changes in format `[[row, prop, value], ...]`. |
| column | `number` <br/> `string` | Physical column index / prop name. |
| value | `*` | The value to be set at the provided coordinates. |
| [source] | `string` | `optional` Source of the change as a string. |



### spliceCellsMeta

::: ask-about-api spliceCellsMeta|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3522

:::

_core.spliceCellsMeta(visualIndex, [deleteAmount], [...cellMetaRows])_

Removes or adds one or more rows of the cell meta objects to the cell meta collections.

**Since**: 0.30.0  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| visualIndex | `number` |  | A visual index that specifies at what position to add/remove items. |
| [deleteAmount] | `number` | <code>0</code> | `optional` The number of items to be removed. If set to 0, no cell meta objects will be removed. |
| [...cellMetaRows] | `object` |  | `optional` The new cell meta row objects to be added to the cell meta collection. |



### spliceCol

::: ask-about-api spliceCol|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L1917

:::

_core.spliceCol(column, index, amount, [...elements]) ⇒ Array_

Adds/removes data from the column. This method works the same as Array.splice for arrays.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Index of the column in which do you want to do splice. |
| index | `number` | Index at which to start changing the array. If negative, will begin that many elements from the end. |
| amount | `number` | An integer indicating the number of old array elements to remove. If amount is 0, no elements are removed. |
| [...elements] | `number` | `optional` The elements to add to the array. If you don't specify any elements, spliceCol simply removes elements from the array. |


**Returns**: `Array` - Returns removed portion of columns.  

### spliceRow

::: ask-about-api spliceRow|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L1930

:::

_core.spliceRow(row, index, amount, [...elements]) ⇒ Array_

Adds/removes data from the row. This method works the same as Array.splice for arrays.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Index of column in which do you want to do splice. |
| index | `number` | Index at which to start changing the array. If negative, will begin that many elements from the end. |
| amount | `number` | An integer indicating the number of old array elements to remove. If amount is 0, no elements are removed. |
| [...elements] | `number` | `optional` The elements to add to the array. If you don't specify any elements, spliceCol simply removes elements from the array. |


**Returns**: `Array` - Returns removed portion of rows.  

### suspendExecution

::: ask-about-api suspendExecution|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L2242

:::

_core.suspendExecution()_

Suspends the execution process. It's helpful to wrap the table logic changes
such as index changes into one call after which the cache is updated. As a result,
it improves the performance of wrapped operations.

The method is intended to be used by advanced users. Suspending the execution
process could cause visual glitches caused by not updated the internal table cache.

**Since**: 8.3.0  
**Example**  
```js
hot.suspendExecution();
const filters = hot.getPlugin('filters');

filters.addCondition(2, 'contains', ['3']);
filters.filter();
hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
hot.resumeExecution(); // It updates the cache internally
```


### suspendRender

::: ask-about-api suspendRender|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L2109

:::

_core.suspendRender()_

Suspends the rendering process. It's helpful to wrap the table render
cycles triggered by API calls or UI actions (or both) and call the "render"
once in the end. As a result, it improves the performance of wrapped operations.
When the table is in the suspend state, most operations will have no visual
effect until the rendering state is resumed. Resuming the state automatically
invokes the table rendering. To make sure that after executing all operations,
the table will be rendered, it's highly recommended to use the [Core#batchRender](@/api/core.md#batchrender)
method or [Core#batch](@/api/core.md#batch), which additionally aggregates the logic execution
that happens behind the table.

The method is intended to be used by advanced users. Suspending the rendering
process could cause visual glitches when wrongly implemented.

Every [`suspendRender()`](@/api/core.md#suspendrender) call needs to correspond with one [`resumeRender()`](@/api/core.md#resumerender) call.
For example, if you call [`suspendRender()`](@/api/core.md#suspendrender) 5 times, you need to call [`resumeRender()`](@/api/core.md#resumerender) 5 times as well.

**Since**: 8.3.0  
**Example**  
```js
hot.suspendRender();
hot.alter('insert_row_above', 5, 45);
hot.alter('insert_col_start', 10, 40);
hot.setDataAtCell(1, 1, 'John');
hot.setDataAtCell(2, 2, 'Mark');
hot.setDataAtCell(3, 3, 'Ann');
hot.setDataAtCell(4, 4, 'Sophia');
hot.setDataAtCell(5, 5, 'Mia');
hot.selectCell(0, 0);
hot.resumeRender(); // It re-renders the table internally
```


### toHTML

::: ask-about-api toHTML|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L5179

:::

_core.toHTML() ⇒ string_

Converts instance into outerHTML of HTMLTableElement.

**Since**: 7.1.0  


### toPhysicalColumn

::: ask-about-api toPhysicalColumn|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3207

:::

_core.toPhysicalColumn(column) ⇒ number_

Translate visual column index into physical.

This method is useful when you want to retrieve physical column index based on a visual index which can be
reordered, moved or trimmed.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |


**Returns**: `number` - Returns physical column index.  

### toPhysicalRow

::: ask-about-api toPhysicalRow|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3196

:::

_core.toPhysicalRow(row) ⇒ number_

Translate visual row index into physical.

This method is useful when you want to retrieve physical row index based on a visual index which can be
reordered, moved or trimmed.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |


**Returns**: `number` - Returns physical row index.  

### toTableElement

::: ask-about-api toTableElement|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L5187

:::

_core.toTableElement() ⇒ HTMLTableElement_

Converts instance into HTMLTableElement.

**Since**: 7.1.0  


### toVisualColumn

::: ask-about-api toVisualColumn|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3185

:::

_core.toVisualColumn(column) ⇒ number_

Translate physical column index into visual.

This method is useful when you want to retrieve visual column index which can be reordered, moved or trimmed
based on a physical index.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Physical column index. |


**Returns**: `number` - Returns visual column index.  

### toVisualRow

::: ask-about-api toVisualRow|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3174

:::

_core.toVisualRow(row) ⇒ number_

Translate physical row index into visual.

This method is useful when you want to retrieve visual row index which can be reordered, moved or trimmed
based on a physical index.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Physical row index. |


**Returns**: `number` - Returns visual row index.  

### unlisten

::: ask-about-api unlisten|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L1857

:::

_core.unlisten()_

Stop listening to keyboard input on the document body. Calling this method makes the Handsontable inactive for
any keyboard events.



### updateData

::: ask-about-api updateData|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L2411

:::

_core.updateData(data, [source])_

The `updateData()` method replaces Handsontable's [`data`](@/api/options.md#data) with a new dataset.

The `updateData()` method:
- Keeps cells' states (e.g. cells' [formatting](@/guides/cell-features/formatting-cells/formatting-cells.md) and cells' [`readOnly`](@/api/options.md#readonly) states)
- Keeps rows' states (e.g. row order)
- Keeps columns' states (e.g. column order)

To replace Handsontable's [`data`](@/api/options.md#data) and reset states, use the [`loadData()`](#loaddata) method.

Read more:
- [Binding to data](@/guides/getting-started/binding-to-data/binding-to-data.md)
- [Saving data](@/guides/getting-started/saving-data/saving-data.md)

**Emits**: [`Hooks#event:beforeUpdateData`](@/api/hooks.md#beforeupdatedata), [`Hooks#event:afterUpdateData`](@/api/hooks.md#afterupdatedata), [`Hooks#event:afterChange`](@/api/hooks.md#afterchange)  
**Since**: 11.1.0  

| Param | Type | Description |
| --- | --- | --- |
| data | `Array` | An [array of arrays](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-arrays), or an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects), that contains Handsontable's data. |
| [source] | `string` | `optional` The source of the `updateData()` call. |



### updateSettings

::: ask-about-api updateSettings|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L2626

:::

_core.updateSettings(settings, [init])_

Use it if you need to change configuration after initialization. The `settings` argument is an object containing the changed
settings, declared the same way as in the initial settings object.

__Note__, that although the `updateSettings` method doesn't overwrite the previously declared settings, it might reset
the settings made post-initialization. (for example - ignore changes made using the columnResize feature).

Passing `columns` inside the `settings` object resets the states corresponding to rows and columns
(for example, row/column sequence, column width, row height, frozen columns etc.). Passing `data` does not reset these states.

After initialization, passing `data` calls [`updateData()`](@/api/core.md#updatedata) internally.
The resulting [`beforeUpdateData`](@/api/hooks.md#beforeupdatedata) and
[`afterUpdateData`](@/api/hooks.md#afterupdatedata) hooks receive `"updateSettings"` as their
`source`, while [`afterChange`](@/api/hooks.md#afterchange) receives `null` as its `changes`
argument and `"updateData"` as its `source`. If you call `updateSettings` with `data` inside
`afterChange`, check the hook's `source` to prevent an infinite loop.

Cell meta set imperatively through [[setCellMeta]] (for example, by the user or the context menu) is preserved across
`updateSettings`, even when `settings` includes `cell`, `cells`, or `columns`. On a direct conflict, a value re-stated
through the declarative `cell` option takes precedence over the preserved imperative value.

Cell meta set imperatively through [[setCellMeta]] (for example, by the user or the context menu) is preserved across
`updateSettings`, even when `settings` includes `cell`, `cells`, or `columns`. On a direct conflict, a value re-stated
through the declarative `cell` option takes precedence over the preserved imperative value.

When [[Hooks#hasExternalDataSource]] is true, Handsontable clears and rebinds the placeholder dataset only during
initialization or when `settings` includes `data` or `dataProvider`. Other keys alone (for example `height`) do not clear loaded rows.
If only `columns` changes, the column map is rebuilt without clearing rows.

**Emits**: [`Hooks#event:afterCellMetaReset`](@/api/hooks.md#aftercellmetareset), [`Hooks#event:afterUpdateSettings`](@/api/hooks.md#afterupdatesettings)  
**Example**  
```js
hot.updateSettings({
   contextMenu: true,
   colHeaders: true,
   fixedRowsTop: 2
});
```

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| settings | `object` |  | A settings object (see [Options](@/api/options.md)). Only provide the settings that are changed, not the whole settings object that was used for initialization. |
| [init] | `boolean` | <code>false</code> | `optional` Internally used during initialization. |



### useTheme

::: ask-about-api useTheme|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L5201

:::

_core.useTheme(themeName)_

Use the theme specified by the provided name.

**Since**: 15.0.0  

| Param | Type | Description |
| --- | --- | --- |
| themeName | `string` <br/> `boolean` <br/> `undefined` | The name of the theme to use. |



### validateCell

::: ask-about-api validateCell|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L1628

:::

_core.validateCell(value, cellProperties, callback, source)_

Validate a single cell.


| Param | Type | Description |
| --- | --- | --- |
| value | `string` <br/> `number` | The value to validate. |
| cellProperties | `object` | The cell meta which corresponds with the value. |
| callback | `function` | The callback function. |
| source | `string` | The string that identifies source of the validation. |



### validateCells

::: ask-about-api validateCells|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3823

:::

_core.validateCells([callback])_

Validates every cell in the data set,
using a [validator function](@/guides/cell-functions/cell-validator/cell-validator.md) configured for each cell.

Doesn't validate cells that are currently [trimmed](@/guides/rows/row-trimming/row-trimming.md),
[hidden](@/guides/rows/row-hiding/row-hiding.md), or [filtered](@/guides/columns/column-filter/column-filter.md),
as such cells are not included in the data set until you bring them back again.

After the validation, the `callback` function is fired, with the `valid` argument set to:
- `true` for valid cells
- `false` for invalid cells

**Example**  
```js
hot.validateCells((valid) => {
  if (valid) {
    // ... code for validated cells
  }
})
```

| Param | Type | Description |
| --- | --- | --- |
| [callback] | `function` | `optional` The callback function. |



### validateColumns

::: ask-about-api validateColumns|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3873

:::

_core.validateColumns([columns], [callback])_

Validates columns using their validator functions and calls callback when finished.

If one of the cells is invalid, the callback will be fired with `'valid'` arguments as `false` - otherwise it
 would equal `true`.

**Example**  
```js
hot.validateColumns([3, 4, 5], (valid) => {
  if (valid) {
    // ... code for validated columns
  }
})
```

| Param | Type | Description |
| --- | --- | --- |
| [columns] | `Array` | `optional` Array of validation target visual columns indexes. |
| [callback] | `function` | `optional` The callback function. |



### validateRows

::: ask-about-api validateRows|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/core.ts#L3849

:::

_core.validateRows([rows], [callback])_

Validates rows using their validator functions and calls callback when finished.

If one of the cells is invalid, the callback will be fired with `'valid'` arguments as `false` - otherwise it
 would equal `true`.

**Example**  
```js
hot.validateRows([3, 4, 5], (valid) => {
  if (valid) {
    // ... code for validated rows
  }
})
```

| Param | Type | Description |
| --- | --- | --- |
| [rows] | `Array` | `optional` Array of validation target visual row indexes. |
| [callback] | `function` | `optional` The callback function. |


