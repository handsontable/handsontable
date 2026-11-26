---
title: Core
metaTitle: Core API reference | Handsontable DataGrid for JavaScript
permalink: /api/core
canonicalUrl: /api/core
searchCategory: API Reference
hotPlugin: false
editLink: false
id: o9civnqe
description: A complete list of the public API methods of Handsontable DataGrid's core that let you control your data grid programmatically.
react:
  id: 6kcorabp
  metaTitle: Core methods API reference | Handsontable DataGrid for React
angular:
  id: a8m3k9xz
  metaTitle: Core methods API reference | Handsontable DataGrid for Angular
---

[[toc]]

## Description

The `Handsontable` class (known as the `Core`) lets you modify the grid's behavior by using Handsontable DataGrid's public API methods.

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api activeHeaderClassName|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L286

:::

_core.activeHeaderClassName : string_

The `activeHeaderClassName` option lets you add a CSS class name
to every currently-active, currently-selected header (when a whole column or row is selected).

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api allowEmpty|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L339

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

This option can be set at any level of the [cascading configuration](@/guides/configuration/configuration-options/configuration-options.md#cascading-configuration):
the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options), the [`columns`](@/api/options.md#columns) level, the [`cells`](@/api/options.md#cells) level, and the [`cell`](@/api/options.md#cell) level.

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api allowHtml|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L381

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api allowInsertColumn|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L439

:::

_core.allowInsertColumn : boolean_

The `allowInsertColumn` option controls two things: the insert items in the menus, and whether
the grid may add columns on its own.

If set to `true`, the option adds the following menu items to the [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)
and to the [column menu](@/guides/accessories-and-menus/column-menu/column-menu.md):
- **Insert column left**
- **Insert column right**

If set to `false`, the option also stops the grid from adding columns on its own:
- A [paste](@/guides/cell-features/clipboard/clipboard.md) that is wider than the columns left to the right of the
  selection stops at the last column. Handsontable drops the extra values, and reports no error. In the
  `shift_right` [`pasteMode`](@/api/copyPaste.md) the values pushed past the last column are **lost**, because no
  column is created to receive them.
- An [autofill](@/guides/cell-features/autofill-values/autofill-values.md) that reaches past the last column stops
  at the last column.
  longer create the missing columns when you write past the last column. The write still reaches the source
  data, so `getSourceData()` returns the value while the grid never displays it.
  This bullet applies only when your [`data`](@/api/options.md#data) is an array of arrays and you do not set the
  [`columns`](@/api/options.md#columns) option – in any other configuration these methods never add columns anyway, whatever
  this option is set to.

This option does not decide whether the value reaches the source data – the write path does. A paste or an
autofill stops at the last column, so nothing is written there at all. A direct
`setDataAtCell()` or `setDataAtRowProp()` call
writes the value whatever this option is set to. On an object [`data`](@/api/options.md#data) source that direct write is
deprecated as of 19.0.0 and will be ignored from 20.0.0 on. See `setDataAtCell()`,
which owns that rule; `setDataAtRowProp()` is not affected, because the property you pass names the field to
write.

The option does not stop these ways of adding columns:
- The [`minCols`](@/api/options.md#mincols) and [`minSpareCols`](@/api/options.md#minsparecols) options. Both are themselves skipped when the
  [`columns`](@/api/options.md#columns) option is set, and `minSpareCols` also requires [`data`](@/api/options.md#data) to be an array of arrays.
- Undo and redo.
- Pressing <kbd>**Enter**</kbd> at the last column, when [`minSpareCols`](@/api/options.md#minsparecols) is above `0` and
  [`enterMoves`](@/api/options.md#entermoves) is set to move the column. The default `enterMoves` moves the row only, so this
  does not happen out of the box.

To cap the number of columns whatever the source, use [`maxCols`](@/api/options.md#maxcols) as well.

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>true</code>  
**Example**  
```js
// hide the 'Insert column left' and 'Insert column right' menu items,
// and stop the grid from adding columns during paste, autofill, and `setDataAtCell()`
allowInsertColumn: false,
```


### allowInsertRow
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api allowInsertRow|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L487

:::

_core.allowInsertRow : boolean_

The `allowInsertRow` option controls two things: the insert items in the context menu, and whether
the grid may add rows on its own.

If set to `true`, the option adds the following menu items to the [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md):
- **Insert row above**
- **Insert row below**

If set to `false`, the option also stops the grid from adding rows on its own:
- A [paste](@/guides/cell-features/clipboard/clipboard.md) that is taller than the rows left below the selection
  stops at the last row. Handsontable drops the extra values, and reports no error. In the
  `shift_down` [`pasteMode`](@/api/copyPaste.md) the rows pushed past the last row are **lost**, because no row is
  created to receive them.
- An [autofill](@/guides/cell-features/autofill-values/autofill-values.md) whose fill reaches past the last row
  stops at the last row, unless the [`fillHandle`](@/api/options.md#fillhandle) option's `autoInsertRow` setting has already
  appended rows to take it – see the next list.
  not create the missing rows when you write below the last row. Both currently **throw a `TypeError`** in that
  case, so guard the call, or keep the row index within `countRows()`.

The option does not stop these ways of adding rows:
- The [`minRows`](@/api/options.md#minrows) and [`minSpareRows`](@/api/options.md#minsparerows) options.
- Undo and redo.
- The fill handle appending rows when you drag it below the last row. That is governed solely by the
  [`fillHandle`](@/api/options.md#fillhandle) option's `autoInsertRow` setting, which ignores `allowInsertRow`. It applies only
  when you set [`fillHandle`](@/api/options.md#fillhandle) explicitly – left unset, the grid does not append rows this way.
- Pressing <kbd>**Enter**</kbd> at the last row, when [`minSpareRows`](@/api/options.md#minsparerows) is above `0`. Only
  <kbd>**Enter**</kbd> does this – the arrow keys and <kbd>**Tab**</kbd> never create a row.

To cap the number of rows whatever the source, use [`maxRows`](@/api/options.md#maxrows) as well.

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>true</code>  
**Example**  
```js
// hide the 'Insert row above' and 'Insert row below' menu items from the context menu,
// and stop the grid from adding rows during paste, autofill, and `setDataAtCell()`
allowInsertRow: false,
```


### allowInvalid
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api allowInvalid|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L519

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api allowRemoveColumn|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L548

:::

_core.allowRemoveColumn : boolean_

If set to `true`, the `allowRemoveColumn` option adds the following menu item to the [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)
and to the [column menu](@/guides/accessories-and-menus/column-menu/column-menu.md):
- **Remove column**

The option hides that menu item only. It does not stop the `alter()` method's
`remove_col` action, and it does not stop undo or redo. To block a removal, return `false` from the
[`beforeRemoveCol`](@/api/hooks.md#beforeremovecol) hook – that is the only lever that stops one.
[`minCols`](@/api/options.md#mincols) does not: it appends an empty column afterwards to restore the count, and the removed data
is already gone.

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

Read more:
- [Context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)

**Default**: <code>true</code>  
**Example**  
```js
// hide the 'Remove column' menu item from the context menu and the column menu
allowRemoveColumn: false,
```


### allowRemoveRow
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api allowRemoveRow|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L576

:::

_core.allowRemoveRow : boolean_

If set to `true`, the `allowRemoveRow` option adds the following menu item to the [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md):
- **Remove row**

The option hides that menu item only. It does not stop the `alter()` method's
`remove_row` action, and it does not stop undo or redo. To block a removal, return `false` from the
[`beforeRemoveRow`](@/api/hooks.md#beforeremoverow) hook – that is the only lever that stops one.
[`minRows`](@/api/options.md#minrows) does not: it appends an empty row afterwards to restore the count, and the removed data
is already gone.

Read more:
- [Context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>true</code>  
**Example**  
```js
// hide the 'Remove row' menu item from the context menu
allowRemoveRow: false,
```


### ariaTags
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api ariaTags|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L604

:::

_core.ariaTags : boolean_

The `ariaTags` option decides whether Handsontable adds the ARIA roles and attributes that describe
the grid to assistive technologies: `role="treegrid"` on the grid, `role="row"` on each row,
`role="gridcell"` on each cell, the header roles, `aria-sort`, `aria-expanded`, and the rest.
It defaults to `true`. Set it to `false` only when you add your own ARIA markup. The option also
removes the `tabindex` the grid puts on cells, headers, and menu items, so browser focus no longer
moves onto them. The menu styles read `aria-expanded` too, so a menu item keeps its focus outline
while its submenu is open.

You can set the `ariaTags` option only at Handsontable's [initialization](@/guides/getting-started/installation/installation.md#initialize-handsontable). Any change of it after the initialization (e.g. using the `updateSettings()` method) throws an error, even when you didn't set the option at initialization.

Read more:
- [Accessibility](@/guides/accessibility/accessibility/accessibility.md)
- [Accessibility conformance report](@/guides/accessibility/accessibility-conformance-report/accessibility-conformance-report.md)

**Default**: <code>true</code>  
**Since**: 14.0.0  
**Example**  
```js
// turn the ARIA roles and attributes off (default: true)
ariaTags: false,
```


### autoWrapCol
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api autoWrapCol|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L867

:::

_core.autoWrapCol : boolean_

| Setting           | Description                                                                                                                                                                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `false` (default) | When you select a bottom-most cell, pressing <kbd>**↓**</kbd> doesn't do anything.<br><br>When you select a top-most cell, pressing <kbd>**↑**</kbd> doesn't do anything.                                                                    |
| `true`            | When you select a bottom-most cell, pressing <kbd>**↓**</kbd> takes you to the top-most cell of the next column.<br><br>When you select a top-most cell, pressing <kbd>**↑**</kbd> takes you to the bottom-most cell of the previous column. |

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api autoWrapRow|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L896

:::

_core.autoWrapRow : boolean_

| Setting           | Description                                                                                                                                                                                                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `false` (default) | When you select the first cell of a row, pressing <kbd>**←**</kbd>* (or <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd>\*\*) doesn't do anything.<br><br>When you select the last cell of a row, pressing <kbd>**→**</kbd>* (or <kbd>**Tab**</kbd>**) doesn't do anything.                                                  |
| `true`            | When you select the first cell of a row, pressing <kbd>**←**</kbd>* (or <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd>\*\*) takes you to the last cell of the row above.<br><br>When you select the last cell of a row, pressing <kbd>**→**</kbd>* (or <kbd>**Tab**</kbd>**) takes you to the first cell of the row below. |

\* The exact key depends on your [`layoutDirection`](@/api/options.md#layoutdirection) configuration.<br>
\*\* Unless [`tabNavigation`](@/api/options.md#tabnavigation) is set to `false`.

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api cell|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L975

:::

_core.cell : Array&lt;Array&gt;_

The `cell` option lets you apply [configuration options](@/guides/configuration/configuration-options/configuration-options.md) to individual cells.

The `cell` option overwrites the [top-level grid options](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options),
and the [`columns`](@/api/options.md#columns) options.

Each entry's `row` and `col` are **visual** indexes. This differs from the [`cells`](@/api/options.md#cells)
option, whose `row` and `column` are physical indexes.

The `cell` option persists across `updateSettings()` calls that do not
mention it. Passing `cell` again replaces every previously declared entry, so `cell: []` removes them
all. An entry follows its row through sorting and row moves, and a later
`setCellMeta()` call on the same property wins over the declared value -
until the next call restates `cell`, which wins over everything.

A value that is not an array is ignored, and reported in the console. It does not reach
`getSettings()` either, so the previously declared entries stay in place.
Wrap a single entry in an array.

Read more:
- [Setting options: Setting cell options](@/guides/configuration/configuration-options/configuration-options.md#set-cell-options)
- [`columns`](@/api/options.md#columns)
- [`cells`](@/api/options.md#cells)

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api cells|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1041

:::

_core.cells : function_

The `cells` option lets you apply any other [configuration options](@/guides/configuration/configuration-options/configuration-options.md) to
individual grid elements (columns, rows, cells), based on any logic you implement.

The `cells` option overwrites all other options (including options set by [`columns`](@/api/options.md#columns) and [`cell`](@/api/options.md#cell)).

Handsontable merges the object that `cells` returns into the cell's meta. It doesn't replace the meta.
A key that the function returned before and doesn't return now keeps its last value.
For example, a cell stays `readOnly: true` after `cells` returns `{}`.
To avoid this, return the value for every key on every call (for example, `readOnly: false`).
Or, outside the `cells` function, call `removeCellMeta()`
with the cell's visual coordinates to remove the key. The key comes back if `cells` returns it again.
The meta resets in three cases:
In React, that happens when you pass `cells` as a new function.
`updateSettings({ data })` don't reset it.
- A row that scrolls more than one viewport out of view and back, unless it is the row of the selected cell.
Cells with meta you set with `setCellMeta()` or the `cell` option, and cells marked invalid, keep their meta.
Horizontal scrolling doesn't reset it.

`cells` takes the following parameters:

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
- [Setting options: Implementing custom logic](@/guides/configuration/configuration-options/configuration-options.md#implement-custom-logic)
- [Setting options: Setting row options](@/guides/configuration/configuration-options/configuration-options.md#set-row-options)
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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api checkedTemplate|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1093

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
represent a checked state is no longer valid. A value matches a checked checkbox when it equals the template
or reads the same ignoring letter case (`'yes'` and `'YES'` both match `'Yes'`).
Pair `checkedTemplate` with [`uncheckedTemplate`](@/api/options.md#uncheckedtemplate) to define both states explicitly.
:::

This option can be set at any level of the [cascading configuration](@/guides/configuration/configuration-options/configuration-options.md#cascading-configuration):
the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options), the [`columns`](@/api/options.md#columns) level, the [`cells`](@/api/options.md#cells) level, and the [`cell`](@/api/options.md#cell) level.

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api className|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1176

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

#### Where Handsontable adds the class names

The target depends on the level at which you set the option:

| Level                                | Container element | Cells                |
| ------------------------------------ | ----------------- | -------------------- |
| Grid                                 | Yes               | Every cell           |
| [`columns`](@/api/options.md#columns)                | No                | Cells of that column |
| [`cells`](@/api/options.md#cells) or [`cell`](@/api/options.md#cell) | No                | The matching cells   |

At the grid level, Handsontable adds the class names to two places. It adds them to the
container element – the element that holds the grid – and, through
[cascading configuration](@/guides/configuration/configuration-options/configuration-options.md#cascading-configuration),
to every cell. To add class names to the `<table>` element instead, use [`tableClassName`](@/api/options.md#tableclassname).

To style the container element alone, set `className` at the grid level and clear it at the
cell level:

```js
const hot = new Handsontable(container, {
  className: 'your-class-name',
  // the container element keeps `your-class-name`, the cells don't receive it
  cells() {
    return { className: '' };
  },
});
```

A `className` set at a lower level replaces the value from a higher level. It doesn't merge
with it. To keep a class name from a higher level, repeat it at the lower level.

#### Custom renderers

Handsontable adds these class names to a cell even when the cell uses a custom
[renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md) that calls no built-in
renderer. Handsontable runs `baseRenderer` after your renderer whenever your renderer didn't
run it. Before version 17.0.0, such a cell received no class names.

To apply different CSS class names on different levels, use Handsontable's [cascading configuration](@/guides/configuration/configuration-options/configuration-options.md#cascading-configuration).

Read more:
- [Setting options: Cascading configuration](@/guides/configuration/configuration-options/configuration-options.md#cascading-configuration)
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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api colHeaders|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1217

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

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>null</code>  
**Example**  
```js
// enable the default column headers
colHeaders: true,

// set your own column headers
colHeaders: ['One', 'Two', 'Three'],

// set your own column headers, using a function
colHeaders: function(physicalColumnIndex) {
  return `${physicalColumnIndex} + : AB`;
},
```


### colorScheme
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api colorScheme|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L8222

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

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api columnHeaderHeight|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1310

:::

_core.columnHeaderHeight : number | Array&lt;number&gt; | string | Array&lt;string&gt; | Array&lt;(number\|string)&gt;_

The `columnHeaderHeight` option configures the height of column headers.

You can set the `columnHeaderHeight` option to one of the following:

| Setting  | Description                                                     |
| -------- | --------------------------------------------------------------- |
| A number | Set the same height for every column header                     |
| A string | Set the same height, written as a pixel size (`'25'`, `'25px'`)  |
| An array | Set different heights for individual column headers             |

The height is a number of pixels. A string that states a pixel size works too, either as a bare
number (`'25'`) or with the unit (`'25px'`), so a value coming from an attribute or a JSON
config still applies. Both forms may be mixed inside the array. A value that is not a pixel
size, such as `'50%'` or `'20em'`, is ignored and the default height is used instead.

A negative number is kept as it is, because numbers keep the behavior they had before this
option read strings at all. A negative string is rejected instead, so a typo cannot collapse
the header.

The height is the header's **border-box** height, so it includes the header's own top and
bottom borders. A column header carries a 1px border on each side, which makes
`columnHeaderHeight: 40` leave a 38px content box for the label. Before Handsontable 19.0 the
bottom border was dropped while the grid sat at the top of its scroll range and added back as
soon as it scrolled, so the same setting produced a 39px content box unscrolled and 38px
scrolled. The header keeps that border at every scroll position now, so the option resolves to
the same height wherever the grid is scrolled to.

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Example**  
```js
// set the same height for every column header
columnHeaderHeight: 25,

// set the same height, written as a pixel size
columnHeaderHeight: '25px',

// set different heights for individual column headers
columnHeaderHeight: [25, 30, 55],
```


### columns
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api columns|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1369

:::

_core.columns : Array&lt;object&gt; | function_

The `columns` option lets you apply any other [configuration options](@/guides/configuration/configuration-options/configuration-options.md) to individual columns (or ranges of columns).

You can set the `columns` option to one of the following:
- An array of objects (each object represents one column)
- A function that returns an array of objects

The `columns` option overwrites the [top-level grid options](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).

When you use `columns`, the [`startCols`](@/api/options.md#startcols), [`minCols`](@/api/options.md#mincols), and [`maxCols`](@/api/options.md#maxcols) options are ignored.

Read more:
- [Setting options: Setting column options](@/guides/configuration/configuration-options/configuration-options.md#set-column-options)
- [`startCols`](@/api/options.md#startcols)
- [`minCols`](@/api/options.md#mincols)
- [`maxCols`](@/api/options.md#maxcols)
- [`data`](@/api/options.md#data)

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api colWidths|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1594

:::

_core.colWidths : number | Array&lt;number&gt; | string | Array&lt;string&gt; | Array&lt;undefined&gt; | function_

The `colWidths` option sets columns' widths, in pixels.

The default column width is 50px. To change it, set the `colWidths` option to one of the following:

| Setting     | Description                                                                                          | Example                                                           |
| ----------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| A number    | Set the same width for every column                                                                  | `colWidths: 100`                                                  |
| A string    | Set the same width for every column                                                                  | `colWidths: '100px'`                                              |
| An array    | Set widths separately for each column,<br>by physical column index                                   | `colWidths: [100, 120, undefined]`                                |
| A function  | Set column widths dynamically,<br>on each render, by physical column index                           | `colWidths(physicalColumnIndex) { return physicalColumnIndex * 10; }` |
| `undefined` | Used by the [modifyColWidth](@/api/hooks.md#modifycolwidth) hook,<br>to detect column width changes. | `colWidths: undefined`                                            |
| `null`      | Same as `undefined`: no width is set,<br>so the [AutoColumnSize](@/api/autoColumnSize.md) plugin sizes the columns        | `colWidths: null`                                                 |

A `null` entry in the array and a `null` returned by the function also set no width: the
[modifyColWidth](@/api/hooks.md#modifycolwidth) hook receives `undefined` for that column. The
[AutoColumnSize](@/api/autoColumnSize.md) plugin stays off there, because any other `colWidths` value turns it off, so such a
column gets the default 50px width. A column `width: null` behaves like `undefined` and falls back to
`colWidths`.

The array and the function address a column by its physical index, so a width stays with its column
when the user moves the column. The physical index doesn't change when columns are moved
or hidden. When you insert or remove a column with `alter()`, each width of an array
`colWidths` stays with its column. A column added after the last one takes the next width in the array.
A column inserted between others has no width of its own, and neither has a column inserted after a column
the user moved to the end. The array itself is never changed:
`getSettings()` returns the array you passed. A function is called with the
physical index the column has now. Switching `colWidths` to or from an array, or passing a new array to
`updateSettings()`, clears the undo history, the way enabling a plugin does.
The [`rowHeights`](@/api/options.md#rowheights) option addresses rows by their physical index in the same way.

Setting `colWidths` even for a single column disables the [AutoColumnSize](@/api/autoColumnSize.md) plugin
for all columns. For this reason, if you use `colWidths`, we recommend you set a width for each one
of your columns. Otherwise, every column with an undefined width defaults back to 50px,
which may cut longer columns names.

A column resized by dragging keeps its width until the width is re-declared. Passing
`colWidths` to `updateSettings()` re-declares the widths and
discards the ones stored by the [ManualColumnResize](@/api/manualColumnResize.md) plugin. To keep the stored widths,
leave `colWidths` out of the call.

Passing [`manualColumnResize`](@/api/options.md#manualcolumnresize) as an array in the same call **replaces**
the stored widths with that array rather than keeping them.

These cases never discard the stored widths:

- A `colWidths` **function**. It states no fixed width, so it is left alone.
- A grid whose `manualColumnResize` option is already a non-empty array. The plugin replays
  that array, so the stored widths stay.
- The React, Angular and Vue wrappers, when the `colWidths` prop did not change. An unchanged
  prop is not forwarded, so re-applying the same value resets nothing.

In each case, call
[`ManualColumnResize#clearManualSizes()`](@/api/manualColumnResize.md#clearmanualsizes)
followed by `render()`.

Read more:
- [Column width](@/guides/columns/column-width/column-width.md)
- [Hooks: `modifyColWidth`](@/api/hooks.md#modifycolwidth)
- [`autoColumnSize`](@/api/options.md#autocolumnsize)

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Example**  
```js
// set every column's width to 100px
colWidths: 100,

// set every column's width to 100px
colWidths: '100px',

// set the first (by physical index) column's width to 100
// set the second (by physical index) column's width to 120
// set the third (by physical index) column's width to `undefined`, so that it defaults to 50px
// set any other column's width to the default 50px (note that longer cell values and column names can get cut)
colWidths: [100, 120, undefined],

// set each column's width individually, using a function
colWidths(physicalColumnIndex) {
  return physicalColumnIndex * 10;
},
```


### commentedCellClassName
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api commentedCellClassName|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1625

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api copyable|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1804

:::

_core.copyable : boolean_

The `copyable` option determines whether a cell's value can be copied to the clipboard or not.

You can set the `copyable` option to one of the following:

| Setting                                                                                                        | Description                                                                                                            |
| -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `true` (default)                                                                                               | - On pressing <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**C**</kbd>, add the cell's value to the clipboard         |
| `false`<br>(default for the [`password`](@/guides/cell-types/password-cell-type/password-cell-type.md) [cell type](@/api/options.md#type))        | - On pressing <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**C**</kbd>, add an empty string (`""`) to the clipboard   |

With `copyable: false`, the cell's value doesn't move through other user actions either: cutting the cell
clears it and adds an empty string to the clipboard, and dragging the fill handle from it fills the target
cells with empty strings. Data access methods, such as `getDataAtCell()`, still return
the real value, while copy-related methods, such as `getCopyableData()`, return an empty string.
The `copyable` option is not a security measure: formulas and the [`ExportFile`](@/api/exportFile.md) plugin still read the real value.
See [Password cell type: Copy, cut, paste, and autofill](@/guides/cell-types/password-cell-type/password-cell-type.md#copy-cut-paste-and-autofill).

Read more:
- [Clipboard](@/guides/cell-features/clipboard/clipboard.md)
- [Setting options: Cascading configuration](@/guides/configuration/configuration-options/configuration-options.md#cascading-configuration)
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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api currentColClassName|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1910

:::

_core.currentColClassName : string_

The `currentColClassName` option lets you add a CSS class name
to each cell of the currently-visible, currently-selected columns.

With nested or grouped column headers (the `nestedHeaders` plugin), the class name reaches
every header level above the selected column, not only the leaf level.

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

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Example**  
```js
// add a `your-class-name` CSS class name
// to each cell of the currently-visible, currently-selected columns
currentColClassName: 'your-class-name',
```


### currentHeaderClassName
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api currentHeaderClassName|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1941

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

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>"ht__highlight"</code>  
**Example**  
```js
// add an `ht__highlight` CSS class name
// to every currently-visible, currently-selected header
currentHeaderClassName: 'ht__highlight',
```


### currentRowClassName
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api currentRowClassName|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1976

:::

_core.currentRowClassName : string_

The `currentRowClassName` option lets you add a CSS class name
to each cell of the currently-visible, currently-selected rows.

With multiple row-header columns (added through the `afterGetRowHeaderRenderers` hook), the
class name reaches every row-header column, not only the first one.

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

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Example**  
```js
// add a `your-class-name` CSS class name
// to each cell of the currently-visible, currently-selected rows
currentRowClassName: 'your-class-name',
```


### data
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span></p>

::: ask-about-api data|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2194

:::

_core.data : Array&lt;Array&gt; | Array&lt;object&gt;_

The `data` option sets the initial [data](@/guides/getting-started/binding-to-data/binding-to-data.md) of your Handsontable instance.

Handsontable's data is bound to your source data by reference (i.e. when you edit Handsontable's data, your source data alters as well).

You can set the `data` option:
- Either to an [array of arrays](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-arrays).
- Or to an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects).

If you don't set the `data` option (or set it to `null`), Handsontable renders as an empty 5x5 grid by default.

Unless you set the [`columns`](@/api/options.md#columns) or [`dataSchema`](@/api/options.md#dataschema) option, Handsontable reads the number
of columns from the first row of `data`. If that row has no fields (for example, `[{}]`, `[null]`, or
`[[], [1, 2]]`), the grid displays rows with no cells, and values in later rows are not displayed. For such data,
Handsontable logs a console warning. Two cases log no warning: an empty `data: []`, and an array of empty arrays
(`[[]]`) while [`allowInsertColumn`](@/api/options.md#allowinsertcolumn) is on, because writing to it creates the columns. The check
runs when the data loads, so set `columns` together with `data`. A `columns` option that arrives in a later
update (for example, from a column component rendered after the grid) can come too late to stop the warning.

When used inside the [`columns`](@/api/options.md#columns) option, `data` has a different meaning: it acts as a property name
(or a dot-separated path) pointing to the field in each data row object that this column reads from and writes to.
In this context, `data` is not the full dataset but a column accessor string.

Read more:
- [Binding to data](@/guides/getting-started/binding-to-data/binding-to-data.md)
- [`dataSchema`](@/api/options.md#dataschema)
- [`startRows`](@/api/options.md#startrows)
- [`startCols`](@/api/options.md#startcols)

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api dataDotNotation|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2307

:::

_core.dataDotNotation : boolean_

If `true`, Handsontable will interpret the dots in the columns mapping as a nested object path. If your dataset contains
the dots in the object keys and you don't want Handsontable to interpret them as a nested object path, set this option to `false`.

The option only works when defined in the global table settings.

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api dataProvider|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2266

:::

_core.dataProvider : object | null_

When set, the table loads data from an async provider (e.g. a REST API) instead of a static `data` array.
Use the **object** form with every key defined: **`rowId`**, **`fetchRows`**, **`onRowsCreate`**, **`onRowsUpdate`**,
and **`onRowsRemove`**. All five are required on that object so paging, row identity, and create, update, and remove
map cleanly to your backend. Pair with **`pagination`** for server-side paging.
The optional **`refetchAfterCreate`** key (default `true`) controls whether a successful **`onRowsCreate`** is followed by a
`fetchRows` refetch of the current query. Set it to `false` when your `onRowsCreate` applies the server response to the
grid itself, for example to keep a new row on the current page while the grid is sorted. With **`pagination`** enabled,
a skipped refetch leaves the row total and the page count stale until the next `fetchRows` call, so reconcile them yourself.
Valid cell edits apply at once; if **`onRowsUpdate`** fails or **`beforeRowsMutation`** blocks the update, affected cells roll back.

A string **`rowId`** is read the same way as the [`rowId`](@/api/options.md#rowid) option: a property named exactly as the string
wins, dots included, and otherwise the dots read a nested property. **`rowId`** can also be a function that
receives the source row and returns its id. Keep that function as a stable reference: a new function passed
on each `updateSettings()` call counts as a new key and fires
[`afterRowIdsReset`](@/api/hooks.md#afterrowidsreset).

Set it to `null` to turn server-backed loading off again, for example through
`updateSettings()`.

Passing another `dataProvider` object through `updateSettings()` reloads the
rows. Passing the same object again keeps the rows and sends no request, unless the same call also passes
[`pagination`](@/api/options.md#pagination), [`columnSorting`](@/api/options.md#columnsorting), [`filters`](@/api/options.md#filters), or
[`columns`](@/api/options.md#columns): those reset the page, sort, or filters, so the rows are fetched again. The React and
Angular wrappers pass only the settings that changed, so in React keep the object stable (create it with
`useMemo`). A change made inside the same object is used by the next request; to load the rows right away,
call [`fetchData()`](@/api/dataProvider.md#fetchdata).

While the [`sheetsBar`](@/api/options.md#sheetsbar) option is enabled, a grid-level `dataProvider` is ignored (with one console
warning), and the grid gets it back when you turn the sheets bar off. Declare `dataProvider` in the `settings` of
each sheet that loads from a server instead, and change it with
[`updateSheetSettings()`](@/api/sheetsBar.md#updatesheetsettings). If you keep a grid-level `dataProvider`
anyway, pass the same object every time: a framework wrapper that builds a new object on every render
re-configures the sheet you see.

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
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
  // Optional: set to `false` to skip the automatic refetch after a successful create (default `true`).
  // refetchAfterCreate: false,
},
```


### dataSchema
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api dataSchema|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2355

:::

_core.dataSchema : object | function_

When the [`data`](@/api/options.md#data) option is set to an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects)
(or is empty), the `dataSchema` option defines the structure of new rows.

Using the `dataSchema` option, you can start out with an empty grid.

You can set the `dataSchema` option to one of the following:
- An object
- A function

If you don't set the [`columns`](@/api/options.md#columns) option, `dataSchema` also defines the columns of the grid.
When you change it with `updateSettings()` and the columns it defines change,
Handsontable resets the column and row index state, as it does for a new [`columns`](@/api/options.md#columns) value.
Sorting, filtering, and columns that users moved, hid, or resized start over. Options you declare in your
settings apply again. A change that only affects the default values of new rows resets nothing.
A new [`data`](@/api/options.md#data) value alone doesn't reset the index state.

Read more:
- [Binding to data: Array of objects with custom data schema](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects-with-custom-data-schema)
- [Binding to data: Function data source and schema](@/guides/getting-started/binding-to-data/binding-to-data.md#function-data-source-and-schema)
- [`data`](@/api/options.md#data)

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api dateFormat|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2486

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api dateTimeFormat|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2596

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api defaultDate|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2639

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

This option can be set at any level of the [cascading configuration](@/guides/configuration/configuration-options/configuration-options.md#cascading-configuration):
the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options), the [`columns`](@/api/options.md#columns) level, the [`cells`](@/api/options.md#cells) level, and the [`cell`](@/api/options.md#cell) level.

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api density|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L8274

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

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api disableVisualSelection|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2695

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

The current-row and current-column indicators
([`currentRowClassName`](@/api/options.md#currentrowclassname) and [`currentColClassName`](@/api/options.md#currentcolclassname))
are selection feedback rather than header selection, so `'header'` does not remove them. They are
hidden only when every selection type is off – `true`, or an array holding all of `'current'`,
`'area'`, and `'header'`. The classes also mark the current row's and column's header cell, as
they do with `false`, so `'header'` still leaves your `currentRowClassName` and
`currentColClassName` on those header cells.

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api editor|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3118

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
| `'formula'`         | The [`FormulaBuilder`](@/api/formulaBuilder.md) formula editor (a bare textarea while that plugin is off) |
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

A [`checkbox`](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md) cell with no editor
is the exception: `Delete` and `Backspace` leave it unchanged.

Setting the `editor` option to `true` names no editor. It keeps the editor that the cell's
[`type`](@/api/options.md#type) provides, or the editor inherited from a higher configuration level. Unlike leaving
the option out, it also asks for the [`type`](@/api/options.md#type)'s editor when `editor: false` is set at a
higher configuration level, so the cell stays editable (see below).

An `editor` of `false` is not overridden by a [`type`](@/api/options.md#type) set at a lower configuration
level. A [`type`](@/api/options.md#type) normally supplies its own editor, but it never re-enables editing
that you disabled higher up, so `editor: false` for the whole grid keeps a typed column
non-editable. Everything else the [`type`](@/api/options.md#type) provides still applies, so such a column
keeps its renderer and its validator:

```js
// no cell in this grid can be edited, and the second column still
// renders and validates as numeric
editor: false,
columns: [
  { type: 'text' },
  { type: 'numeric' }
]
```

To let one column opt back in, give it an `editor` of its own, at the same configuration
level as its [`type`](@/api/options.md#type):

```js
editor: false,
columns: [
  { type: 'text' },
  // editable, despite the grid-level `editor: false`
  { type: 'numeric', editor: 'numeric' }
]
```

To keep the editor that the column's [`type`](@/api/options.md#type) provides, without naming it, set
`editor: true` instead, for example `{ type: 'numeric', editor: true }`. A single cell opts back in
the same way, through the [`cell`](@/api/options.md#cell) option or
`setCellMeta()`, also when its [`type`](@/api/options.md#type) comes from its column.

A custom cell type that declares `editor: false` supplies a default, not a setting of yours.
If you set such a [`type`](@/api/options.md#type) on the whole grid, a column with a `type` of its own still
gets that type's editor.

A named editor behaves differently: a [`type`](@/api/options.md#type) set at a lower configuration level
does override it, because both name an editor and the more specific level wins.

Only `false` is kept this way. An `editor` of `null` set at a higher configuration level is
replaced by the editor of a lower-level [`type`](@/api/options.md#type), like a named editor.

One limitation applies when you switch editing off at runtime. A column's [`type`](@/api/options.md#type)
writes its editor onto that column when the column is built, so an
`updateSettings()` call that passes `editor: false` without
also passing [`columns`](@/api/options.md#columns) does not reach a column that declares a
[`type`](@/api/options.md#type). Pass [`columns`](@/api/options.md#columns) in the same call to rebuild those columns:

```js
// the numeric column stays editable
hot.updateSettings({ editor: false });

// the numeric column becomes non-editable too
hot.updateSettings({ editor: false, columns: [{ type: 'text' }, { type: 'numeric' }] });
```

To set the [`editor`](@/api/options.md#editor), [`renderer`](@/api/options.md#renderer), and [`validator`](@/api/options.md#validator)
options all at once, use the [`type`](@/api/options.md#type) option.

Read more:
- [Keyboard shortcuts](@/guides/navigation/keyboard-shortcuts/keyboard-shortcuts.md)
- [Cell editor](@/guides/cell-functions/cell-editor/cell-editor.md)
- [Cell type](@/guides/cell-types/cell-type/cell-type.md)
- [Setting options: Cascading configuration](@/guides/configuration/configuration-options/configuration-options.md#cascading-configuration)
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


### emptyValue
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api emptyValue|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L8928

:::

_core.emptyValue : \*_

The `emptyValue` option sets the value stored when a cell ends up empty.

A cell can be emptied in several ways, and by default they do not agree on what to store. The
<kbd>**Delete**</kbd> key, the `setDataAtCell()` method, filling
a blank cell across a range, and merging cells over data all store `null`. Clearing the
[cell editor](@/guides/cell-functions/cell-editor/cell-editor.md) and confirming, or pasting a
blank cell, store an empty string (`''`). Set `emptyValue` to `null` to make every one of those
paths agree on `null`.

The mapping is one-way: it rewrites an empty string to the value you set, and never the other
way round. Paths that already store `null` are untouched.

| Setting                 | Description                                                     |
| ----------------------- | --------------------------------------------------------------- |
| `''` (default)          | Leave an emptied cell as the empty string the write produced    |
| `null`                  | Store `null` instead                                            |
| `undefined`             | Same as the default — the option counts as unset                |
| Any other value         | Store that value instead                                        |

Set `emptyValue: null` when the cell's value leaves the grid — saved to a server, written to a
database, or read by a formula. An empty string in a `numeric`, `date` or `time` column is a
string where a number, a date or nothing at all is expected, and `''` is not the same value as
`NULL` to a database. It also matches how spreadsheets tell a blank cell from an empty string:
`ISBLANK()` is `true` for `null` and `false` for `''`.

The option applies to every **write** path: the editor, a paste, a fill,
`setDataAtCell()` and
`setSourceDataAtCell()`. Writing `''` through either API
with `emptyValue: null` set stores `null`.

::: tip
Loading data is not a write. `loadData()`,
`updateData()`, the initial [`data`](@/api/options.md#data) and
`updateSettings({ data })` all bypass this option, so an `''` already present in the data you
load stays an `''`. A grid can therefore hold both `''` and `null` at once. Normalize the data
before you load it if that matters to you.

Undo and redo are exempt too: they restore what the cell held before, verbatim.
:::

A [`valueSetter`](@/api/options.md#valuesetter) runs first, so a custom setter that returns `''` still means
"empty" and is mapped as well.

A column whose configuration already gives `''` a meaning keeps it. In a `checkbox` column, an
`''` used as [`checkedTemplate`](@/api/options.md#checkedtemplate) or [`uncheckedTemplate`](@/api/options.md#uncheckedtemplate)
is one of the two states the column defines, not an empty cell. In an `autocomplete` or
`dropdown` column, an `''` listed in [`source`](@/api/options.md#source) is an option you can pick. Both keep
storing `''`.

::: tip
Only an array [`source`](@/api/options.md#source) is checked this way. A function `source` answers through a
callback, and the value is stored before that callback runs, so a blank option it returns goes
unnoticed and `emptyValue` applies to the column like any other.
:::

::: tip
Pasting from outside the grid cannot preserve this distinction. A clipboard holding text or HTML
has no way to mark a cell as `null`, so an empty pasted cell follows the `emptyValue` setting
like any other emptied cell.
:::

This option can be set at any level of the [cascading configuration](@/guides/configuration/configuration-options/configuration-options.md#cascading-configuration):
the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options), the [`columns`](@/api/options.md#columns) level, the [`cells`](@/api/options.md#cells) level, and the [`cell`](@/api/options.md#cell) level.

**Default**: <code>&#x27;&#x27;</code>  
**Since**: 18.3.0  
**Example**  
```js
// store `null` in every emptied cell of the grid
emptyValue: null,

// or per column: keep text columns storing `''`, and store `null` in the typed ones
columns: [
  { data: 'name' },
  { data: 'amount', type: 'numeric', emptyValue: null },
  { data: 'due', type: 'date', emptyValue: null }
]
```


### enterBeginsEditing
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api enterBeginsEditing|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3255

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

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api enterCommits|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3278

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api enterMoves|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3321

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

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api fillHandle|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3482

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

The `autoInsertRow` default above applies once you set `fillHandle` yourself, to any of the values in the first
table. Leave `fillHandle` unset and the grid does not append rows when you drag the fill handle below the last
row. Setting `direction` to `'horizontal'` also turns `autoInsertRow` off.

Rows appended this way bypass [`allowInsertRow`](@/api/options.md#allowinsertrow): only `autoInsertRow` governs them.

The fill handle is shown only when the selection is a single range. A selection of several separate ranges
(for example, made with <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+click) has no fill handle.

Read more:
- [AutoFill values](@/guides/cell-features/autofill-values/autofill-values.md)

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>{ autoInsertRow: false }</code>  
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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api filter|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3519

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api filteringCaseSensitive|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3615

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api filterSelectedItems|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3780

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
```


### fixedColumnsEnd
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api fixedColumnsEnd|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3836

:::

_core.fixedColumnsEnd : number_

The `fixedColumnsEnd` option sets the number of [frozen columns](@/guides/columns/column-freezing/column-freezing.md) at the end edge of the grid.

If your grid's [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is LTR (default), the end edge is the right-hand edge.
If your layout direction is RTL, the end edge is the left-hand edge.

The frozen columns are the last columns of the grid. They stay in place while the rest of the grid scrolls horizontally.

Hidden columns count toward `fixedColumnsEnd`. The frozen area is always the last `fixedColumnsEnd` columns,
hidden ones included. A trimmed column gives up its slot.
See [Hidden columns](@/guides/columns/column-freezing/column-freezing.md#hidden-columns).

Use `fixedColumnsEnd` together with [`fixedColumnsStart`](@/api/options.md#fixedcolumnsstart), [`fixedRowsTop`](@/api/options.md#fixedrowstop),
and [`fixedRowsBottom`](@/api/options.md#fixedrowsbottom) to freeze all four edges.

::: tip
Freeze only as many columns as fit within the grid's width. By default, Handsontable draws frozen columns in full. To draw only the ones that fit, use [`limitFixedToViewport`](@/api/options.md#limitfixedtoviewport).
If they need more space than the grid has, they cover the whole grid. You can then no longer scroll
the remaining columns into view.
:::

::: tip
While `fixedColumnsEnd` is above `0`, Handsontable doesn't add empty columns for [`minSpareCols`](@/api/options.md#minsparecols)
or [`minCols`](@/api/options.md#mincols). A column added after the last end column would take over the frozen position
and unfreeze the column that holds your data.
:::

::: tip
If [`fixedColumnsStart`](@/api/options.md#fixedcolumnsstart) and `fixedColumnsEnd` together exceed the number of columns,
`fixedColumnsStart` takes priority and Handsontable reduces the end columns to the columns that remain.
:::

Read more:
- [Column freezing](@/guides/columns/column-freezing/column-freezing.md)
- [Layout direction](@/guides/internationalization/layout-direction/layout-direction.md)
- [`fixedColumnsStart`](@/api/options.md#fixedcolumnsstart)
- [`fixedRowsBottom`](@/api/options.md#fixedrowsbottom)
- [`layoutDirection`](@/api/options.md#layoutdirection)

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>0</code>  
**Since**: 19.0.0  
**Example**  
```js
// freeze the last 2 columns at the end edge of the grid
// (the right-hand edge in LTR, the left-hand edge in RTL)
fixedColumnsEnd: 2,
```


### fixedColumnsLeft
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api fixedColumnsLeft|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3865

:::

_core.fixedColumnsLeft : number_

`fixedColumnsLeft` is a legacy option.

If your grid's [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is LTR (default), `fixedColumnsLeft` acts like the [`fixedColumnsStart`](@/api/options.md#fixedcolumnsstart) option.

If your grid's [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is RTL, using `fixedColumnsLeft` throws an error.

Don't set `fixedColumnsLeft` and [`fixedColumnsStart`](@/api/options.md#fixedcolumnsstart) in one settings object: that throws an error. When you set them in separate `updateSettings()` calls, the later value applies.

Use [`fixedColumnsStart`](@/api/options.md#fixedcolumnsstart), which works in any layout direction.

Read more:
- [`fixedColumnsStart`](@/api/options.md#fixedcolumnsstart)

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>0</code>  
**Example**  
```js
// freeze the first 3 columns from the left
fixedColumnsLeft: 3,
```


### fixedColumnsStart
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api fixedColumnsStart|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3917

:::

_core.fixedColumnsStart : number_

If your grid's [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is LTR (default), the `fixedColumnsStart` option sets the number of [frozen columns](@/guides/columns/column-freezing/column-freezing.md) at the left-hand edge of the grid.

If your grid's [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is RTL, the `fixedColumnsStart` option sets the number of [frozen columns](@/guides/columns/column-freezing/column-freezing.md) at the right-hand edge of the grid.

Hidden columns count toward `fixedColumnsStart`. With `fixedColumnsStart: 3` and column 1 hidden by
[`HiddenColumns`](@/api/hiddenColumns.md), the grid freezes 2 visible columns.
See [Hidden columns](@/guides/columns/column-freezing/column-freezing.md#hidden-columns).

::: tip
Freeze only as many columns as fit within the grid's width. By default, Handsontable draws frozen columns in full. To draw only the ones that fit, use [`limitFixedToViewport`](@/api/options.md#limitfixedtoviewport).
If they need more space than the grid has, they cover the whole grid. You can then no longer scroll
the remaining columns into view.
:::

Read more:
- [Column freezing](@/guides/columns/column-freezing/column-freezing.md)
- [Layout direction](@/guides/internationalization/layout-direction/layout-direction.md)
- [`fixedColumnsLeft`](@/api/options.md#fixedcolumnsleft)
- [`fixedColumnsEnd`](@/api/options.md#fixedcolumnsend)
- [`layoutDirection`](@/api/options.md#layoutdirection)

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api fixedRowsBottom|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3956

:::

_core.fixedRowsBottom : number_

The `fixedRowsBottom` option sets the number of [frozen rows](@/guides/rows/row-freezing/row-freezing.md)
at the bottom of the grid.

Rows hidden with [`HiddenRows`](@/api/hiddenRows.md) count toward `fixedRowsBottom`. The frozen area is
always the last `fixedRowsBottom` rows, hidden ones included. A trimmed or filtered row gives up its slot.
See [Hidden rows](@/guides/rows/row-freezing/row-freezing.md#hidden-rows).

::: tip
For the bottom frozen rows area to appear with a scroll separator, you must also set the [`height`](@/api/options.md#height) option
in Handsontable's configuration. If the grid expands to fill its parent container without a defined height,
no vertical scrollbar is created and the fixed bottom rows area is not displayed.
:::

::: tip
Freeze only as many rows as fit within the grid's height. By default, Handsontable draws frozen rows in full. To draw only the ones that fit, use [`limitFixedToViewport`](@/api/options.md#limitfixedtoviewport).
If they need more space than the grid has, they cover the whole grid. You can then no longer scroll
the remaining rows into view.
:::

Read more:
- [Row freezing](@/guides/rows/row-freezing/row-freezing.md)
- [`height`](@/api/options.md#height)

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>0</code>  
**Example**  
```js
// freeze the bottom 3 rows
fixedRowsBottom: 3,
```


### fixedRowsTop
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api fixedRowsTop|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3994

:::

_core.fixedRowsTop : number_

The `fixedRowsTop` option sets the number of [frozen rows](@/guides/rows/row-freezing/row-freezing.md) at the top of the grid.

Hidden rows count toward `fixedRowsTop`. With `fixedRowsTop: 3` and row 1 hidden by
[`HiddenRows`](@/api/hiddenRows.md), the grid freezes 2 visible rows.
See [Hidden rows](@/guides/rows/row-freezing/row-freezing.md#hidden-rows).

::: tip
For the top frozen rows area to be visually separated from the scrollable body, you must also set the [`height`](@/api/options.md#height) option
in Handsontable's configuration. If the grid expands to fill its parent container without a defined height,
no vertical scrollbar is created and the fixed top rows area is not displayed.
:::

::: tip
Freeze only as many rows as fit within the grid's height. By default, Handsontable draws frozen rows in full. To draw only the ones that fit, use [`limitFixedToViewport`](@/api/options.md#limitfixedtoviewport).
If they need more space than the grid has, they cover the whole grid. You can then no longer scroll
the remaining rows into view.
:::

Read more:
- [Row freezing](@/guides/rows/row-freezing/row-freezing.md)
- [`height`](@/api/options.md#height)

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>0</code>  
**Example**  
```js
// freeze the top 3 rows
fixedRowsTop: 3,
```


### fragmentSelection
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api fragmentSelection|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4238

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

A text selection cannot span a frozen area and the rest of the grid, because the two are
rendered as separate tables. Selecting text inside a frozen row or column works, but as soon
as you drag the pointer out of the area you started in, the selection is cleared.

Headers are not selectable, whether or not they are frozen.

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api hashLength|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4261

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api hashRevealDelay|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4286

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api hashSymbol|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4308

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span></p>

::: ask-about-api headerClassName|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4333

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api height|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4454

:::

_core.height : number | 'auto' | string | function_

The `height` option configures the height of your grid.

You can set the `height` option to one of the following:

| Setting                                                                    | Example                              |
| -------------------------------------------------------------------------- | ------------------------------------ |
| A number of pixels                                                         | `height: 500`                        |
| A string with a number of pixels                                           | `height: '500'`, `height: '500px'`   |
| A string with a [CSS unit](https://www.w3schools.com/cssref/css_units.asp) | `height: '50%'`, `height: '75vh'`    |
| `'auto'`                                                                   | `height: 'auto'`                     |
| A function that returns a valid number or string                           | `height() { return 500; }`           |

Any other value the browser can read as a CSS length or expression (`'20em'`,
`'calc(100% - 40px)'`, `'var(--grid-height)'`) is passed through as written. A value the
browser cannot read as a size (`'abc'`, `-100`, `true`) is ignored, and so are these CSS
keywords: `'inherit'`, `'initial'`, `'unset'`, `'revert'`, `'revert-layer'`, `'none'`, and
`'normal'`, which do not set a size; `'min-content'`, `'max-content'`, and `'fit-content'`,
which size the grid to its full content, so it cannot scroll inside its box; and `'stretch'`,
`'-webkit-fill-available'`, and `'-moz-available'`, which fill the container but read as a
fixed size. An ignored value leaves the grid's height as it was, and a warning is printed once
per grid and value.

A number or a CSS length sizes the grid's box. Handsontable writes
`height: <value>; overflow: clip;` as inline styles on the root element, and the grid
scrolls its rows inside that box. An `overflow-x` or `overflow-y` you set yourself on the
root element is left alone, on that axis, and clips the grid in its place.

#### How `'auto'` differs from leaving `height` unset

When you set `height: 'auto'`, Handsontable writes `height: auto` as an inline style on the
root element, and nothing else. The grid behaves like a plain block element: it grows to fit
its rows, the nearest scrolling ancestor or the page scrolls it, and off-screen rows stay
virtualized. The inline value overrides a `height` a stylesheet sets on the root element.

When you leave `height` unset, Handsontable does not touch the root element's inline
styles. Sizing is governed by your CSS, and the nearest ancestor with `overflow: auto`
or `overflow: hidden` becomes the scroll parent. If no such ancestor exists, the window
scrolls. See the [Grid size](@/guides/getting-started/grid-size/grid-size.md) guide for
details.

Passing `null` through `updateSettings()` restores the root
element's initial inline height and the overflow that came with it. A `width` set through
the option is left in place.

::: tip
Inside a parent with a fixed height and `overflow: auto`, a grid with `height: 'auto'` fills
the parent and scrolls inside it rather than growing past it.
:::

Read more:
- [Grid size](@/guides/getting-started/grid-size/grid-size.md)

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api imeFastEdit|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4619

:::

_core.imeFastEdit : boolean_

The `imeFastEdit` option allows using the "fast edit" feature for the IME users. It's disabled by default
because of its incompatibility with some of the accessibility features.

Enabling this option can make a negative impact on how some screen readers handle reading the table cells.

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Since**: 14.0.0  


### initialState
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api initialState|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4575

:::

_core.initialState : object | undefined_

The `initialState` option configures the grid's initial state.
This object accepts any grid configuration option. In case of conflicts between
`initialState` and table settings, the table settings take precedence.
Note: The `initialState` option is ignored when passed to the
`updateSettings()` method.

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api injectCoreCss|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L8314

:::

_core.injectCoreCss : boolean_

The `injectCoreCss` option controls whether Handsontable injects its core CSS into the document.

You can set the `injectCoreCss` option to one of the following:

| Setting            | Description                                                                                                      |
| ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `true` (default)   | Inject core styles into the document head                                                                        |
| `false`            | Do not inject core styles (use when you load CSS yourself, e.g. `import 'handsontable/styles/handsontable.css'`) |

Handsontable reads this option once, when it creates the grid. Changing it with
`updateSettings()` has no effect.

Grids that Handsontable builds inside a grid follow the grid's setting. These include the lists of the
`autocomplete`, `dropdown`, and `handsontable` editors, the context menu, the dropdown menu, and the
[`Filters`](@/api/filters.md) menus. With `false`, none of them injects the core styles. A menu that renders
into another document through the `uiContainer` option injects them there only when the grid injects them.

Read more:
- [Themes](@/guides/styling/themes/themes.md)

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api invalidCellClassName|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4604

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api label|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4745

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api language|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4799

:::

_core.language : string_

The `language` option configures Handsontable's [language](@/guides/internationalization/language/language.md) settings.

This option controls the language used for all built-in UI strings, including context menu labels,
column sorting labels, validation messages, and other user-visible text. It does not affect the locale
used for number or date formatting - use the [`locale`](@/api/options.md#locale) option for that.

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
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
| `'sr-Latn-RS'`      | Serbian (Latin) - Serbia    |
| `'sr-SP'`           | Serbian (Latin) - Serbia (deprecated alias of `'sr-Latn-RS'`) |
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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api layout|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4874

:::

_core.layout : object_

The `layout` option configures the order of plugin UI elements within the user-orderable
wrapper slots rendered around the grid: `top` and `bottom`. Each slot takes an ordered array
of element keys (for example `'pagination'`). Keys you list are placed first in that order;
any remaining elements follow by their default weight. The grid and the overlays layer (the
modal layer, such as the dialog) are not orderable through this option. The license
notification is not orderable either; it always renders last in the `bottom` slot.

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api layoutDirection|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4848

:::

_core.layoutDirection : string_

The `layoutDirection` option configures whether Handsontable renders from the left to the right, or from the right to the left.

You can set the layout direction only at Handsontable's [initialization](@/guides/getting-started/installation/installation.md#initialize-handsontable). Any change of the `layoutDirection` option after the initialization (e.g. using the `updateSettings()` method) throws an error, even when you didn't set the option at initialization.

You can set the `layoutDirection` option only [for the entire grid](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
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
- [`fixedColumnsEnd`](@/api/options.md#fixedcolumnsend)
- [`customBorders`](@/api/options.md#customborders)

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api licenseKey|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4918

:::

_core.licenseKey : string_

The `licenseKey` option sets your Handsontable license key.

You can set the `licenseKey` option to one of the following:

| Setting                                                                                                 | Description                                                                                       |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| A string with your [commercial license key](@/guides/getting-started/license-key/license-key.md#commercial-license) | For [commercial use](@/guides/technical-specification/software-license/software-license.md#commercial-use)         |
| A string with your [entitlement license key](@/guides/getting-started/license-key/license-key.md#entitlement-license-keys) (plain-English text ending with a `[...]` block) | For trial, subscription, or perpetual use |

Since Handsontable 19.0, the `'non-commercial-and-evaluation'` key, and its second form
`'ht68e-1f2b7-47158-70b05-0842f'`, are not valid keys: they lock the grid, as any invalid key does.
See [Get a license key](@/guides/getting-started/license-key/license-key.md#get-a-license-key).

An entitlement license key can name one or more tiers. The grid turns on the features of those
tiers, and a plugin they do not include stays off: the console and the bar under the grid name it.
The plugin's option keeps the value you set, so passing a key whose tier includes the feature
through `updateSettings()` turns the plugin on. A key that names no tier turns on every feature. See
[Keys that name a tier](@/guides/getting-started/license-key/license-key.md#keys-that-name-a-tier).

Read more:
- [License key](@/guides/getting-started/license-key/license-key.md)

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Example**  
```js
// for commercial use (legacy 25-character format)
licenseKey: 'xxxxx-xxxxx-xxxxx-xxxxx-xxxxx', // your commercial license key

// for an entitlement license key (trial, subscription, or perpetual),
// pass the whole key string exactly as you received it – the key
// protects its text too, so the `[...]` block on its own is not a valid key;
// the text contains quotes, so use a template literal
licenseKey: `This is a Handsontable license key for Acme Corp, ... for the "Acme Portal" project. ... [eyJwcm9kdWN0cyI6...3a4f8361]`,
```


### limitFixedToViewport
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api limitFixedToViewport|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4963

:::

_core.limitFixedToViewport : boolean_

The `limitFixedToViewport` option keeps the [frozen rows and columns](@/guides/columns/column-freezing/column-freezing.md)
from growing larger than the space the grid has.

By default, Handsontable draws the frozen area in full. If the frozen rows and columns need more space than
the grid has, they cover the whole grid, and you can no longer scroll the rest of it into view.

When you set `limitFixedToViewport` to `true`, Handsontable draws only as many frozen columns and rows as fit,
and keeps a strip of the grid scrollable. The option changes what is drawn, not what you configured:
[`fixedColumnsEnd`](@/api/options.md#fixedcolumnsend), [`fixedRowsTop`](@/api/options.md#fixedrowstop), and [`fixedRowsBottom`](@/api/options.md#fixedrowsbottom).
- The count is measured again when the grid is resized, so the frozen area returns when the grid grows.
- A strip of at least 40 px stays scrollable on each axis.
- The start columns have priority over the end columns, and the top rows have priority over the bottom rows.
When the start columns or top rows fill the grid, the end columns or bottom rows are not drawn as frozen at all.
- When a user changes the frozen area with the [`FreezeBar`](@/api/freezeBar.md) plugin, the new count replaces the
configured one, and the frozen area no longer returns when the grid grows.
- When one more frozen column would not fit, [`freezeColumn()`](@/api/manualColumnFreeze.md#freezecolumn) does
nothing, and its `afterColumnFreeze` hook reports that the freeze was not performed.

Handsontable measures the frozen area while it renders. When the first measurement was off (a row that was never
drawn, or a scrollbar that appeared), it draws once more, so [`beforeViewRender`](@/api/hooks.md#beforeviewrender) and
[`afterViewRender`](@/api/hooks.md#afterviewrender) can run twice for one render. A change that makes a frozen row
taller can cost that extra draw each time.

Read more:
- [Column freezing](@/guides/columns/column-freezing/column-freezing.md#frozen-area-size-limit)
- [Row freezing](@/guides/rows/row-freezing/row-freezing.md#frozen-area-size-limit)

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>false</code>  
**Since**: 19.0.0  
**Example**  
```js
// draw only the frozen columns and rows that fit the grid
limitFixedToViewport: true,
```


### locale
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api locale|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4999

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api maxCols|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5360

:::

_core.maxCols : number_

The `maxCols` option sets a maximum number of columns.

The `maxCols` option is used:
- At initialization: if the `maxCols` value is lower than the initial number of columns,
Handsontable trims columns from the right.
- At runtime: for example, when inserting columns.

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>Infinity</code>  
**Example**  
```js
// set the maximum number of columns to 300
maxCols: 300,
```


### maxLength
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api maxLength|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5435

:::

_core.maxLength : number_

The `maxLength` option sets the maximum number of characters that a cell can hold.

The limit counts the characters a reader sees, in the same way as the length limit of a sheet name
in the [`SheetsBar`](@/api/sheetsBar.md) plugin. A flag, an emoji with a skin tone, and a letter
with a combining accent each count as one character.

Handsontable enforces the limit in two places:
- In the cell editor. The [`text`](@/guides/cell-types/text-cell-type/text-cell-type.md) editor, and any custom
editor that extends it, stops the user from typing or pasting more characters than the limit allows.
The `autocomplete`, `dropdown`, and `handsontable` editors cap what the user types in the same way, but
the user can still pick an option that is longer than the limit, and the validator then marks it
as invalid. The built-in editors of the other cell types, such as `numeric`, `date`, and `password`,
don't limit input.
- In the [cell validator](@/guides/cell-functions/cell-validator/cell-validator.md), which marks a
value that is too long as invalid. Use [`allowInvalid`](@/api/options.md#allowinvalid) to decide whether the grid keeps
such a value. The validator checks the values that you type, paste into the grid, or write with
`setDataAtCell()`, and the values that
`validateCells()` checks. It doesn't check the values that you load with
`loadData()`, `updateData()`, or
`setSourceDataAtCell()`, or that a data provider fetches. Such a value
stays unmarked until you call `validateCells()`.

If a cell also has a [`validator`](@/api/options.md#validator), a value must pass both checks. The length check
runs first. Setting `validator` to `false` turns off the validator, but not the length check.

Keep these points in mind:
- Handsontable checks string values only. It doesn't check a value that is stored as a number, such as
the digits typed into a `numeric` cell, or as any other non-string type.
- The validator checks every string value in a cell that has a limit, whatever the cell type is. If you
set `maxLength` at the grid level, it also applies to the text of `date`, `time`, `dropdown`, and
`autocomplete` cells, so a date such as `'2026-10-02'` is invalid with `maxLength: 8`. Set the option on
the columns that hold free text instead.
- A cell that has a limit validates every write, as any cell with a validator does. Validation is
asynchronous, so `setDataAtCell()` applies a value after the validation
finishes, and `getDataAtCell()` returns the previous value until then. Use the
[`afterChange`](@/api/hooks.md#afterchange) hook to react to the new value.
- The editor and the validator both count the value after [`trimWhitespace`](@/api/options.md#trimwhitespace) is
applied, so the leading and trailing spaces of a pasted text don't count.
- With the [`Formulas`](@/api/formulas.md) plugin, the editor counts the formula that the user types,
but the validator counts the calculated result. With `maxLength: 5`, the editor cuts `=SUM(A1:A10)`
to `=SUM(`, although the result `55` fits.
- If your app already uses `maxLength` as a custom cell meta key, for example to feed your own validator
or editor, the built-in check and the editor limit now apply to those cells too.

By default, the number of characters is not limited.

Read more:
- [Text cell type](@/guides/cell-types/text-cell-type/text-cell-type.md)
- [Cell validator](@/guides/cell-functions/cell-validator/cell-validator.md)
- [`allowInvalid`](@/api/options.md#allowinvalid)
- [`validator`](@/api/options.md#validator)

**Default**: <code>Infinity</code>  
**Since**: 19.0.0  
**Example**  
```js
// limit the free-text columns, and leave the others unlimited
columns: [
  { data: 'code', maxLength: 10 },
  { data: 'comment', maxLength: 140, allowInvalid: false },
  { data: 'quantity', type: 'numeric' },
],

// let a single cell hold more than its column allows
cell: [
  { row: 0, col: 0, maxLength: 20 },
],
```


### maxRows
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api maxRows|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5458

:::

_core.maxRows : number_

The `maxRows` option sets a maximum number of rows.

The `maxRows` option is used:
- At initialization: if the `maxRows` value is lower than the initial number of rows,
Handsontable trims rows from the bottom.
- At runtime: for example, when inserting rows.

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>Infinity</code>  
**Example**  
```js
// set the maximum number of rows to 300
maxRows: 300,
```


### maxSelections
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api maxSelections|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5478

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api minCols|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5599

:::

_core.minCols : number_

The `minCols` option sets a minimum number of columns.

The `minCols` option is used:
- At initialization: if the `minCols` value is higher than the initial number of columns,
Handsontable adds empty columns to the right.
- At runtime: for example, when removing columns.

While [`fixedColumnsEnd`](@/api/options.md#fixedcolumnsend) is above `0`, Handsontable doesn't add empty columns for `minCols`,
because a column added after the last end column would take over the frozen position at the grid's end.

When you lower the `minCols` value with `updateSettings()`,
Handsontable removes the empty columns it added that the new value no longer requires.
It never removes a column that holds data, a column that came with your [`data`](@/api/options.md#data), or a column you added
yourself. Nothing is removed while [`maxCols`](@/api/options.md#maxcols) hides part of the grid.
The removal fires the [`beforeRemoveCol`](@/api/hooks.md#beforeremovecol) and
[`afterRemoveCol`](@/api/hooks.md#afterremovecol) hooks with the `auto` source,
and returning `false` from `beforeRemoveCol` keeps the columns.

The `minCols` option works only when your [`data`](@/api/options.md#data) is an [array of arrays](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-arrays).
When your [`data`](@/api/options.md#data) is an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects),
you can only have as many columns as defined in:
- The first data row
- The [`dataSchema`](@/api/options.md#dataschema) option
- The [`columns`](@/api/options.md#columns) option

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>0</code>  
**Example**  
```js
// set the minimum number of columns to 10
minCols: 10,
```


### minRowHeights
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api minRowHeights|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5640

:::

_core.minRowHeights : number | Array&lt;number&gt; | string | Array&lt;string&gt; | Array&lt;undefined&gt; | function_

The `minRowHeights` option sets the minimum height of rows, in pixels.

A row is never shorter than this value, but it grows to fit taller content. A value smaller than
the default row height has no effect, because a row is never shorter than the default. To set a row
to an exact height and clip content that does not fit, use [`rowHeights`](@/api/options.md#rowheights) instead.
You can set both options: `rowHeights` sets the rows it gives a height, and `minRowHeights` applies to the others.

Take the accepted forms (a number, a string, an array, or a function) from the
[`rowHeights`](@/api/options.md#rowheights) option description. Like `rowHeights`, the array and the function
address a row by its physical index, so a minimum height stays with its row.

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Since**: 16.2.0  
**Example**  
```js
// set every row's minimum height to 100px
minRowHeights: 100,

// set every row's minimum height to 100px
minRowHeights: '100px',

// set the first (by physical index) row's minimum height to 100
// set the second (by physical index) row's minimum height to 120
// set any other row's minimum height to the default height value
minRowHeights: [100, 120],

// set each row's minimum height individually, using a function
minRowHeights(physicalRowIndex) {
  return physicalRowIndex * 10;
},
```


### minRows
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api minRows|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5673

:::

_core.minRows : number_

The `minRows` option sets a minimum number of rows.

The `minRows` option is used:
- At initialization: if the `minRows` value is higher than the initial number of rows,
Handsontable adds empty rows at the bottom.
- At runtime: for example, when removing rows.

When you lower the `minRows` value with `updateSettings()`,
Handsontable removes the empty rows it added that the new value no longer requires.
It never removes a row that holds data, a row that came with your [`data`](@/api/options.md#data), or a row you added
yourself. Nothing is removed while [`maxRows`](@/api/options.md#maxrows) hides part of the grid.
The removal fires the [`beforeRemoveRow`](@/api/hooks.md#beforeremoverow) and
[`afterRemoveRow`](@/api/hooks.md#afterremoverow) hooks with the `auto` source,
and returning `false` from `beforeRemoveRow` keeps the rows.
The value counts only the rows on screen, so while [`filters`](@/api/options.md#filters) or [`trimRows`](@/api/options.md#trimrows)
hides rows, lowering it can leave some of the added empty rows in place.

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>0</code>  
**Example**  
```js
// set the minimum number of rows to 10
minRows: 10,
```


### minSpareCols
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api minSpareCols|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5715

:::

_core.minSpareCols : number_

The `minSpareCols` option sets a minimum number of empty columns
at the grid's right-hand end.

If there already are other empty columns at the grid's right-hand end,
they are counted into the `minSpareCols` value.

When you lower the `minSpareCols` value with `updateSettings()`,
Handsontable removes the empty columns it added that the new value no longer requires.
It never removes a column that holds data, a column that came with your [`data`](@/api/options.md#data), or a column you added
yourself. Nothing is removed while [`maxCols`](@/api/options.md#maxcols) hides part of the grid.
The removal fires the [`beforeRemoveCol`](@/api/hooks.md#beforeremovecol) and
[`afterRemoveCol`](@/api/hooks.md#afterremovecol) hooks with the `auto` source,
and returning `false` from `beforeRemoveCol` keeps the columns.

The total number of columns can't exceed the [`maxCols`](@/api/options.md#maxcols) value.

While [`fixedColumnsEnd`](@/api/options.md#fixedcolumnsend) is above `0`, Handsontable doesn't add spare columns,
because a spare column would take over the frozen position at the grid's end.

The `minSpareCols` option works only when your [`data`](@/api/options.md#data) is an [array of arrays](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-arrays).
When your [`data`](@/api/options.md#data) is an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects),
you can only have as many columns as defined in:
- The first data row
- The [`dataSchema`](@/api/options.md#dataschema) option
- The [`columns`](@/api/options.md#columns) option

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>0</code>  
**Example**  
```js
// at Handsontable's initialization, add at least 3 empty columns on the right
minSpareCols: 3,
```


### minSpareRows
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api minSpareRows|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5749

:::

_core.minSpareRows : number_

The `minSpareRows` option sets a minimum number of empty rows
at the bottom of the grid.

If there already are other empty rows at the bottom,
they are counted into the `minSpareRows` value.

When you lower the `minSpareRows` value with `updateSettings()`,
Handsontable removes the empty rows it added that the new value no longer requires.
It never removes a row that holds data, a row that came with your [`data`](@/api/options.md#data), or a row you added
yourself. Nothing is removed while [`maxRows`](@/api/options.md#maxrows) hides part of the grid.
The removal fires the [`beforeRemoveRow`](@/api/hooks.md#beforeremoverow) and
[`afterRemoveRow`](@/api/hooks.md#afterremoverow) hooks with the `auto` source,
and returning `false` from `beforeRemoveRow` keeps the rows.
The value counts only the rows on screen, so while [`filters`](@/api/options.md#filters) or [`trimRows`](@/api/options.md#trimrows)
hides rows, lowering it can leave some of the added empty rows in place.

The total number of rows can't exceed the [`maxRows`](@/api/options.md#maxrows) value.

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>0</code>  
**Example**  
```js
// at Handsontable's initialization, add at least 3 empty rows at the bottom
minSpareRows: 3,
```


### moveCells
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api moveCells|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L7529

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

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).

**Default**: <code>false</code>  
**Since**: 18.1.0  
**Example**  
```js
// enable drag-to-move for selections
moveCells: true,
```


### navigableHeaders
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api navigableHeaders|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5847

:::

_core.navigableHeaders : boolean_

When set to `true`, the `navigableHeaders` option lets you navigate [row headers](@/guides/rows/row-header/row-header.md) and [column headers](@/guides/columns/column-header/column-header.md), using the arrow keys or the <kbd>**Tab**</kbd> key (if the [`tabNavigation`](@/api/options.md#tabnavigation) option is set to `true`).

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api noWordWrapClassName|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6027

:::

_core.noWordWrapClassName : string_

The `noWordWrapClassName` option lets you add a CSS class name
to each cell that has the [`wordWrap`](@/api/options.md#wordwrap) option set to `false`.

Handsontable always adds the built-in `htNoWrap` class, which keeps the content on one line,
and then adds your class too. You can use your class for styling without a `white-space` rule.
To set a different `white-space` value, use a selector stronger than `.handsontable .htNoWrap`,
for example `.handsontable td.yourClass`.

If you set `noWordWrapClassName` to an empty string, Handsontable adds no class at all.

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api numericFormat|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6123

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
are stored as JavaScript numbers, so a value beyond the safe-integer limit
(`9007199254740991`) loses precision before the formatter ever sees it. To store and display
such a value exactly, set [`preserveNumericLiteral`](@/api/options.md#preservenumericliteral)
to `true` and provide the value as a string.

Read more:
- [`locale`](@/api/options.md#locale)
- [`preserveNumericLiteral`](@/api/options.md#preservenumericliteral)
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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api observeDOMVisibility|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6195

:::

_core.observeDOMVisibility : boolean_

If the `observeDOMVisibility` option is set to `true`,
Handsontable rerenders every time it detects that the grid was made visible in the DOM.

Handsontable uses a `MutationObserver` to watch for CSS changes (such as `display: none` being removed)
on the container element and its ancestors. When visibility is restored after being hidden,
Handsontable automatically triggers a rerender to ensure correct layout and dimensions.
Set this option to `false` if you want to control rendering manually (e.g. by calling `render()` yourself).

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>true</code>  
**Example**  
```js
// don't rerender the grid on visibility changes
observeDOMVisibility: false,
```


### outsideClickDeselects
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api outsideClickDeselects|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6238

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

A click on the [sheets bar](@/guides/accessories-and-menus/sheets-bar/sheets-bar.md) doesn't count as a click
outside of the grid: it keeps the current selection and saves a cell you are editing, whatever this option is set to.

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api placeholder|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6326

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api placeholderCellClassName|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6356

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api preserveNumericLiteral|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6171

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
the value according to [`numericFormat`](@/api/options.md#numericformat), and it keeps every
digit of the literal: `Intl.NumberFormat` reads a string operand as an exact decimal instead
of converting it to a JavaScript number. That makes `preserveNumericLiteral` the supported
way to display a value beyond the safe-integer limit: the literal `'9007199254740993'`
renders with every digit intact, while the same value held as a number renders as
`9007199254740992`. Grouping and decimals still follow
[`numericFormat`](@/api/options.md#numericformat). One exception: the filter menu's
"Filter by value" checkbox
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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api preventOverflow|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6434

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

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>false</code>  
**Example**  
```js
// prevent horizontal overflowing
preventOverflow: 'horizontal',
```


### readOnly
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api readOnly|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6510

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
- [Setting options: Cascading configuration](@/guides/configuration/configuration-options/configuration-options.md#cascading-configuration)

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api readOnlyCellClassName|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6538

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


### readOnlyStyling
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api readOnlyStyling|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6592

:::

_core.readOnlyStyling : boolean_

The `readOnlyStyling` option controls whether [read-only](@/api/options.md#readonly) cells look different from
editable ones.

You can set the `readOnlyStyling` option to one of the following:

| Setting          | Description                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| `true` (default) | Read-only cells are dimmed, through the [`readOnlyCellClassName`](@/api/options.md#readonlycellclassname) CSS class |
| `false`          | Read-only cells look exactly like editable ones                                                    |

Set `readOnlyStyling` to `false` to make a grid non-editable without the cells looking
different. Only the appearance changes: read-only cells still reject edits, pasting, and
autofill, and are still announced as read-only by screen readers.

When `readOnlyStyling` is `false`, no [`readOnlyCellClassName`](@/api/options.md#readonlycellclassname) class
is added at all, so setting both options means `readOnlyStyling` wins.

The same applies to a [`checkbox`](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md)
cell with no [`editor`](@/api/options.md#editor): when `readOnlyStyling` is `false`, its checkbox is not rendered
disabled, but a click still doesn't change its value.

A [`multiselect`](@/guides/cell-types/multiselect-cell-type/multiselect-cell-type.md) cell
works the same way: a read-only cell, or one with no [`editor`](@/api/options.md#editor), normally draws its
chips without the remove button, but when `readOnlyStyling` is `false` the button stays, and a
click on it doesn't change the value.

Read more:
- [`readOnly`](@/api/options.md#readonly)
- [`readOnlyCellClassName`](@/api/options.md#readonlycellclassname)

**Default**: <code>true</code>  
**Since**: 19.0.0  
**Example**  
```js
// make the whole grid read-only, but keep it looking like a normal table
readOnly: true,
readOnlyStyling: false,

// apply the option to individual columns
columns: [
  {
    readOnly: true,
    // this column is read-only, and is not dimmed
    readOnlyStyling: false
  }
]
```


### renderAllColumns
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api renderAllColumns|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6718

:::

_core.renderAllColumns : boolean_

The `renderAllColumns` option configures Handsontable's [column virtualization](@/guides/columns/column-virtualization/column-virtualization.md).

You can set the `renderAllColumns` option to one of the following:

| Setting           | Description                                                                                                                                                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `false` (default) | Enable [column virtualization](@/guides/columns/column-virtualization/column-virtualization.md), rendering only visible columns for better performance with many columns.                                                                              |
| `true`            | Disable [column virtualization](@/guides/columns/column-virtualization/column-virtualization.md)<br>(render all columns of the grid), rendering all columns in the dataset, and ensuring all columns are available regardless of horizontal scrolling. |

Setting `renderAllColumns` to `true` overwrites the [`viewportColumnRenderingOffset`](@/api/options.md#viewportcolumnrenderingoffset) setting.

You can set the `renderAllColumns` option only at Handsontable's [initialization](@/guides/getting-started/installation/installation.md#initialize-handsontable). Any change of it after the initialization (e.g. using the `updateSettings()` method) throws an error, even when you didn't set the option at initialization.

Read more:
- [Column virtualization](@/guides/columns/column-virtualization/column-virtualization.md)

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>false</code>  
**Since**: 14.1.0  
**Example**  
```js
// disable column virtualization
renderAllColumns: true,
```


### renderAllRows
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api renderAllRows|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6623

:::

_core.renderAllRows : boolean_

The `renderAllRows` option controls Handsontable's [row virtualization](@/guides/rows/row-virtualization/row-virtualization.md).
You can configure it as follows:

| Setting           | Description                                                                                                                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `false` (default) | Enable [row virtualization](@/guides/rows/row-virtualization/row-virtualization.md), rendering only the visible rows for optimal performance with large datasets.                                                  |
| `true`            | Disable [row virtualization](@/guides/rows/row-virtualization/row-virtualization.md)<br>(render all rows of the grid), rendering all rows in the dataset for consistent rendering and screen reader accessibility. |

Setting `renderAllRows` to `true` overwrites the [`viewportRowRenderingOffset`](@/api/options.md#viewportrowrenderingoffset) setting.

You can set the `renderAllRows` option only at Handsontable's [initialization](@/guides/getting-started/installation/installation.md#initialize-handsontable). Any change of it after the initialization (e.g. using the `updateSettings()` method) throws an error, even when you didn't set the option at initialization.

Read more:
- [Row virtualization](@/guides/rows/row-virtualization/row-virtualization.md)

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>false</code>  
**Example**  
```js
// disable row virtualization
renderAllRows: true,
```


### renderer
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api renderer|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6781

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
- [Setting options: Cascading configuration](@/guides/configuration/configuration-options/configuration-options.md#cascading-configuration)
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


### renderMode
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api renderMode|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6685

:::

_core.renderMode : string_

The `renderMode` option decides when a cell is painted during a render.

You can set the `renderMode` option to one of the following:

| Setting              | Description                                                                                                                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `'always'` (default) | The cell is painted on every render.                                                                                                                                                                          |
| `'onChange'`         | The cell is painted only when the element it lands in showed something else after its last paint: another cell, another value, another renderer, a changed cell meta (through `setCellMeta()` or the [`cells`](@/api/options.md#cells) function), or a structural change of the grid. |

Under `'onChange'`, a render skips the cells whose paint would produce the same result as their
last paint. A vertical scroll keeps the elements of the rows that stay rendered, so it paints
only the rows that enter the rendered area, plus the cells of merged blocks, whose span depends
on that area. A horizontal scroll repaints the rendered cells, and so does any scroll in a grid
that scrolls with the page. Some changes are not detected, because nothing in the grid sees
them:
- a meta object mutated directly (`getCellMeta(row, col).x = y`, including inside the
[`beforeGetCellMeta`](@/api/hooks.md#beforegetcellmeta) and [`afterGetCellMeta`](@/api/hooks.md#aftergetcellmeta) hooks),
- a value object mutated in place (the grid compares values by identity),
- state outside the grid that a renderer reads,
- a renderer that reads the data of other cells, such as the checkbox renderer with
[`label.property`](@/api/options.md#label),
- a renderer that reads where the rendered area starts or ends, through
`getFirstRenderedVisibleRow()` or its siblings: a
vertical scroll keeps such a cell as it is.

Set `renderMode: 'always'` on such cells, or mark them with
`markCellChanged()` before rendering. A [`cells`](@/api/options.md#cells)
function result is compared value by value, so return the same references for an unchanged
result: a renderer function created on every call counts as a change on every render.

The option cascades, so a single column of slow renderers can use `'onChange'` while the rest of
the grid keeps the default.

Read more:
- [Understanding rendering](@/guides/optimization/rendering/rendering.md)

**Default**: <code>"always"</code>  
**Since**: 19.0.0  
**Example**  
```js
// paint every cell on every render (default)
renderMode: 'always',

// paint only the cells that changed
renderMode: 'onChange',

// skip unchanged cells in one slow column only
columns: [
  { data: 'chart', renderer: chartRenderer, renderMode: 'onChange' },
  { data: 'name' },
],
```


### rowHeaders
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api rowHeaders|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6978

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

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api rowHeaderWidth|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L7028

:::

_core.rowHeaderWidth : number | Array&lt;number&gt; | string | Array&lt;string&gt; | Array&lt;(number\|string)&gt;_

The `rowHeaderWidth` option configures the width of row headers.

You can set the `rowHeaderWidth` option to one of the following:

| Setting  | Description                                                    |
| -------- | -------------------------------------------------------------- |
| A number | Set the same width for every row header                        |
| A string | Set the same width, written as a pixel size (`'25'`, `'25px'`) |
| An array | Set different widths for individual row headers                |

The width is a number of pixels. A string that states a pixel size works too, either as a bare
number (`'25'`) or with the unit (`'25px'`), so a value coming from an attribute or a JSON
config still applies. Both forms may be mixed inside the array.

A value that is not a pixel size, such as `'50%'` or `'20em'`, is ignored and the default width
is used instead. Inside an array, that applies per level, so one unreadable entry does not
disturb the levels around it.

A negative number is kept as it is, because numbers keep the behavior they had before this
option read strings at all. A negative string is rejected instead, so a typo cannot collapse
the header.

Row headers have a fixed width. A label longer than that width is clipped, and unlike column
headers, the header does not grow to fit it. To size the header to its content instead, turn
on the [`autoRowHeaderSize`](@/api/options.md#autorowheadersize) plugin - it takes the width over, and this
option is then ignored.

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Example**  
```js
// set the same width for every row header
rowHeaderWidth: 25,

// set the same width, written as a pixel size
rowHeaderWidth: '25px',

// set different widths for individual row headers
rowHeaderWidth: [25, 30, 55],
```


### rowHeights
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api rowHeights|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L7199

:::

_core.rowHeights : number | Array&lt;number&gt; | string | Array&lt;string&gt; | Array&lt;undefined&gt; | function_

The `rowHeights` option sets rows' heights, in pixels.

A row renders at exactly the height you set. Content taller than the row is clipped, as in Excel,
instead of stretching the row. A row can be shorter than the default row height, which is
`classic: 26px`, `main: 29px`, `horizon: 37px` or whatever the used theme defines (based on the line
height, vertical padding and cell borders). A row with no height of its own, or with a height of `0`,
keeps the default.

To set a minimum that content can grow past, use [`minRowHeights`](@/api/options.md#minrowheights) instead.
You can set both options: `rowHeights` sets the rows it gives a height, and `minRowHeights` applies to the others.

You can set the `rowHeights` option to one of the following:

| Setting     | Description                                                                                         | Example                                                      |
| ----------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| A number    | Set the same height for every row                                                                   | `rowHeights: 100`                                            |
| A string    | Set the same height for every row                                                                   | `rowHeights: '100px'`                                        |
| An array    | Set heights separately for each row,<br>by physical row index                                       | `rowHeights: [100, 120, undefined]`                              |
| A function  | Set row heights dynamically,<br>on each render, by physical row index                               | `rowHeights(physicalRowIndex) { return physicalRowIndex * 10; }` |
| `undefined` | Used by the [modifyRowHeight](@/api/hooks.md#modifyrowheight) hook,<br>to detect row height changes | `rowHeights: undefined`                                      |

The array and the function address a row by its physical index, so a height stays with its row
when rows are moved with the [ManualRowMove](@/api/manualRowMove.md) plugin, sorted, filtered, trimmed, or collapsed
(for example, by the [NestedRows](@/api/nestedRows.md) plugin). The physical index doesn't change in any of those
cases. A row that the [NestedRows](@/api/nestedRows.md) plugin moves by dragging or detaching takes a new physical
index: an array entry follows the row, but a function is called with the new index. An array entry
also stays with the row it was declared for when you insert or remove rows: a row inserted between
others has no height of its own, a row added after the last one takes the next entry, and the array
you passed is never changed. A function is called with the physical index the row has now. To declare
the heights again, pass a new array to `updateSettings()`. Switching the
option to or from an array, or passing a new array, clears the undo history, the way enabling a plugin does. [`colWidths`](@/api/options.md#colwidths) addresses columns by
the physical index too.

When the [AutoRowSize](@/api/autoRowSize.md) plugin is enabled, `rowHeights` sets the minimum row height, so a
row still grows to fit its content, and the clipping described above does not apply. The
[`autoRowSize`](@/api/options.md#autorowsize) option alone decides this, not the state of the plugin: with
`autoRowSize` set, `rowHeights` stays a minimum even when the plugin is not registered, or after
you call `disablePlugin()` on it.

When [AutoRowSize](@/api/autoRowSize.md) is disabled, a row resized by dragging keeps its height until the
height is re-declared. Passing `rowHeights` or [`minRowHeights`](@/api/options.md#minrowheights) to
`updateSettings()` re-declares the heights and discards the
ones stored by the [ManualRowResize](@/api/manualRowResize.md) plugin. To keep the stored heights, leave both
options out of the call.

Passing [`manualRowResize`](@/api/options.md#manualrowresize) as an array in the same call **replaces** the
stored heights with that array rather than keeping them.

These cases never discard the stored heights:

- A `rowHeights` **function**. It states no fixed height, so it is left alone.
- A grid whose `manualRowResize` option is already a non-empty array. The plugin replays that
  array, so the stored heights stay.
- The React, Angular and Vue wrappers, when the `rowHeights` prop did not change. An unchanged
  prop is not forwarded, so re-applying the same value resets nothing.

In each case, call
[`ManualRowResize#clearManualSizes()`](@/api/manualRowResize.md#clearmanualsizes) followed by
`render()`.

Read more:
- [Row height](@/guides/rows/row-height/row-height.md)

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Example**  
```js
// set every row's height to 100px
rowHeights: 100,

// set every row's height to 100px
rowHeights: '100px',

// set the first (by physical index) row's height to 100
// set the second (by physical index) row's height to 120
// set the third (by physical index) row's height to `undefined`
// set any other row's height to the default height value
rowHeights: [100, 120, undefined],

// set each row's height individually, using a function
rowHeights(physicalRowIndex) {
  return physicalRowIndex * 10;
},
```


### rowId
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api rowId|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2409

:::

_core.rowId : string | function | boolean_

The `rowId` option gives each row an id that stays with the row's record when you sort, filter, move,
trim, insert, or remove rows, and when you undo or redo any of those actions.

Read a row's id with `getRowId()`, and find a row by its id with
`getVisualRowById()` or `getPhysicalRowById()`.

You can set the `rowId` option to one of the following:

| Setting    | Description                                                                              |
| ---------- | ---------------------------------------------------------------------------------------- |
| A string   | The property that holds the id in each row object (for example, `'id'` or `'meta.id'`), or the index of that value in each row array |
| A function | A function that receives the source row and returns its id                               |
| `true`     | Handsontable generates the ids: a number for each row, never reused within the instance   |
| `false`    | No row ids                                                                               |

For a string with a dot, a property named exactly as the string wins (`{ 'meta.id': 'SKU-4821' }`), as it does
for a column's `data` property. Otherwise, the dots read a nested property (`{ meta: { id: 'SKU-4821' } }`), even
when [`dataDotNotation`](@/api/options.md#datadotnotation) is `false` and a column with the same `data` shows nothing.

Keep the ids unique. If two rows share an id, the lookups return the row with the lower physical index.

Generated ids follow the physical rows. `loadData()` gives every row a new id,
and `updateData()` keeps the ids of the rows that stay, by position. To keep
ids across data loads, store them in the data and use a string or a function.

When the [`dataProvider`](@/api/options.md#dataprovider) option sets its own `rowId`, Handsontable reads row ids with
`dataProvider.rowId`, and ignores the `rowId` option.

Read more:
- [Row identity](@/guides/rows/row-identity/row-identity.md)

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Since**: 19.0.0  
**Example**  
```js
// read the id from the `id` property of each row object
rowId: 'id',

// read the id with a function (return `null` while a row lacks the values, as an empty row does)
rowId: (row) => (row.country == null || row.code == null ? null : `${row.country}-${row.code}`),

// let Handsontable generate the ids
rowId: true,
```


### sanitizer
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api sanitizer|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L9356

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
It must return a string that is safe to assign to `innerHTML`, or a `TrustedHTML` when the page
enforces [Trusted Types](@/guides/security/security/security.md#trusted-types-and-csp). Handsontable
passes the returned value to the DOM unchanged, so a `TrustedHTML` keeps its trust.

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

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
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
// Trusted Types: wrap sanitization in a policy so the sink accepts the result. Handsontable
// needs no policy of its own - it builds its own markup as DOM nodes - so the directive only
// has to name yours (e.g. trusted-types my-app-sanitizer). Name it after your application:
// `createPolicy` throws when the same name is created twice.
const policy = window.trustedTypes?.createPolicy('my-app-sanitizer', {
  createHTML: (input) => myLibrary.sanitize(input),
});

sanitizer: (content, source) =>
  policy ? policy.createHTML(content) : myLibrary.sanitize(content),
```


### searchInput
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api searchInput|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L7362

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api selectionHandles|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L7429

:::

_core.selectionHandles : boolean_

The `selectionHandles` option enables draggable handles on the edges of a
[selection](@/guides/cell-features/selection/selection.md). When enabled, hovering over a
selected range shows a pill-shaped handle at the midpoint of each edge; dragging a handle
resizes that edge of the selection. This adjusts the selected area only – it does not move,
fill, or change any cell data.

Handles are shown on desktop only and are hidden on any edge that is flush with the grid
boundary -- or that lands on a frozen-pane line ([`fixedRowsTop`](@/api/options.md#fixedrowstop),
[`fixedRowsBottom`](@/api/options.md#fixedrowsbottom), [`fixedColumnsStart`](@/api/options.md#fixedcolumnsstart),
[`fixedColumnsEnd`](@/api/options.md#fixedcolumnsend)). The option
has no effect when [`selectionMode`](@/api/options.md#selectionmode) is `'single'`.

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).

**Default**: <code>false</code>  
**Since**: 18.1.0  
**Example**  
```js
// enable draggable selection-edge handles
selectionHandles: true,
```


### selectionMode
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api selectionMode|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L7401

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

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api selectOptions|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L7586

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api skipColumnOnPaste|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L7618

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
- [Setting options: Setting column options](@/guides/configuration/configuration-options/configuration-options.md#set-column-options)

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api skipRowOnPaste|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L7655

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
- [Setting options: Setting row options](@/guides/configuration/configuration-options/configuration-options.md#set-row-options)

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api sortByRelevance|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L7688

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api source|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L7784

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

Note: The `value` property can be an object. Use the [`sourceLabel`](@/api/options.md#sourcelabel) option to tell the cell which text to display
for it. The cell then stores the whole `source` entry, so the object reaches your data unchanged.

Note: When `source` is a function, Handsontable ignores a response that arrives after the editor closed - including
a close you may not notice, such as scrolling the edited cell out of view - and it ignores a response that a newer
query has superseded, which happens as you type. Call the callback whenever the request completes, even late.

Read more:
- [Autocomplete cell type](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
- [Dropdown cell type](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md)
- [`strict`](@/api/options.md#strict)
- [`allowHtml`](@/api/options.md#allowhtml)
- [`filter`](@/api/options.md#filter)
- [`sortByRelevance`](@/api/options.md#sortbyrelevance)
- [`sourceLabel`](@/api/options.md#sourcelabel)

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api sourceDataValidator|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L8771

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api sourceDataWarningMessage|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L8788

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


### sourceLabel
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api sourceLabel|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L7843

:::

_core.sourceLabel : string | function_

The `sourceLabel` option sets the text that [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
and [`dropdown`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md) cells display for a [`source`](@/api/options.md#source) entry
whose `value` is an object.

You can set the `sourceLabel` option to one of the following:

| Setting            | Description                                                                         |
| ------------------ | ----------------------------------------------------------------------------------- |
| `undefined`        | (Default) Display the `value` as it is                                              |
| A string           | Display the property of the `value` object at that path, for example `'name'`, `'address.city'`, or `'aliases.0'` |
| A function         | Display what the function returns. The function receives the `value` object         |

The label is used everywhere the cell shows text: in the cell, in the list of options, when you type to filter
the options, and when you paste. The cell itself stores the whole `source` entry, including the `value` object.
To change an entry, replace it in `source` and in the cells that hold it, instead of changing the object in place:
depending on how the value was written, a cell holds either the `source` entry itself or a plain-object copy of it.

Each entry needs a unique label: if two entries display the same label, picking or pasting that label stores the first of them.
An entry whose label resolves to nothing, for example a missing property, isn't listed as an option.

The `sourceLabel` option affects only a `value` that is an object. A string or number `value` is displayed as it is.
With [`sortByRelevance`](@/api/options.md#sortbyrelevance) set to `false`, a `source` that holds an object `value` is sorted by the labels.

Read more:
- [Autocomplete cell type](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
- [Dropdown cell type](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md)
- [`source`](@/api/options.md#source)

**Default**: <code>undefined</code>  
**Since**: 19.0.0  
**Example**  
```js
columns: [{
  type: 'dropdown',
  source: [
    { key: 'US', value: { name: 'United States', currency: 'USD' } },
    { key: 'PL', value: { name: 'Poland', currency: 'PLN' } },
  ],
  // display the `name` property of each `value` object
  sourceLabel: 'name',
}],

columns: [{
  type: 'dropdown',
  source: [
    { key: 'US', value: { name: 'United States', currency: 'USD' } },
    { key: 'PL', value: { name: 'Poland', currency: 'PLN' } },
  ],
  // build the label from several properties
  sourceLabel: value => `${value.name} (${value.currency})`,
}],
```


### sourceSortFunction
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api sourceSortFunction|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L7712

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api startCols|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L7870

:::

_core.startCols : number_

If the [`data`](@/api/options.md#data) option is not set, the `startCols` option sets the initial number of empty columns.

The `startCols` option works only in Handsontable's constructor and only when [`data`](@/api/options.md#data) is not provided.

::: tip
When [`minSpareCols`](@/api/options.md#minsparecols) is set alongside `startCols`, the `startCols` columns count toward the
minimum number of spare columns. As a result, the total initial column count will be the maximum of
`startCols` and `minSpareCols`.
:::

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>5</code>  
**Example**  
```js
// start with 15 empty columns
startCols: 15,
```


### startRows
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api startRows|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L7897

:::

_core.startRows : number_

If the [`data`](@/api/options.md#data) option is not set, the `startRows` option sets the initial number of empty rows.

The `startRows` option works only in Handsontable's constructor and only when [`data`](@/api/options.md#data) is not provided.

::: tip
When [`minSpareRows`](@/api/options.md#minsparerows) is set alongside `startRows`, the `startRows` rows count toward the
minimum number of spare rows. As a result, the total initial row count will be the maximum of
`startRows` and `minSpareRows`.
:::

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>5</code>  
**Example**  
```js
// start with 15 empty rows
startRows: 15,
```


### stretchH
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api stretchH|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L7934

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

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>"none"</code>  
**Example**  
```js
// fit the grid to the container
// by stretching all columns evenly
stretchH: 'all',
```


### strict
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api strict|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L7973

:::

_core.strict : boolean_

The `strict` option configures the behavior of [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md) cells.

You can set the `strict` option to one of the following:

| Setting | Mode                                                                                          | Description                                                                                |
| ------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `true`  | [Strict mode](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md#autocomplete-strict-mode)         | The end user:<br>- Can only choose one of suggested values<br>- Can't enter a custom value |
| `false` | [Flexible mode](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md#autocomplete-flexible-mode)     | The end user:<br>- Can choose one of suggested values<br>- Can enter a custom value        |

The [`dropdown`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md) cell type always runs in strict mode, so it ignores `strict: false`.

This option can be set at any level of the [cascading configuration](@/guides/configuration/configuration-options/configuration-options.md#cascading-configuration):
the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options), the [`columns`](@/api/options.md#columns) level, the [`cells`](@/api/options.md#cells) level, and the [`cell`](@/api/options.md#cell) level.

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api tableClassName|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L8016

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

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api tabMoves|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L8348

:::

_core.tabMoves : object | function_

The `tabMoves` option configures the action of the <kbd>**Tab**</kbd> key.

You can set the `tabMoves` option to an object with the following properties
(or to a function that returns such an object):

| Property | Type   | Description                                                                                                                                              |
| -------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `row`    | Number | - On pressing <kbd>**Tab**</kbd>, move selection `row` rows down<br>- On pressing <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd>, move selection `row` rows up              |
| `col`    | Number | - On pressing <kbd>**Tab**</kbd>, move selection `col` columns right<br>- On pressing <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd>, move selection `col` columns left     |

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api tabNavigation|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5878

:::

_core.tabNavigation : boolean_

The `tabNavigation` option decides what the <kbd>Tab</kbd> and <kbd>Shift</kbd>+<kbd>Tab</kbd>
keys do while the grid has the focus.

| Setting          | Description                                                                                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `true` (default) | The grid captures <kbd>Tab</kbd> and <kbd>Shift</kbd>+<kbd>Tab</kbd> and moves the selection between cells, so the grid is a set of tab stops (the spreadsheet mode). |
| `false`          | The grid returns both keys to the browser, so <kbd>Tab</kbd> leaves the grid and the grid is one tab stop in the page's tab sequence (the data grid mode).          |

Pair `tabNavigation: false` with [`navigableHeaders: true`](@/api/options.md#navigableheaders) for the data grid mode
described in the [Accessibility](@/guides/accessibility/accessibility/accessibility.md#keyboard-navigation) guide.

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>true</code>  
**Since**: 14.0.0  
**Example**  
```js
// Tab leaves the grid: one tab stop, the arrow keys move between cells
tabNavigation: false,

// default behavior: Tab and Shift+Tab move between cells
tabNavigation: true,
```


### textEllipsis
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api textEllipsis|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L8079

:::

_core.textEllipsis : boolean | number_

The `textEllipsis` option configures whether the text content in the cells should be truncated with an ellipsis (three dots), either on one line or after a number of lines. Support for a number was added in 19.0.0.

You can set the `textEllipsis` option to one of the following:

| Setting                    | Description                                                                |
| -------------------------- | -------------------------------------------------------------------------- |
| `false` (default)          | Don't truncate text content with an ellipsis                               |
| `true`                     | Keep text content on one line and truncate it with an ellipsis             |
| A number, `2` or greater   | Wrap text content and truncate it with an ellipsis after that many lines  |

A number of `1` works like `true`. A number that is not a positive integer (such as `0`, `-1`, or `2.5`)
works like `false`.

A number works in cells whose renderer writes plain text through the built-in `textRenderer`.
That covers the `text`, `numeric`, `date`, `time`, `intl-date`, `intl-datetime`, `intl-time`, `select`,
`autocomplete`, `dropdown`, and `handsontable` cell types, and any custom renderer that calls
`textRenderer`. Renderers that draw their own markup, such as the `html` and `password` renderers (and
the `autocomplete` renderer with `allowHtml: true`), can't clamp: for them a number works like `true`,
and the text stays on one line with an ellipsis.

Truncation only changes how the text looks. The full text stays in the cell's DOM, in
`getData()`, and in copied data. The grid shows no tooltip with the full text.

The [`wordWrap`](@/api/options.md#wordwrap) option set to `false` takes precedence over a number: the text stays on
one line and ends with an ellipsis.

A row grows up to the given number of lines, so the clamped text stays readable.

::: tip
The `autocomplete`, `dropdown`, and `handsontable` cell types default this option to `true`, so a
long value stays on one line and truncates with an ellipsis, clear of the dropdown arrow. To
restore wrapping, set `textEllipsis: false` on the column that declares the type (or in `cells` /
`setCellMeta`). To show a number of lines in them, set the number there too. A grid-level `textEllipsis`
does not reach these columns, because the cell type's own value wins over the grid level. This changed in
19.0.0.
:::

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
    // wrap text content and truncate it with an ellipsis after 3 lines
    textEllipsis: 3,
  },
  {
    // don't truncate text content with an ellipsis
    textEllipsis: false,
  }
],
```


### textExtractor
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api textExtractor|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L9433

:::

_core.textExtractor : boolean | function_

The `textExtractor` option configures how grid content is turned into plain text for consumers
that do not write to the DOM, such as an exported file.

It is the counterpart to [`sanitizer`](@/api/options.md#sanitizer). Read the pair as one idea:

- `sanitizer` decides how content is written **to the screen** (HTML in, HTML out).
- `textExtractor` decides how the same content becomes **text everywhere else** (HTML in, text out).

The option exists because a header setting is also its display string. A header of
`'<b>Total</b>'` renders as **Total** in the grid, and without this option the same header
reaches a CSV file as the literal `<b>Total</b>`, so the file disagrees with the screen.
Copying a header row to the clipboard carries the same markup.

By default (when no extractor is set) content is exported exactly as it is stored, which is the
behavior of every earlier version.

Set `true` to use the built-in extraction, which returns the text the grid displays:

```js
textExtractor: true,
```

`false` behaves the same as leaving the option out, so you can pass a flag straight through
without a ternary.

Set a function for full control. It receives the content and the consumer surface, so you can
apply different rules per surface. In TypeScript, annotate the second parameter with the
exported `TextExtractorContext` type
(see [TypeScript types](@/guides/tools-and-building/typescript-types/typescript-types.md))
to get editor completion on the values below.

The surfaces that pass a context today are `'ExportFile.columnHeader'`, `'ExportFile.rowHeader'`
and `'CopyPaste.columnHeader'`. A plugin may pass a surface of its own, so treat the list as open.

The built-in extraction runs a configured [`sanitizer`](@/api/options.md#sanitizer) first, under the `'header'`
surface, then reduces the result to text. That order matters: a sanitizer may remove content
rather than only unwrap it, so extracting text from the unsanitized value would put content in
a file that the grid never displayed. Parsing is also what turns entities back into the
characters they stand for, so a header shown as `Tom & Jerry` is written to a file as
`Tom & Jerry` rather than `Tom &amp; Jerry`.

Values that are not strings are never passed to the extractor. A numeric header stays a number,
so a spreadsheet still reads it as one.

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Since**: 19.0.0  
**Example**  
```js
// Export headers as the text the grid displays
textExtractor: true,
```
**Example**  
```js
// Keep row headers as they are, reduce column headers to text
textExtractor: (content, source) => {
  if (source === 'ExportFile.rowHeader') {
    return content;
  }

  const tpl = document.createElement('template');

  tpl.innerHTML = content;

  return tpl.content.textContent ?? '';
},
```


### theme
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api theme|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L8170

:::

_core.theme : ThemeBuilder | object | string | undefined_

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

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api themeName|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L8100

:::

_core.themeName : string | undefined_

The `themeName` option allows enabling a theme by that name.

Read more:
- [Themes](@/guides/styling/themes/themes.md)

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Since**: 15.0.0  
**Example**  
```js
themeName: 'ht-theme-name',
```


### timeFormat
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api timeFormat|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2553

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">columns</span></p>

::: ask-about-api title|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L8389

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api trimDropdown|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L8435

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

This option can be set at any level of the [cascading configuration](@/guides/configuration/configuration-options/configuration-options.md#cascading-configuration):
the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options), the [`columns`](@/api/options.md#columns) level, the [`cells`](@/api/options.md#cells) level, and the [`cell`](@/api/options.md#cell) level.

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api trimWhitespace|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L8498

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api type|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L8561

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

A grid-level `type` changed with `updateSettings()` applies the new type's editor, renderer,
and validator. A grid-level `editor`, `renderer`, or `validator` set earlier, or in the same call,
keeps winning over the type.

Read more:
- [Cell type](@/guides/cell-types/cell-type/cell-type.md)
- [Cell renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md)
- [Cell editor](@/guides/cell-functions/cell-editor/cell-editor.md)
- [Cell validator](@/guides/cell-functions/cell-validator/cell-validator.md)
- [Setting options: Cascading configuration](@/guides/configuration/configuration-options/configuration-options.md#cascading-configuration)
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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api uncheckedTemplate|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L8613

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
represent an unchecked state is no longer valid. A value matches an unchecked checkbox when it equals the
template or reads the same ignoring letter case (`'no'` and `'NO'` both match `'No'`).
Pair `uncheckedTemplate` with [`checkedTemplate`](@/api/options.md#checkedtemplate) to define both states explicitly.
:::

This option can be set at any level of the [cascading configuration](@/guides/configuration/configuration-options/configuration-options.md#cascading-configuration):
the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options), the [`columns`](@/api/options.md#columns) level, the [`cells`](@/api/options.md#cells) level, and the [`cell`](@/api/options.md#cell) level.

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api validator|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L8722

:::

_core.validator : function | RegExp | string_

The `validator` option sets a [cell validator](@/guides/cell-functions/cell-validator/cell-validator.md) for a cell.

You can set the `validator` option to one of the following:

| Setting              | Description                                                                      |
| -------------------- | -------------------------------------------------------------------------------- |
| A string             | A [cell validator alias](@/guides/cell-functions/cell-validator/cell-validator.md)              |
| A function           | Your [custom cell validator function](@/guides/cell-functions/cell-validator/cell-validator.md) |
| A regular expression | A regular expression used for cell validation                                    |

This option can be set at any level of the [cascading configuration](@/guides/configuration/configuration-options/configuration-options.md#cascading-configuration):
the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options), the [`columns`](@/api/options.md#columns) level, the [`cells`](@/api/options.md#cells) level, and the [`cell`](@/api/options.md#cell) level.

By setting the `validator` option to a string,
you can use one of the following [cell validator aliases](@/guides/cell-functions/cell-validator/cell-validator.md):

| Alias               | Cell validator function                                                 |
| ------------------- | ----------------------------------------------------------------------- |
| A custom alias      | Your [custom cell validator](@/guides/cell-functions/cell-validator/cell-validator.md) |
| `'autocomplete'`    | `AutocompleteValidator`                                                 |
| `'checkbox'`        | `CheckboxValidator` (opt-in; the `checkbox` cell type doesn't apply it) |
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
- [Setting options: Cascading configuration](@/guides/configuration/configuration-options/configuration-options.md#cascading-configuration)
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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api valueFormatter|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6867

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
- [Setting options: Cascading configuration](@/guides/configuration/configuration-options/configuration-options.md#cascading-configuration)

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api valueGetter|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L8812

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api valueParser|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6940

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
- [Setting options: Cascading configuration](@/guides/configuration/configuration-options/configuration-options.md#cascading-configuration)

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api valueSetter|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L8842

:::

_core.valueSetter : function_

The `valueSetter` option configures a function that defines what value will be used when setting the cell content.
It can be used to modify the value of a cell before it is saved (for example, for object-based data).

`setSourceDataAtCell()` runs the `valueSetter` too. When you address the
cell by a property name, the grid reads the option from the global settings, the [`columns`](@/api/options.md#columns)
option, or the [`cell`](@/api/options.md#cell) option. It does not run the [`cells`](@/api/options.md#cells) function or the
[`beforeGetCellMeta`](@/api/hooks.md#beforegetcellmeta) and
[`afterGetCellMeta`](@/api/hooks.md#aftergetcellmeta) hooks.

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api viewportColumnRenderingOffset|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L8975

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

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>&#x27;auto&#x27;</code>  
**Example**  
```js
// render 70 columns outside of the grid's viewport
viewportColumnRenderingOffset: 70,
```


### viewportColumnRenderingThreshold
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api viewportColumnRenderingThreshold|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L9059

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

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api viewportRowRenderingOffset|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L9023

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

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>&#x27;auto&#x27;</code>  
**Example**  
```js
// render 70 rows outside of the grid's viewport
viewportRowRenderingOffset: 70,
```


### viewportRowRenderingThreshold
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api viewportRowRenderingThreshold|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L9095

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

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api visibleRows|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L9144

:::

_core.visibleRows : number_

The `visibleRows` option sets the height of the [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
, [`dropdown`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md) and [`multiSelect`](@/guides/cell-types/multiselect-cell-type/multiselect-cell-type.md)-typed cells' lists.

When the number of list options exceeds the `visibleRows` number, a scrollbar appears.

::: tip
If the grid has a fixed [`height`](@/api/options.md#height) set, the dropdown list may be visually constrained by the available
space and show fewer rows than the `visibleRows` value. In such cases, the list is clipped to fit within the grid.
:::

This option can be set at any level of the [cascading configuration](@/guides/configuration/configuration-options/configuration-options.md#cascading-configuration):
the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options), the [`columns`](@/api/options.md#columns) level, the [`cells`](@/api/options.md#cells) level, and the [`cell`](@/api/options.md#cell) level.

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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api width|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L9209

:::

_core.width : number | 'auto' | string | function_

The `width` option configures the width of your grid.

You can set the `width` option to one of the following:

| Setting                                                                    | Example                            |
| -------------------------------------------------------------------------- | ---------------------------------- |
| A number of pixels                                                         | `width: 500`                       |
| A string with a number of pixels                                           | `width: '500'`, `width: '500px'`   |
| A string with a [CSS unit](https://www.w3schools.com/cssref/css_units.asp) | `width: '50%'`, `width: '75vw'`    |
| `'auto'`                                                                   | `width: 'auto'`                    |
| A function that returns a valid number or string                           | `width() { return 500; }`          |

Any other value the browser can read as a CSS length or expression (`'20em'`,
`'calc(100% - 40px)'`, `'var(--grid-width)'`) is passed through as written. A value the
browser cannot read as a size (`'abc'`, `-100`, `true`) is ignored, and so are these CSS
keywords: `'inherit'`, `'initial'`, `'unset'`, `'revert'`, `'revert-layer'`, `'none'`, and
`'normal'`, which do not set a size; `'min-content'`, `'max-content'`, and `'fit-content'`,
which size the grid to its full content, so it cannot scroll inside its box; and `'stretch'`,
`'-webkit-fill-available'`, and `'-moz-available'`, which fill the container but read as a
fixed size. An ignored value leaves the grid's width as it was, and a warning is printed once
per grid and value.

With `width: 'auto'`, Handsontable writes `width: auto` as an inline style on the root
element. The grid then follows the width of its parent container, like a plain block
element. Use this value when you want the grid to stay flexible horizontally while still
setting an explicit [`height`](@/api/options.md#height).

Passing `null` through `updateSettings()` restores the root
element's initial inline width. A `height` set through the option is left in place.

::: tip
A definite `width` (a number, `'500'`, `'500px'`, `'20em'`) clips the grid horizontally and the grid
scrolls its columns inside that width on its own, with or without a [`height`](@/api/options.md#height). A relative
width (`'100%'`, `'80vw'`, `'var(--grid-width)'`) leaves the horizontal overflow to the page. Setting
the height via inline CSS on the container element is not supported - use the `height` configuration
option instead.
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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api wordWrap|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L9263

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

::: tip
The `autocomplete`, `dropdown`, and `handsontable` cell types default
[`textEllipsis`](@/api/options.md#textellipsis) to `true`, and its styling also keeps the value on a single line,
so `wordWrap` has no visible effect on them until you set `textEllipsis: false` on the column that
declares the type (or in `cells` / `setCellMeta`). This changed in 19.0.0.
:::

This option can be set at any level of the [cascading configuration](@/guides/configuration/configuration-options/configuration-options.md#cascading-configuration):
the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options), the [`columns`](@/api/options.md#columns) level, the [`cells`](@/api/options.md#cells) level, and the [`cell`](@/api/options.md#cell) level.

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

### afterValidatorAnswer

::: ask-about-api afterValidatorAnswer|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L493

:::

_Core~afterValidatorAnswer_

The functions `_runAfterValidatorAnswer()` queued while a validator answer ran. They run when the outermost
answer has released its hold on the transaction of the change it answers (see `leaveValidatorAnswer()`).



### columnIndexMapper

::: ask-about-api columnIndexMapper|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L860

:::

_core.columnIndexMapper : [IndexMapper](@/api/indexMapper.md)_

Instance of index mapper which is responsible for managing the column indexes.



### columnsSettingIndexes

::: ask-about-api columnsSettingIndexes|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L8295

:::

_Core~columnsSettingIndexes_

Caches the index translation that `getColHeader` derives from the `columns` option when that
option is a function: the source column indexes for which `columns(index)` returns a truthy
settings object. Only the membership array is cached — titles are still read live from the
`columns` function. Rebuilt when the function reference or the column count changes; cleared
by `updateSettings`.



### columnTracking

::: ask-about-api columnTracking|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L332

:::

_Core~columnTracking_

Follows the physical columns a change that waits for its validator is made at, see `core/columnTracker.ts`.



### dataWorkPhase

::: ask-about-api dataWorkPhase|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L411

:::

_Core~dataWorkPhase_

The step `_applySettingsAndData()` is in: `'configure'` while it applies its settings, `'data'`
while it loads the data, `'meta'` while it runs the meta phases it held back, and `null` outside the
call.



### displacedMetas

::: ask-about-api displacedMetas|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L352

:::

_Core~displacedMetas_

The stored cell metas of waiting validator calls whose record `updateData()` moved to another physical row
while the meta stays stored at the row it was read from (`updateData()` keeps cell meta by physical row). The
meta there belongs to the record now at that row, so the answer of such a call is written only to the meta at
the record's row (`persistValidationResult()`), never on the call's own meta object. Each maps to the tracked
record of its call. A meta leaves the map when the next validator call starts on it.



### droppedChangesListeners

::: ask-about-api droppedChangesListeners|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L470

:::

_Core~droppedChangesListeners_

The functions told about a change set that waited for its validators while `loadData()` replaced the
data, and that is therefore never applied (see `_addDroppedChangesListener()`).



### fontRefreshVisibilityObserver

::: ask-about-api fontRefreshVisibilityObserver|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L629

:::

_Core~fontRefreshVisibilityObserver_

Waits for a grid that was hidden when a web font loaded to be shown, so the re-measure skipped then
runs (see `refreshAfterFontsLoad()`), or `null` when no re-measure is owed.



### hadExternalDataSource

::: ask-about-api hadExternalDataSource|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L8288

:::

_Core~hadExternalDataSource_

What `hasExternalDataSource` answered at the end of the last settings update that sent `dataProvider` (or
at init). A payload without `dataProvider` does not re-apply the plugin, so an object completed in place
and followed by such an update has not been fetched yet, and recording that answer would skip the
placeholder when the object is sent again. A settings update compares it with the answer
for its own payload, because a `dataProvider` object completed in place answers `true` even before the payload
merges, and only the earlier answer shows that the grid was not server-backed yet.



### heldMetaPhases

::: ask-about-api heldMetaPhases|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L415

:::

_Core~heldMetaPhases_

The meta phases of the settings updates made while `_applySettingsAndData()` configures, run
after its load in the order the updates were made.



### initPassSettings

::: ask-about-api initPassSettings|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L452

:::

_Core~initPassSettings_

The settings core's own init settings pass applies, while `beforeInit` runs, or `null` outside that
window (see `_replaceInitPassSettings()`).



### initReadyStepsRunning

::: ask-about-api initReadyStepsRunning|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L430

:::

_Core~initReadyStepsRunning_

`true` while the grid's init pass runs the ready steps: before the `init` hook and the first render, with
the renders they ask for held.



### isAnsweringStaleValidation

::: ask-about-api isAnsweringStaleValidation|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L526

:::

_Core~isAnsweringStaleValidation_

Whether the `postAfterValidate` hook that runs now reports the answer of a validator call made before
the last `loadData()`. Such an answer belongs to a change the load dropped, so a listener waiting for
the answer to a later call (an editor's wait) must not take it (see `_isAnsweringStaleValidation()`).



### isBeingDestroyed

::: ask-about-api isBeingDestroyed|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L443

:::

_Core~isBeingDestroyed_

Set when `destroy()` starts, so no ready step runs against a grid being torn down.



### isDestroyed

::: ask-about-api isDestroyed|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L740

:::

_core.isDestroyed : boolean_

A boolean to tell if the Handsontable has been fully destroyed. This is set to `true`
after `afterDestroy` hook is called.



### isRunningBeforeExecutionHook

::: ask-about-api isRunningBeforeExecutionHook|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L448

:::

_Core~isRunningBeforeExecutionHook_

Set while a `beforeSuspendExecution` or `beforeResumeExecution` listener runs. A suspend or resume the
listener makes on this grid is part of the call that fired it, so it fires no execution hooks (see
`suspendExecution()`).



### isValidatingChange

::: ask-about-api isValidatingChange|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L517

:::

_Core~isValidatingChange_

Whether `validateChanges` is calling `validateCell` right now, so the call counts as a change that
waits for its validator. `validateCell` reads and clears it first, before any hook runs: a
`beforeValidate` listener can make a validated change of its own, and its nested `validateChanges`
would otherwise set or clear the flag the outer call reads.



### lifecyclePassDepth

::: ask-about-api lifecyclePassDepth|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L421

:::

_Core~lifecyclePassDepth_

How many lifecycle passes are open: `updateSettings()` and `_applySettingsAndData()` calls, plugin
lifecycle calls (`enablePlugin()`, `updatePlugin()`, `disablePlugin()`), and runs of the ready steps.
The ready steps the plugins owe (`BasePlugin#onGridReady()`) wait while a pass is open, so a pass
enables or updates every plugin before any of them runs its step.



### pendingColumnLayoutCheck

::: ask-about-api pendingColumnLayoutCheck|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L435

:::

_Core~pendingColumnLayoutCheck_

The column layout a data replacement made by `updateSettings()` must compare with the one it builds: the layout
read before the payload merged, and whether columns added after the existing ones leave it as it was. `null`
outside such a replacement.



### pendingValidatorAnswers

::: ask-about-api pendingValidatorAnswers|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L511

:::

_Core~pendingValidatorAnswers_

The number of validator calls made for a change (`validateChanges`) on the data the grid holds that
have not answered yet. A call that throws, or answers more than once, is counted out once. A validator
that never answers stays counted until the next `loadData()`, which starts a new count. Calls made by
`validateCells()` and its siblings are not counted: they hold no change waiting to be written.



### pluginRequirements

::: ask-about-api pluginRequirements|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L466

:::

_Core~pluginRequirements_

The plugins other plugins need running (see `_requirePlugin()`).



### readyStepsMayBeOwed

::: ask-about-api readyStepsMayBeOwed|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L426

:::

_Core~readyStepsMayBeOwed_

Whether a plugin may owe a ready step: set by every plugin lifecycle call (the only way a plugin comes
to owe one), cleared once a run of the steps leaves none owed. A pass that ran no plugin call then
skips the steps without looking at any plugin.



### recordReader

::: ask-about-api recordReader|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L355

:::

_Core~recordReader_

What the record resolution reads from the grid, see `core/waitingRecords.ts`.



### recordTracker

::: ask-about-api recordTracker|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L329

:::

_Core~recordTracker_

Follows the records that something waits on (a change that waits for its validator, an editor that waits
for the answer) by their physical rows, see `core/recordTracker.ts`.



### rowIndexMapper

::: ask-about-api rowIndexMapper|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L867

:::

_core.rowIndexMapper : [IndexMapper](@/api/indexMapper.md)_

Instance of index mapper which is responsible for managing the row indexes.



### rowRevealers

::: ask-about-api rowRevealers|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L478

:::

_Core~rowRevealers_

The functions that can bring a row a hiding feature of their own keeps off screen into view (see
`_addRowRevealer()`).



### rowStateToClearAfterDataUpdate

::: ask-about-api rowStateToClearAfterDataUpdate|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L440

:::

_Core~rowStateToClearAfterDataUpdate_

Set while an `updateData()` call starts the column state over beside a sort or a filter, so they are cleared once
the call has finished. Both name columns and change the rows, so the rows would keep a result the column state no
longer describes.



### runningValidatorLoadGeneration

::: ask-about-api runningValidatorLoadGeneration|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L532

:::

_Core~runningValidatorLoadGeneration_

The `validationLoadGeneration` of the validator call whose validator runs now, or `null` outside one. A
validator writes a correction through a nested `setDataAtCell(..., 'xValidator')`, and that correction
belongs to the change the validator checks, so it takes this generation instead of the current one: when
the change was dropped, its correction is dropped with it.



### runningValidatorMeta

::: ask-about-api runningValidatorMeta|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L536

:::

_Core~runningValidatorMeta_

The cell meta of the validator call whose validator runs now, or `null` outside one. A correction the validator
writes to a `null` row (its record has no visual row) belongs to the change this call validates first.



### settingsFilters

::: ask-about-api settingsFilters|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L457

:::

_Core~settingsFilters_

The functions that read every `updateSettings()` and `_applySettingsAndData()` payload, and the values
`_replaceInitPassSettings()` hands the init pass, before they are applied, in the order they were added
(see `_addSettingsFilter()`).



### slotsResizeObserver

::: ask-about-api slotsResizeObserver|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L620

:::

_Core~slotsResizeObserver_

Watches the root wrapper's edge slots for a height change (a bar that mounts after init, wraps
after a locale switch, or grows a horizontal scrollbar once its width is clamped). A slot's
height feeds two things nothing else observes: the pixel `height` core writes on the root, and
the height the engine reserves inside a scrollable ancestor (`layoutReservedHeight`).



### stopWatchingFontLoads

::: ask-about-api stopWatchingFontLoads|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L625

:::

_Core~stopWatchingFontLoads_

Stops watching the document's web font loads (see `refreshAfterFontsLoad()`), or `null` before
`init` started watching.



### unansweredValidatorGenerations

::: ask-about-api unansweredValidatorGenerations|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L547

:::

_Core~unansweredValidatorGenerations_

The `validationLoadGeneration` of every validator call made for a change that has not answered yet, counted
in `_hasPendingValidation()` or not (a call a `beforeValidate` load overtook is not counted, but its validator
still runs and can still correct), by the cell it validates (property, then the tracked record of its row),
oldest first. The record is tracked (`recordTracker`), so a sort, a move or an insert made while the call
waits leaves the entry on the record the call validates. A validator that writes its correction later than
its own synchronous run (after a timer or a request) is no longer inside `runningValidatorLoadGeneration`, so
the correction finds the call it corrects here, by the record its row holds when it is written. An entry
leaves when its call answers or throws; a load leaves the entries in place, because the calls they stand for
are still out and their corrections still belong to the data they were made on.



### validationLoadGeneration

::: ask-about-api validationLoadGeneration|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L521

:::

_Core~validationLoadGeneration_

Advances on every `loadData()`. A validator call remembers the load it started on, and its answer is
counted out only while that load is still the current one.



### validatorAnswerDepth

::: ask-about-api validatorAnswerDepth|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L489

:::

_Core~validatorAnswerDepth_

How many validator answers run right now, nested: the microtask that calls a validator, and the callback the
validator answers with (which runs inside that microtask when the validator answers synchronously).



### waitingChangeRecords

::: ask-about-api waitingChangeRecords|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L485

:::

_Core~waitingChangeRecords_

The record bookkeeping of every change a waiting set captured a record for, read by `getPhysicalRowOfChange()`
in O(1). An entry lives from the capture until the set has dispatched its `afterChange` (or was dropped), when
`WaitingChangeRecords#release()` takes it out, so a listener of `beforeChangeRender` or `afterChange` can still
find the record of a change whose row reads `null`. Weak, so it holds no change alive.



### waitingMetaStamps

::: ask-about-api waitingMetaStamps|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L341

:::

_Core~waitingMetaStamps_

Keeps the `row` and `visualRow` of the stored cell meta of every validator call made for a change on the
rows its record has, so `this.visualRow` in a validator and the row of `afterValidate` name the record
whatever moved it while the validator ran, see `core/waitingMetaStamps.ts`.


## Methods

### isEmptyCol
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api isEmptyCol|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4645

:::

_core.isEmptyCol(col) ⇒ boolean_

The `isEmptyCol` option lets you define your own custom method
for checking if a column at a given visual index is empty.

The `isEmptyCol` setting overwrites the built-in `isEmptyCol` method.
The function receives a visual column index and must return a `boolean`.

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
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
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api isEmptyRow|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4695

:::

_core.isEmptyRow(row) ⇒ boolean_

The `isEmptyRow` option lets you define your own custom method
for checking if a row at a given visual index is empty.

The `isEmptyRow` setting overwrites the built-in `isEmptyRow` method.
The function receives a visual row index and must return a `boolean`.

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L9522

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L9558

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L6751

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
| [index] | `number` <br/> `Array<number>` | `optional` A visual index of the row/column before or after which the new row/column will be                                inserted or removed. Can also be an array of arrays, in format `[[index, amount],...]`.                                For `'remove_row'` and `'remove_col'`, rows and columns that do not exist are                                never removed. An index that points outside the table (a negative one, or one at                                or past the last row/column) removes nothing, and in the array format any part of                                a range that falls outside the table is ignored while the rest is still removed. |
| [amount] | `number` | `optional` The amount of rows or columns to be inserted or removed (default: `1`). |
| [source] | `string` | `optional` Source indicator passed to related hooks. |
| [keepEmptyRows] | `boolean` | `optional` If set to `true`, skips the automatic adjustment that normally adds empty rows                                  or columns after the operation to satisfy `minRows`, `minSpareRows`,                                  `minCols`, or `minSpareCols`. |



### applyThemeOverrides

::: ask-about-api applyThemeOverrides|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L2558

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L4611

:::

_core.batch(wrappedOperations) ⇒ \*_

It batches the rendering process and index recalculations. The method aggregates
multi-line API calls into a callback and postpones the table rendering process
as well aggregates the table logic changes such as index changes into one call
after which the cache is updated. After the execution of the operations, the
table is rendered, and the cache is updated once. As a result, it improves the
performance of wrapped operations. Rendering and execution resume even when the
callback throws; the error is rethrown.

The method suspends and resumes the execution through [Core#suspendExecution](@/api/core.md#suspendexecution) and
[Core#resumeExecution](@/api/core.md#resumeexecution), so the outermost call fires the four execution hooks around the callback.

With the `batchEvaluation` setting of the [`formulas`](@/api/options.md#formulas) option, the
[`Formulas`](@/api/formulas.md) plugin can batch HyperFormula's recalculation too.

**Emits**: [`Hooks#event:beforeSuspendExecution`](@/api/hooks.md#beforesuspendexecution), [`Hooks#event:afterSuspendExecution`](@/api/hooks.md#aftersuspendexecution), [`Hooks#event:beforeResumeExecution`](@/api/hooks.md#beforeresumeexecution), [`Hooks#event:afterResumeExecution`](@/api/hooks.md#afterresumeexecution)  
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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L4521

:::

_core.batchExecution(wrappedOperations, [forceFlushChanges]) ⇒ \*_

The method aggregates multi-line API calls into a callback and postpones the
table execution process. After the execution of the operations, the internal table
cache is recalculated once. As a result, it improves the performance of wrapped
operations. Without batching, a similar case could trigger multiple table cache rebuilds.

Execution resumes even when the callback throws; the error is rethrown, and `forceFlushChanges`
is not applied on that path.

Like [`batch()`](@/api/core.md#batch), the callback is one operation: every change it makes is one
undo step of the [`UndoRedo`](@/api/undoRedo.md) plugin, with the `'batch'` action type.

The method suspends and resumes the execution through [Core#suspendExecution](@/api/core.md#suspendexecution) and
[Core#resumeExecution](@/api/core.md#resumeexecution), so the outermost call fires the four execution hooks around the callback.

With the `batchEvaluation` setting of the [`formulas`](@/api/options.md#formulas) option, the
[`Formulas`](@/api/formulas.md) plugin can batch HyperFormula's recalculation too, but `batchExecution()`
does not suspend rendering, so each render inside the callback still recalculates. For fewer
recalculations, use [`batch()`](@/api/core.md#batch).

**Emits**: [`Hooks#event:beforeSuspendExecution`](@/api/hooks.md#beforesuspendexecution), [`Hooks#event:afterSuspendExecution`](@/api/hooks.md#aftersuspendexecution), [`Hooks#event:beforeResumeExecution`](@/api/hooks.md#beforeresumeexecution), [`Hooks#event:afterResumeExecution`](@/api/hooks.md#afterresumeexecution)  
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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L4314

:::

_core.batchRender(wrappedOperations) ⇒ \*_

The method aggregates multi-line API calls into a callback and postpones the
table rendering process. After the execution of the operations, the table is
rendered once. As a result, it improves the performance of wrapped operations.
Without batching, a similar case could trigger multiple table render calls.

Rendering resumes even when the callback throws; the error is rethrown.

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L6725

:::

_core.clear()_

Clears the data from the table (the table settings remain intact) and clears the current selection.

The method empties every cell of the data set. Neither the current selection nor the
[`selectionMode`](@/api/options.md#selectionmode) option limits its range. Cells set as
[`readOnly`](@/api/options.md#readonly) keep their values.

**Emits**: [`Hooks#event:beforeChange`](@/api/hooks.md#beforechange), [`Hooks#event:afterChange`](@/api/hooks.md#afterchange)  


### collectEmptyCellChanges

::: ask-about-api collectEmptyCellChanges|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L4075

:::

_Core~collectEmptyCellChanges(changes, startRow, endRow, startColumn, endColumn) ⇒ void_

Collects "empty this cell" changes for a rectangular range of cells, skipping read-only ones.
The passed coordinates are clamped to the grid, so header coordinates (negative values) and
corners that reach past the last row or column are safe to pass.


| Param | Type | Description |
| --- | --- | --- |
| changes | `Array<Array>` | The array that the collected changes are pushed into. |
| startRow | `number` | The visual row index the range starts at. |
| endRow | `number` | The visual row index the range ends at. |
| startColumn | `number` | The visual column index the range starts at. |
| endColumn | `number` | The visual column index the range ends at. |



### colToProp

::: ask-about-api colToProp|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L6912

:::

_core.colToProp(column) ⇒ string | number | null_

Returns the property name that corresponds with the given column index.
If the data source is an array of arrays, it returns the columns index.

Returns `null` when the index names no column that currently exists, the same way
[Core#toVisualColumn](@/api/core.md#tovisualcolumn) and the other index translators report an index they cannot
resolve. It also returns `null` for a column declared as `{ data: null }` – a perfectly valid
index for a column that binds to no source property. Test the result before you use it as a
property name.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. An argument that is not an integer comes back   unchanged, so the declared type is narrower than what the method accepts at runtime. |


**Returns**: `string` | `number` | `null` - Column property, physical column index, or `null` when the index
  names no column or the column binds to no property. When the column's `data` option is an
  accessor function, that function is returned at runtime – check `typeof` before treating the
  result as a property name.  

### columnToPropForSelection

::: ask-about-api columnToPropForSelection|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L1214

:::

_Core~columnToPropForSelection(column) ⇒ string | number | null_

Translates a selection's column index for the `*ByProp` hooks.

A selection range uses negative columns as header sentinels – `-1` for a row selection, and
further negative values for the nested-header levels above it – so they are not out-of-range
indexes and must reach the hook unchanged. `colToProp()` cannot tell the two apart and now
answers `null` for both, which would silently replace the sentinel every consumer of these
hooks already handles.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index, or a negative header sentinel. |


**Returns**: `string` | `number` | `null` - The column property, or the sentinel unchanged.  

### countColHeaders

::: ask-about-api countColHeaders|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L8669

:::

_core.countColHeaders() ⇒ number_

Returns the number of rendered column headers.

**Since**: 14.0.0  

**Returns**: `number` - Number of column headers.  

### countCols

::: ask-about-api countCols|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L8603

:::

_core.countCols() ⇒ number_

Returns the total number of rendered columns. If the columns option is defined, it returns the number of columns set in that configuration, not the number of columns in the data source.


**Returns**: `number` - Total number of columns.  

### countEmptyCols

::: ask-about-api countEmptyCols|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L8699

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L8680

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L8636

:::

_core.countRenderedCols() ⇒ number_

Returns the number of rendered rows including columns that are partially or fully rendered
outside the table viewport.


**Returns**: `number` - Returns -1 if table is not visible.  

### countRenderedRows

::: ask-about-api countRenderedRows|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L8614

:::

_core.countRenderedRows() ⇒ number_

Returns the number of rendered rows including rows that are partially or fully rendered
outside the table viewport.


**Returns**: `number` - Returns -1 if table is not visible.  

### countRowHeaders

::: ask-about-api countRowHeaders|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L8658

:::

_core.countRowHeaders() ⇒ number_

Returns the number of rendered row headers.

**Since**: 14.0.0  

**Returns**: `number` - Number of row headers.  

### countRows

::: ask-about-api countRows|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L8594

:::

_core.countRows() ⇒ number_

Returns the total number of visual rows in the table.


**Returns**: `number` - Total number of rows.  

### countSourceCols

::: ask-about-api countSourceCols|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L8585

:::

_core.countSourceCols() ⇒ number_

Returns the total number of columns in the data source. It will take value either from schema, columns settings or the first row from the data set. Unlike [countCols()](@/api/core.md#countcols), this value is not affected by the columns configuration option.


**Returns**: `number` - Total number of columns.  

### countSourceRows

::: ask-about-api countSourceRows|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L8576

:::

_core.countSourceRows() ⇒ number_

Returns the total number of rows in the data source.


**Returns**: `number` - Total number of rows.  

### countVisibleCols

::: ask-about-api countVisibleCols|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L8647

:::

_core.countVisibleCols() ⇒ number_

Returns the number of rendered columns that are only visible in the table viewport.
The columns that are partially visible are not counted.


**Returns**: `number` - Number of visible columns or -1.  

### countVisibleRows

::: ask-about-api countVisibleRows|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L8625

:::

_core.countVisibleRows() ⇒ number_

Returns the number of rendered rows that are only visible in the table viewport.
The rows that are partially visible are not counted.


**Returns**: `number` - Number of visible rows or -1.  

### deselectCell

::: ask-about-api deselectCell|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L8988

:::

_core.deselectCell()_

Deselects the current cell selection on the table.



### destroy

::: ask-about-api destroy|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L9205

:::

_core.destroy()_

Removes the table from the DOM and destroys the instance of the Handsontable.

**Emits**: [`Hooks#event:afterDestroy`](@/api/hooks.md#afterdestroy)  


### destroyEditor

::: ask-about-api destroyEditor|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L3867

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L4097

:::

_core.emptySelectedCells([source])_

Erases content from cells that have been selected in the table.

**Emits**: [`Hooks#event:beforeChange`](@/api/hooks.md#beforechange), [`Hooks#event:afterChange`](@/api/hooks.md#afterchange)  
**Since**: 0.36.0  

| Param | Type | Description |
| --- | --- | --- |
| [source] | `string` | `optional` String that identifies how this change will be described in the changes array (useful in [Hooks#afterChange](@/api/hooks.md#afterchange) or [Hooks#beforeChange](@/api/hooks.md#beforechange) callbacks). Set to 'edit' if left empty. |



### filterSettings

::: ask-about-api filterSettings|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L463

:::

_Core~filterSettings(settings) ⇒ object_

Runs a settings payload through every filter `_addSettingsFilter()` added, in order.


| Param | Type | Description |
| --- | --- | --- |
| settings | `object` | The payload. |


**Returns**: `object` - The payload to apply.  

### foldUnplacedCorrection

::: ask-about-api foldUnplacedCorrection|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L2822

:::

_Core~foldUnplacedCorrection(prop, value, [source])_

Folds a validator's correction written to a `null` row into the waiting change of the record it corrects, which
has no visual row to write it through. The record is the one of the validator call that runs now, or, for a
correction written later (after a timer or a request), the only record whose waiting validator call has a `null`
row for the property. A correction no record can be told for is dropped, and the change it corrects lands as it
was.


| Param | Type | Description |
| --- | --- | --- |
| prop | `string` <br/> `number` | The property of the corrected cell. |
| value | `*` | The corrected value. |
| [source] | `string` | `optional` The change source. |



### foldValidatorCorrection

::: ask-about-api foldValidatorCorrection|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L2777

:::

_Core~foldValidatorCorrection(changes, records, prop, physicalRow, visualRow, value)_

Writes a validator's correction into the change of a waiting set it corrects: the change of the same property
whose record holds the corrected physical row, or, for a change no record was captured for, the change made at
the corrected visual row.


| Param | Type | Description |
| --- | --- | --- |
| changes | `Array` | The changes of the waiting set. |
| records | `object` | The records of the set's changes. |
| prop | `string` <br/> `number` <br/> `function` | The property of the corrected cell. |
| physicalRow | `number` <br/> `null` | The physical row of the corrected cell, or `null` when it has none. |
| visualRow | `number` <br/> `null` | The visual row of the corrected cell, or `null` when it has none. |
| value | `*` | The corrected value. |



### getActiveEditor

::: ask-about-api getActiveEditor|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L9314

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L4053

:::

_core.getActiveSelectionLayerIndex() ⇒ number_

Returns the index of the active selection layer. Active selection layer is the layer that
has visible focus highlight.

**Since**: 16.1.0  

**Returns**: `number` - The index of the active selection layer. `0` to `N` where `0` is the last (oldest) layer and `N` is the first (newest) layer.  

### getCell

::: ask-about-api getCell|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L6845

:::

_core.getCell(row, column, [topmost]) ⇒ HTMLTableCellElement | null_

Returns a TD element for the given `row` and `column` arguments, if it is rendered on screen.
Returns `null` if the TD is not rendered on screen (probably because that part of the table is not visible),
or if the grid has no view yet, as inside a hook that fires during initialization.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| row | `number` |  | Visual row index. |
| column | `number` |  | Visual column index. |
| [topmost] | `boolean` | <code>false</code> | `optional` If set to `true`, it returns the TD element from the topmost overlay. For example, if the wanted cell is in the range of fixed rows, it will return a TD element from the `top` overlay. |


**Returns**: `HTMLTableCellElement` | `null` - The cell's TD element.  

### getCellEditor

::: ask-about-api getCellEditor|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L8014

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L7875

:::

_core.getCellMeta(row, column, options) ⇒ object_

Returns the cell properties object for the given `row` and `column` coordinates.

The returned object reflects the effective cell configuration after
[cascading configuration](@/guides/configuration/configuration-options/configuration-options.md#cascading-configuration)
(grid, column, and cell levels). To read global grid settings only, use [Core#getSettings](@/api/core.md#getsettings).
To read column-level meta, use [Core#getColumnMeta](@/api/core.md#getcolumnmeta).

For a read-only bulk scan over many cells, use [Core#getCellMetaTransient](@/api/core.md#getcellmetatransient) instead: it
returns the same data without permanently caching a meta object per cell.

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L7967

:::

_core.getCellMetaAtRow(row) ⇒ Array_

Returns an array of cell meta objects for specified physical row index.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Physical row index. |



### getCellMetaTransient

::: ask-about-api getCellMetaTransient|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L7912

:::

_core.getCellMetaTransient(row, column) ⇒ object_

Returns the cell properties object for the given `row` and `column` coordinates without
retaining it in the cell meta cache.

Like [Core#getCellMeta](@/api/core.md#getcellmeta), the returned object reflects the effective cell configuration after
[cascading configuration](@/guides/configuration/configuration-options/configuration-options.md#cascading-configuration)
and dynamic extension (the `cells` function and the `beforeGetCellMeta`/`afterGetCellMeta`
hooks run). Unlike `getCellMeta`, when the cell has no stored meta object the extension runs
on a temporary object that is not saved, so scanning many cells (for example, a whole column
or the entire dataset) does not permanently allocate one meta object per visited cell. Cells
that already carry stored meta (for example, written by [Core#setCellMeta](@/api/core.md#setcellmeta) or the `cell` option)
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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L7992

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L7866

:::

_core.getCellsMeta() ⇒ Array_

Get all the cells meta settings at least once generated in the table (in order of cell initialization).


**Returns**: `Array` - Returns an array of ColumnSettings object instances.  

### getCellValidator

::: ask-about-api getCellValidator|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L8040

:::

_core.getCellValidator(rowOrMeta, column) ⇒ function | RegExp | undefined_

Returns the cell validator by `row` and `column`.

When the cell has a finite [`maxLength`](@/api/options.md#maxlength), the returned function also
checks the length of the value, before it runs the validator that you configured.

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

### getChangeLoadGeneration

::: ask-about-api getChangeLoadGeneration|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L597

:::

_Core~getChangeLoadGeneration([source], [changes]) ⇒ number_

Returns the `validationLoadGeneration` a change set made now addresses: the current one, or, for a
validator's correction (`isValidatorCorrection()`), the one of the validator call that writes it. A
correction written while its validator runs takes `runningValidatorLoadGeneration`. One written later takes
the oldest unanswered call on the cells it writes, found by the record the correction's row holds now: when
calls from before and after a load wait on one cell, the older one's correction must not land in the loaded
rows, and a newer call's correction dropped by mistake loses a correction, which is the lesser harm. A
correction for a cell no call waits on takes the current one.


| Param | Type | Description |
| --- | --- | --- |
| [source] | `string` | `optional` The change source. |
| [changes] | `Array` | `optional` The changes, in the form `[row, prop, ...]`. |



### getColHeader

::: ask-about-api getColHeader|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L8296

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L7951

:::

_core.getColumnMeta(column) ⇒ object_

Returns the meta information for the provided column.

The returned object reflects the column-level configuration after
[cascading configuration](@/guides/configuration/configuration-options/configuration-options.md#cascading-configuration)
(grid and column levels). To read global grid settings only, use [Core#getSettings](@/api/core.md#getsettings).
To read the effective configuration for a specific cell, use [Core#getCellMeta](@/api/core.md#getcellmeta).

**Since**: 14.5.0  

| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |



### getColWidth

::: ask-about-api getColWidth|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L8436

:::

_core.getColWidth(column, [source]) ⇒ number_

Returns the width of the requested column.

Passing [`colWidths`](@/api/options.md#colwidths) to
[`updateSettings()`](@/api/core.md#updatesettings) discards the widths stored by
[`ManualColumnResize`](@/api/manualColumnResize.md), so the option applies again from that point
on.

**Emits**: [`Hooks#event:modifyColWidth`](@/api/hooks.md#modifycolwidth)  

| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |
| [source] | `string` | `optional` The source of the call. |


**Returns**: `number` - Column width.  

### getCoords

::: ask-about-api getCoords|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L6880

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L5169

:::

_core.getCopyableData(row, column) ⇒ string_

Returns the data's copyable value at specified `row` and `column` index, as a string.

A value that is not already a string is converted: numbers and booleans to their text form,
`null` and `undefined` to an empty string, and everything else through its `toString()`.
A cell with `copyable` disabled returns an empty string.

The text copied to the clipboard can differ for an object with its own `valueOf()`, because the
clipboard reads such an object through `valueOf()` first.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |



### getCopyableSourceData

::: ask-about-api getCopyableSourceData|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L5208

:::

_core.getCopyableSourceData(row, column) ⇒ \*_

Returns the source data's copyable value at specified `row` and `column` index.

The value is returned as it is stored, so it can be a nested object or an array. The CopyPaste
plugin serializes those to JSON when copying with source data. A cell with `copyable` disabled
returns an empty string.

**Since**: 16.1.0  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |



### getCopyableText

::: ask-about-api getCopyableText|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L5155

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L9689

:::

_core.getCurrentThemeName() ⇒ string | undefined_

Gets the name of the currently used theme.

**Since**: 15.0.0  

**Returns**: `string` | `undefined` - The name of the currently used theme.  

### getData

::: ask-about-api getData|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L5120

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L7139

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L7205

:::

_core.getDataAtCol(column) ⇒ Array_

Returns array of column values from the data source, one value per visual row.
With the [`nestedRows`](@/api/options.md#nestedrows) option, the result includes the visible child rows
and skips the children of collapsed parents. A grid with no rows returns `[null]`, so the length
is one more than `countRows()` there.

__Note__: If columns were reordered or sorted, the currently visible order will be used.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |


**Returns**: `Array` - Array of cell values.  

### getDataAtProp

::: ask-about-api getDataAtProp|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L7228

:::

_core.getDataAtProp(prop) ⇒ Array_

Given the object property name (e.g. `'first.name'` or `'0'`), returns an array of column's values from the table data.
You can also provide a column index as the first argument. The result holds one value per visual row.
With the [`nestedRows`](@/api/options.md#nestedrows) option, it includes the visible child rows
and skips the children of collapsed parents. For an existing column of a grid with no rows, it
returns `[null]`, so the length is one more than `countRows()` there.


| Param | Type | Description |
| --- | --- | --- |
| prop | `string` <br/> `number` | Property name or physical column index. |


**Returns**: `Array` - Array of cell values. An empty array when `prop` names no column – an index past
  the last column, a negative index, or a property name your data set does not use.  

### getDataAtRow

::: ask-about-api getDataAtRow|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L7525

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L7175

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L7539

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L793

:::

_core.getDirectionFactor() ⇒ number_

Returns 1 for LTR; -1 for RTL. Useful for calculations.

**Since**: 12.0.0  

**Returns**: `number` - Returns 1 for LTR; -1 for RTL.  

### getFirstFullyVisibleColumn

::: ask-about-api getFirstFullyVisibleColumn|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L9427

:::

_core.getFirstFullyVisibleColumn() ⇒ number | null_

Returns the first fully visible column in the table viewport. When the table has overlays the method returns
the first row of the main table that is not overlapped by overlay.

**Since**: 14.6.0  

**Returns**: `number` | `null` - The index, or `null` when the grid has no view yet or has not been rendered.  

### getFirstFullyVisibleRow

::: ask-about-api getFirstFullyVisibleRow|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L9405

:::

_core.getFirstFullyVisibleRow() ⇒ number | null_

Returns the first fully visible row in the table viewport. When the table has overlays the method returns
the first row of the main table that is not overlapped by overlay.

**Since**: 14.6.0  

**Returns**: `number` | `null` - The index, or `null` when the grid has no view yet or has not been rendered.  

### getFirstPartiallyVisibleColumn

::: ask-about-api getFirstPartiallyVisibleColumn|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L9471

:::

_core.getFirstPartiallyVisibleColumn() ⇒ number | null_

Returns the first partially visible column in the table viewport. When the table has overlays the method returns
the first row of the main table that is not overlapped by overlay.

**Since**: 14.6.0  

**Returns**: `number` | `null` - The index, or `null` when the grid has no view yet or has not been rendered.  

### getFirstPartiallyVisibleRow

::: ask-about-api getFirstPartiallyVisibleRow|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L9449

:::

_core.getFirstPartiallyVisibleRow() ⇒ number | null_

Returns the first partially visible row in the table viewport. When the table has overlays the method returns
the first row of the main table that is not overlapped by overlay.

**Since**: 14.6.0  

**Returns**: `number` | `null` - The index, or `null` when the grid has no view yet or has not been rendered.  

### getFirstRenderedVisibleColumn

::: ask-about-api getFirstRenderedVisibleColumn|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L9375

:::

_core.getFirstRenderedVisibleColumn() ⇒ number | null_

Returns the first rendered column in the DOM (usually, it is not visible in the table's viewport).

When the [MergeCells](@/api/mergeCells.md) plugin is enabled with its default `virtualized: false` setting, a merged
cell that crosses the viewport edge extends the rendered column range, so this method can return a
column index further from the viewport than usual. For the actual visible viewport, use
[Core#getFirstFullyVisibleColumn](@/api/core.md#getfirstfullyvisiblecolumn) or [Core#getFirstPartiallyVisibleColumn](@/api/core.md#getfirstpartiallyvisiblecolumn).

**Since**: 14.6.0  

**Returns**: `number` | `null` - The index, or `null` when the grid has no view yet or has not been rendered.  

### getFirstRenderedVisibleRow

::: ask-about-api getFirstRenderedVisibleRow|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L9345

:::

_core.getFirstRenderedVisibleRow() ⇒ number | null_

Returns the first rendered row in the DOM (usually, it is not visible in the table's viewport).

When the [MergeCells](@/api/mergeCells.md) plugin is enabled with its default `virtualized: false` setting, a merged
cell that crosses the viewport edge extends the rendered row range, so this method can return a row
index further from the viewport than usual. For the actual visible viewport, use
[Core#getFirstFullyVisibleRow](@/api/core.md#getfirstfullyvisiblerow) or [Core#getFirstPartiallyVisibleRow](@/api/core.md#getfirstpartiallyvisiblerow).

**Since**: 14.6.0  

**Returns**: `number` | `null` - The index, or `null` when the grid has no view yet or has not been rendered.  

### getFocusManager

::: ask-about-api getFocusManager|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L9887

:::

_core.getFocusManager() ⇒ FocusManager_

Return the Focus Manager responsible for managing the browser's focus in the table.

**Since**: 14.0.0  


### getFocusScopeManager

::: ask-about-api getFocusScopeManager|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L9897

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L9513

:::

_core.getInstance() ⇒ [Handsontable](@/api/core.md)_

Returns the Handsontable instance.


**Returns**: [`Handsontable`](@/api/core.md) - The Handsontable instance.  

### getLastColumnReadRow

::: ask-about-api getLastColumnReadRow|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L7202

:::

_Core~getLastColumnReadRow() ⇒ number_

Returns the last visual row a whole-column read covers.

The read runs in visual rows, so it has to reach `countRows()`: under NestedRows the source
array holds only the top-level records, and a `modifySourceLength` listener can report more rows
than the array has, so its length stops the read short of every row past it. The source length
stays in the `max` so a grid with no visual rows reads what it always did: with an empty data set
the end is `-1`, so `getRange()` starts at the header row and returns `[null]`, while a fully
trimmed one returns `[]`. When the source length wins, `getRange()` still stops at
`countRows()` for two different reasons: a visual index past the not-trimmed rows maps to no
physical row, so it skips it, and a row cut off by `maxRows` does map to one, but `getRange()`
clamps the range to `maxRows - 1`.


**Returns**: `number` - Visual row index.  

### getLastFullyVisibleColumn

::: ask-about-api getLastFullyVisibleColumn|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L9438

:::

_core.getLastFullyVisibleColumn() ⇒ number | null_

Returns the last fully visible column in the table viewport. When the table has overlays the method returns
the first row of the main table that is not overlapped by overlay.

**Since**: 14.6.0  

**Returns**: `number` | `null` - The index, or `null` when the grid has no view yet or has not been rendered.  

### getLastFullyVisibleRow

::: ask-about-api getLastFullyVisibleRow|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L9416

:::

_core.getLastFullyVisibleRow() ⇒ number | null_

Returns the last fully visible row in the table viewport. When the table has overlays the method returns
the first row of the main table that is not overlapped by overlay.

**Since**: 14.6.0  

**Returns**: `number` | `null` - The index, or `null` when the grid has no view yet or has not been rendered.  

### getLastPartiallyVisibleColumn

::: ask-about-api getLastPartiallyVisibleColumn|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L9482

:::

_core.getLastPartiallyVisibleColumn() ⇒ number | null_

Returns the last partially visible column in the table viewport. When the table has overlays the method returns
the first row of the main table that is not overlapped by overlay.

**Since**: 14.6.0  

**Returns**: `number` | `null` - The index, or `null` when the grid has no view yet or has not been rendered.  

### getLastPartiallyVisibleRow

::: ask-about-api getLastPartiallyVisibleRow|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L9460

:::

_core.getLastPartiallyVisibleRow() ⇒ number | null_

Returns the last partially visible row in the table viewport. When the table has overlays the method returns
the first row of the main table that is not overlapped by overlay.

**Since**: 14.6.0  

**Returns**: `number` | `null` - The index, or `null` when the grid has no view yet or has not been rendered.  

### getLastRenderedVisibleColumn

::: ask-about-api getLastRenderedVisibleColumn|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L9390

:::

_core.getLastRenderedVisibleColumn() ⇒ number | null_

Returns the last rendered column in the DOM (usually, it is not visible in the table's viewport).

When the [MergeCells](@/api/mergeCells.md) plugin is enabled with its default `virtualized: false` setting, a merged
cell that crosses the viewport edge extends the rendered column range, so this method can return a
column index further from the viewport than usual. For the actual visible viewport, use
[Core#getLastFullyVisibleColumn](@/api/core.md#getlastfullyvisiblecolumn) or [Core#getLastPartiallyVisibleColumn](@/api/core.md#getlastpartiallyvisiblecolumn).

**Since**: 14.6.0  

**Returns**: `number` | `null` - The index, or `null` when the grid has no view yet or has not been rendered.  

### getLastRenderedVisibleRow

::: ask-about-api getLastRenderedVisibleRow|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L9360

:::

_core.getLastRenderedVisibleRow() ⇒ number | null_

Returns the last rendered row in the DOM (usually, it is not visible in the table's viewport).

When the [MergeCells](@/api/mergeCells.md) plugin is enabled with its default `virtualized: false` setting, a merged
cell that crosses the viewport edge extends the rendered row range, so this method can return a row
index further from the viewport than usual. For the actual visible viewport, use
[Core#getLastFullyVisibleRow](@/api/core.md#getlastfullyvisiblerow) or [Core#getLastPartiallyVisibleRow](@/api/core.md#getlastpartiallyvisiblerow).

**Since**: 14.6.0  

**Returns**: `number` | `null` - The index, or `null` when the grid has no view yet or has not been rendered.  

### getLayoutManager

::: ask-about-api getLayoutManager|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L9922

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

### getPhysicalRowById

::: ask-about-api getPhysicalRowById|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L7035

:::

_core.getPhysicalRowById(id) ⇒ number | null_

Returns the physical index of the row that has the given id.

The id is defined by the [`rowId`](@/api/options.md#rowid) option (or `dataProvider.rowId`). Unlike
[`getVisualRowById()`](@/api/core.md#getvisualrowbyid), it also finds a row that is trimmed or filtered out.

**Since**: 19.0.0  

| Param | Type | Description |
| --- | --- | --- |
| id | `*` | The row's id. |


**Returns**: `number` | `null` - The physical row index, or `null` when no row has the id (for example, the row was
removed).  

### getPhysicalRowOfChange

::: ask-about-api getPhysicalRowOfChange|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L5580

:::

_core.getPhysicalRowOfChange(change) ⇒ number | null_

Returns the physical index of the row a change was written to.

Use it in the [`afterChange`](@/api/hooks.md#afterchange) and
[`beforeChangeRender`](@/api/hooks.md#beforechangerender) hooks to find the record of a change whose `row` is
`null`. A change to a cell with a [`validator`](@/api/options.md#validator) is written to the record it was
made on when the validator answers. When a filter or another trimming feature took that record out of the
visual space in the meantime, the record has no visual index, so the hooks report `row` as `null`, and only
the physical index still names the record. Pass the physical index to
[`getSourceDataAtRow()`](@/api/core.md#getsourcedataatrow) to read the record, or to
[`getRowIdAtPhysicalRow()`](@/api/core.md#getrowidatphysicalrow) to read its id.

The method answers for a change that waited for its validator until the `afterChange` hook that reports it
has run: while the change waits, it returns the physical row of its record now (`null` once the record was
removed), and in `beforeChangeRender` and `afterChange` it returns the physical row the change was written
to. After the `afterChange` hook, the grid no longer follows the record, so read the physical index (or the
row's id) inside the hook, and keep it if you need it later. For any other change, and for a change after its
`afterChange` hook, the method returns the physical index of the change's visual `row` now, or `null` when
`row` is `null`.

**Since**: 19.0.0  
**Example**  
```js
hot.addHook('afterChange', (changes, source) => {
  changes?.forEach((change) => {
    const physicalRow = hot.getPhysicalRowOfChange(change);

    if (physicalRow !== null) {
      save(hot.getSourceDataAtRow(physicalRow));
    }
  });
});
```

| Param | Type | Description |
| --- | --- | --- |
| change | `Array` | A change, as the [`afterChange`](@/api/hooks.md#afterchange) or [`beforeChangeRender`](@/api/hooks.md#beforechangerender) hook passes it: `[row, prop, oldValue, newValue]`. Pass the array the hook passes, not a copy. |


**Returns**: `number` | `null` - The physical row index, or `null` when the change addresses no row.  

### getPhysicalRowOfExistingRow

::: ask-about-api getPhysicalRowOfExistingRow|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L3751

:::

_Core~getPhysicalRowOfExistingRow(visualRow) ⇒ number | null_

Returns the physical row of a visual row that exists, or `null` for a row past the last one, which a write
creates and which therefore has no record to follow.


| Param | Type | Description |
| --- | --- | --- |
| visualRow | `number` | The visual row index. |



### getPhysicalRowsByIds

::: ask-about-api getPhysicalRowsByIds|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L7097

:::

_core.getPhysicalRowsByIds(ids) ⇒ Array&lt;(number\|null)&gt;_

Returns the physical indexes of the rows that have the given ids.

**Since**: 19.0.0  

| Param | Type | Description |
| --- | --- | --- |
| ids | `Array` | The row ids. |


**Returns**: `Array<(number\|null)>` - The physical row indexes, in the order of `ids`, with `null` for an id that no
row has.  

### getPlugin

::: ask-about-api getPlugin|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L9493

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L8226

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L8533

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

The [`rowHeights`](@/api/options.md#rowheights) array and function are read by the physical index
of `row`, so a height stays with its row when rows are moved, sorted, filtered, trimmed, or collapsed.

Passing [`rowHeights`](@/api/options.md#rowheights) to
[`updateSettings()`](@/api/core.md#updatesettings) discards the heights stored by
[`ManualRowResize`](@/api/manualRowResize.md), so the option applies again from that point on.

A height set through [`rowHeights`](@/api/options.md#rowheights) is returned as set, even when it is
smaller than the default row height. A height set through
[`minRowHeights`](@/api/options.md#minrowheights), or through `rowHeights` while
[`AutoRowSize`](@/api/autoRowSize.md) is enabled, is never smaller than the default row height.

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

### getRowId

::: ask-about-api getRowId|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L7002

:::

_core.getRowId(row) ⇒ \*_

Returns the id of a row, as the [`rowId`](@/api/options.md#rowid) option (or `dataProvider.rowId`) defines it.

A row's id stays with the row's record when you sort, filter, move, trim, insert, or remove rows, and when
you undo or redo any of those actions.

**Since**: 19.0.0  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |


**Returns**: `*` - The row's id, or `null` when the row does not exist, has no id, or no row ids are configured.  

### getRowIdAtPhysicalRow

::: ask-about-api getRowIdAtPhysicalRow|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L7050

:::

_core.getRowIdAtPhysicalRow(physicalRow) ⇒ \*_

Returns the id of a row, addressed by its physical index.

Unlike [`getRowId()`](@/api/core.md#getrowid), it also reads the id of a row that is trimmed or filtered
out, which has no visual index. Use it with the physical row indexes that hooks such as
[`beforeRemoveRow`](@/api/hooks.md#beforeremoverow) pass.

**Since**: 19.0.0  

| Param | Type | Description |
| --- | --- | --- |
| physicalRow | `number` | Physical row index. |


**Returns**: `*` - The row's id, or `null` when the row does not exist, has no id, or no row ids are configured.  

### getRowIds

::: ask-about-api getRowIds|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L7068

:::

_core.getRowIds([rows]) ⇒ Array_

Returns the ids of several rows at once.

**Since**: 19.0.0  

| Param | Type | Description |
| --- | --- | --- |
| [rows] | `Array<number>` | `optional` Visual row indexes. Without it, the method returns the ids of every row, in visual order. |


**Returns**: `Array` - The ids, in the order of `rows`, with `null` for a row that does not exist or has no id.  

### getSchema

::: ask-about-api getSchema|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L5224

:::

_core.getSchema() ⇒ object_

Returns schema provided by constructor settings. If it doesn't exist then it returns the schema based on the data
structure in the first row.


**Returns**: `object` - Schema object.  

### getSelected

::: ask-about-api getSelected|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L3954

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L3991

:::

_core.getSelectedActive() ⇒ Array&lt;number&gt; | undefined_

Returns the range coordinates of the active selection layer as an array. Active selection layer is the layer that
has visible focus highlight.

**Since**: 16.1.0  

**Returns**: `Array<number>` | `undefined` - Selected range as an array of coordinates or `undefined` if there is no selection.  

### getSelectedLast

::: ask-about-api getSelectedLast|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L3976

:::

_core.getSelectedLast() ⇒ Array | undefined_

Returns the last coordinates applied to the table as a an array `[startRow, startCol, endRow, endCol]`.

**Since**: 0.36.0  

**Returns**: `Array` | `undefined` - An array of the selection's coordinates.  

### getSelectedRange

::: ask-about-api getSelectedRange|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L4012

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L4042

:::

_core.getSelectedRangeActive() ⇒ [CellRange](@/api/cellRange.md) | undefined_

Returns the range coordinates of the active selection layer. Active selection layer is the layer that
has visible focus highlight.

**Since**: 16.1.0  

**Returns**: [`CellRange`](@/api/cellRange.md) | `undefined` - Selected range object or `undefined` if there is no selection.  

### getSelectedRangeLast

::: ask-about-api getSelectedRangeLast|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L4027

:::

_core.getSelectedRangeLast() ⇒ [CellRange](@/api/cellRange.md) | undefined_

Returns the last coordinates applied to the table as a CellRange object.

**Since**: 0.36.0  

**Returns**: [`CellRange`](@/api/cellRange.md) | `undefined` - Selected range object or `undefined` if there is no selection.  

### getSettings

::: ask-about-api getSettings|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L6688

:::

_core.getSettings() ⇒ TableMeta_

Returns the current global grid settings object.

The returned object contains the settings passed to the constructor or the most recent
`updateSettings()` call. It reflects the
[grid-level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options)
configuration only.

It does not include merged per-cell or per-column values. Configuration options cascade from
grid to column to cell (see
[Cascading configuration](@/guides/configuration/configuration-options/configuration-options.md#cascading-configuration)).
To read the effective value for a specific cell, use [Core#getCellMeta](@/api/core.md#getcellmeta). To read column-level meta, use [Core#getColumnMeta](@/api/core.md#getcolumnmeta).

A hook removed through `updateSettings({ <hook>: null })` reads back as `null`, so check a hook callback
read from the returned object before you call it.

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L9870

:::

_core.getShortcutManager() ⇒ [ShortcutManager](@/api/shortcutManager.md)_

Returns instance of a manager responsible for handling shortcuts stored in some contexts. It run actions after
pressing key combination in active Handsontable instance.

**Since**: 12.0.0  

**Returns**: [`ShortcutManager`](@/api/shortcutManager.md) - Instance of [ShortcutManager](@/api/shortcutManager.md)  

### getSourceData

::: ask-about-api getSourceData|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L7257

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L7286

:::

_core.getSourceDataArray([row], [column], [row2], [column2]) ⇒ Array_

Returns the source data object as an arrays of arrays format even when source data was provided in another format.
Optionally you can provide a cell range by using the `row`, `column`, `row2`, `column2` arguments, to get only a
fragment of the table data.

__Note__: This method does not participate in data transformation. If the visual data of the table is reordered,
sorted or trimmed only physical indexes are correct.

For an array of objects, each returned row holds a place for every column declared by the `columns` option
(up to `maxCols`), in visual column order. A column declared without `data` keeps its place, and its value is
`undefined`.


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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L7503

:::

_core.getSourceDataAtCell(row, column) ⇒ \*_

Returns a single value from the data source.

The `row` argument is a physical index. A numeric `column` is a visual index, so it follows moved and
trimmed columns. A hidden column keeps its index. To read a column by its physical index, translate it
first with [Core#toVisualColumn](@/api/core.md#tovisualcolumn), or, with an array of objects, pass the column's prop name. A
trimmed column has no visual index: read it by its prop name with an array of objects, or with
[Core#getSourceData](@/api/core.md#getsourcedata) and a physical range with an array of arrays. An index past the last visible
column is read as a physical index.

__Note__: [Core#setSourceDataAtCell](@/api/core.md#setsourcedataatcell) takes a physical column index, so a read and a write at the
same number can address different columns.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Physical row index. |
| column | `number` <br/> `string` <br/> `function` | Visual column index, prop name, or a `columns[].data`   accessor function (called as `column(dataRow)`). |


**Returns**: `*` - Cell data.  

### getSourceDataAtCol

::: ask-about-api getSourceDataAtCol|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L7314

:::

_core.getSourceDataAtCol(column) ⇒ Array_

Returns an array of column values from the data source.

The `column` argument is a visual index, so it follows moved and trimmed columns. A hidden column keeps
its index. To read a column by its physical index, translate it first with [Core#toVisualColumn](@/api/core.md#tovisualcolumn).
A trimmed column has no visual index, so this method cannot read it. For an array of arrays, read it
with [Core#getSourceData](@/api/core.md#getsourcedata) and a physical range.

__Note__: [Core#setSourceDataAtCell](@/api/core.md#setsourcedataatcell) takes a physical column index, so a read and a write at the
same number can address different columns.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |


**Returns**: `Array` - Array of the column's cell values.  

### getSourceDataAtRow

::: ask-about-api getSourceDataAtRow|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L7490

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L9699

:::

_core.getTableHeight() ⇒ number_

Gets the table's root container element height.

**Since**: 16.0.0  


### getTableWidth

::: ask-about-api getTableWidth|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L9709

:::

_core.getTableWidth() ⇒ number_

Gets the table's root container element width.

**Since**: 16.0.0  


### getTranslatedPhrase

::: ask-about-api getTranslatedPhrase|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L9619

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L6665

:::

_core.getValue() ⇒ \*_

Gets the value of the currently focused cell.

For column headers and row headers, returns `null`.


**Returns**: `*` - The value of the focused cell.  

### getValueToValidate

::: ask-about-api getValueToValidate|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L4747

:::

_Core~getValueToValidate(row, column, [cellMeta]) ⇒ \*_

Returns the value validation outside an edit checks for a cell.

A cell type that brings its own `valueGetter` pairs it with a validator that checks the stored form:
the choice types store a key/value entry or a multiselect array, which their getter turns into a
label or a joined string, and an edit validates the stored form too. Such a cell is validated on its
stored value. A `valueGetter` the cell configures itself only changes what the cell shows, and the
validator was written against that, so the cell is validated on its [Core#getDataAtCell](@/api/core.md#getdataatcell) value,
the getter's output included. The `modifyRowData` and `modifyData` hooks apply either way.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| [cellMeta] | `object` | `optional` The cell meta, when the caller already holds it. |



### getVisualRowById

::: ask-about-api getVisualRowById|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L7017

:::

_core.getVisualRowById(id) ⇒ number | null_

Returns the visual index of the row that has the given id.

The id is defined by the [`rowId`](@/api/options.md#rowid) option (or `dataProvider.rowId`).

**Since**: 19.0.0  

| Param | Type | Description |
| --- | --- | --- |
| id | `*` | The row's id. |


**Returns**: `number` | `null` - The visual row index, or `null` when no row has the id (for example, the row was
removed), or the row is trimmed, filtered out, or past [`maxRows`](@/api/options.md#maxrows). A hidden row
keeps its visual index.  

### getVisualRowsByIds

::: ask-about-api getVisualRowsByIds|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L7085

:::

_core.getVisualRowsByIds(ids) ⇒ Array&lt;(number\|null)&gt;_

Returns the visual indexes of the rows that have the given ids.

**Since**: 19.0.0  

| Param | Type | Description |
| --- | --- | --- |
| ids | `Array` | The row ids. |


**Returns**: `Array<(number\|null)>` - The visual row indexes, in the order of `ids`, with `null` wherever
[`getVisualRowById()`](@/api/core.md#getvisualrowbyid) returns `null`.  

### hasColHeaders

::: ask-about-api hasColHeaders|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L8264

:::

_core.hasColHeaders() ⇒ boolean_

Returns information about if this table is configured to display column headers.


**Returns**: `boolean` - `true` if the instance has the column headers enabled, `false` otherwise.  

### hasHook

::: ask-about-api hasHook|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L9541

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L8255

:::

_core.hasRowHeaders() ⇒ boolean_

Returns information about if this table is configured to display row headers.


**Returns**: `boolean` - `true` if the instance has the row headers enabled, `false` otherwise.  

### initializeThemeManager

::: ask-about-api initializeThemeManager|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L2588

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L7977

:::

_core.isColumnModificationAllowed() ⇒ boolean_

Checks if your [data format](@/guides/getting-started/binding-to-data/binding-to-data.md#compatible-data-types)
and [configuration options](@/guides/configuration/configuration-options/configuration-options.md)
allow for changing the number of columns.

Returns `false` when your data is an array of objects,
or when you use the [`columns`](@/api/options.md#columns) option.
Otherwise, returns `true`.



### isEmptyCol

::: ask-about-api isEmptyCol|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L8728

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L8718

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L4349

:::

_core.isExecutionSuspended() ⇒ boolean_

Checks if the table indexes recalculation process was suspended. See explanation
in [Core#suspendExecution](@/api/core.md#suspendexecution).

**Since**: 8.3.0  


### isListening

::: ask-about-api isListening|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L3858

:::

_core.isListening() ⇒ boolean_

Returns `true` if the current Handsontable instance is listening to keyboard input on document body.


**Returns**: `boolean` - `true` if the instance is listening, `false` otherwise.  

### isLtr

::: ask-about-api isLtr|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L783

:::

_core.isLtr() ⇒ boolean_

Checks if the grid is rendered using the left-to-right layout direction.

**Since**: 12.0.0  

**Returns**: `boolean` - True if LTR.  

### isRemovedColumnCorrection

::: ask-about-api isRemovedColumnCorrection|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L2809

:::

_Core~isRemovedColumnCorrection(prop, [source]) ⇒ boolean_

Tells whether a write of a change to a `null` property is a validator's correction for a column a removal took
while its validator call waits. The validator writes it through `this.prop`, which is `null` then. A grid with a
column declared `{ data: null }` writes through that property, so it never counts there.


| Param | Type | Description |
| --- | --- | --- |
| prop | `*` | The property of the change. |
| [source] | `string` | `optional` The change source. |



### isRenderSuspended

::: ask-about-api isRenderSuspended|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L4123

:::

_core.isRenderSuspended() ⇒ boolean_

Checks if the table rendering process was suspended. See explanation in [Core#suspendRender](@/api/core.md#suspendrender).

**Since**: 8.3.0  


### isRtl

::: ask-about-api isRtl|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L773

:::

_core.isRtl() ⇒ boolean_

Checks if the grid is rendered using the right-to-left layout direction.

**Since**: 12.0.0  

**Returns**: `boolean` - True if RTL.  

### isUnplacedCorrection

::: ask-about-api isUnplacedCorrection|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L2798

:::

_Core~isUnplacedCorrection(visualRow, [source]) ⇒ boolean_

Tells whether a write of a change to a `null` row is a validator's correction for a record a filter or a trim
took out of the visual space while its validator call waits. The validator writes it through `this.visualRow`,
which is `null` then. It does not depend on a waiting validator call: a correction written after its own call
answered has no change left to fold into, and is dropped the same way.


| Param | Type | Description |
| --- | --- | --- |
| visualRow | `number` <br/> `null` | The visual row of the change. |
| [source] | `string` | `optional` The change source. |



### isWriteBeforeRowsExist

::: ask-about-api isWriteBeforeRowsExist|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L3599

:::

_Core~isWriteBeforeRowsExist(methodName) ⇒ boolean_

Tells whether a write by visual coordinates has no row to land on yet, and warns when it has not.

Inside `afterHideColumns` and `afterHideRows` at init the source data is loaded but the grid has no
visual row yet, so a write would see every row as past the end and append a record.


| Param | Type | Description |
| --- | --- | --- |
| methodName | `string` | The public method that was called. |


**Returns**: `boolean` - `true` when the write must be skipped.  

### leaveValidatorAnswer

::: ask-about-api leaveValidatorAnswer|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L5630

:::

_Core~leaveValidatorAnswer()_

Leaves a validator answer. When the outermost one ends, its hold on the transaction of the change it answers
is released, so the functions `_runAfterValidatorAnswer()` queued run as operations of their own. A grid a
listener destroyed meanwhile runs none of them.



### listen

::: ask-about-api listen|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L3826

:::

_core.listen()_

Listen to the keyboard input on document body. This allows Handsontable to capture keyboard events and respond
in the right way.

**Emits**: [`Hooks#event:afterListen`](@/api/hooks.md#afterlisten)  


### loadData

::: ask-about-api loadData|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L4987

:::

_core.loadData(data, [source])_

The `loadData()` method replaces Handsontable's [`data`](@/api/options.md#data) with a new dataset.

Additionally, the `loadData()` method:
- Resets cells' states (e.g. cells' [formatting](@/guides/cell-features/formatting-cells/formatting-cells.md) and cells' [`readOnly`](@/api/options.md#readonly) states)
- Resets rows' states (e.g. row order)
- Resets columns' states (e.g. column order)
- Resets sorting, filters, the rows you trimmed, and the rows and columns you moved, hid, or resized at runtime.
- Applies again the state that these options declare: `hiddenRows`, `hiddenColumns`, `trimRows`, `manualRowMove`, `manualColumnMove`, `manualRowResize`, and `manualColumnResize` (for example `hiddenRows: { rows: [2] }`). Sorting that `initialConfig` of `columnSorting` or `multiColumnSorting` declares is not applied again.
- Drops the cell metadata from the `cell` option, although `getSettings().cell` still lists it. Metadata from `columns` stays.
- Clears the undo and redo history of the `UndoRedo` plugin.
- Keeps the settings, the selection (limited to the size of the new data), and merged cells.

To replace Handsontable's [`data`](@/api/options.md#data) without resetting states, use the [`updateData()`](#updatedata) method.

A change that still waits for its cell's [`validator`](@/api/options.md#validator) when you call `loadData()` is dropped:
it isn't written into the new data, also when the new data holds the same records, and
[`afterChange`](@/api/hooks.md#afterchange) never fires for it. A correction the validator writes for it is dropped too.
Validators always answer after the call that made the change returns, so this includes a synchronous validator and a
change made in the same function right before `loadData()`. An open editor that waits for that validator closes without
saving.
[`updateData()`](#updatedata) drops nothing.

Read more:
- [Binding to data](@/guides/getting-started/binding-to-data/binding-to-data.md)
- [Saving data](@/guides/getting-started/saving-data/saving-data.md)

**Emits**: [`Hooks#event:beforeLoadData`](@/api/hooks.md#beforeloaddata), [`Hooks#event:afterLoadData`](@/api/hooks.md#afterloaddata), [`Hooks#event:afterChange`](@/api/hooks.md#afterchange)  

| Param | Type | Description |
| --- | --- | --- |
| data | `Array` | An [array of arrays](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-arrays), or an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects), that contains Handsontable's data. |
| [source] | `string` | `optional` The source of the `loadData()` call. |



### markAllCellsChanged

::: ask-about-api markAllCellsChanged|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L4298

:::

_core.markAllCellsChanged()_

Marks every cell as changed, so the next render paints all of them regardless of their
[`renderMode`](@/api/options.md#rendermode). The method does not render; call
[`render()`](#render) afterwards.

**Since**: 19.0.0  
**Example**  
```js
hot.markAllCellsChanged();
hot.render(); // repaints every rendered cell, as a render does under `renderMode: 'always'`
```


### markCellChanged

::: ask-about-api markCellChanged|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L4264

:::

_core.markCellChanged(row, column)_

Marks one cell as changed, so the next render paints it even when its
[`renderMode`](@/api/options.md#rendermode) is `'onChange'` and neither its value nor its meta
changed. Use it for a renderer that reads state outside the grid, after that state changes. The
method does not render; call [`render()`](#render) afterwards.

Under the default `renderMode: 'always'` every render paints every cell, so the call is a no-op.

**Since**: 19.0.0  
**Example**  
```js
theme = 'dark'; // state the renderer of cell (0, 0) reads
hot.markCellChanged(0, 0);
hot.render();
```

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |



### observeRowShifts

::: ask-about-api observeRowShifts|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L376

:::

_Core~observeRowShifts(listener) ⇒ function_

Tells a waiting change of a row past the last one about the rows `alter()`, a write past the last row or
a spare-row option inserts or removes, by their visual rows, and about a change of the number of trimmed rows
(read on every `cacheUpdated` of the row index mapper), see `core/waitingRecords.ts`.


| Param | Type | Description |
| --- | --- | --- |
| listener | `object` | The listener. |


**Returns**: `function` - Stops telling the listener.  

### onBeforeIndexMapperCacheUpdate

::: ask-about-api onBeforeIndexMapperCacheUpdate|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L980

:::

_Core~onBeforeIndexMapperCacheUpdate(indexesChangesState, axis)_

Snapshots the selection in PHYSICAL coordinates before an index mapper rebuilds its caches.

It has to happen here: `IndexMapper#updateCache()` rebuilds every cache before it fires
`cacheUpdated`, so by then the pre-update visual space is gone and the records the selection
was laid on cannot be recovered. `Selection` takes the physical snapshot only while an editor is
open - a selection with no editor is repaired by `repairSelection()` below, on a different rule.
The grid-tracking coverage the DEV-152 grow reads is recorded on every trimming update, editor or
not, because that grow belongs to the no-editor repair.


| Param | Type | Description |
| --- | --- | --- |
| indexesChangesState | `object` | The state object of the index mapper's cache update. |
| axis | `'row'` <br/> `'column'` | The mapper axis that is about to be updated. |



### onIndexMapperCacheUpdate

::: ask-about-api onIndexMapperCacheUpdate|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L1001

:::

_Core~onIndexMapperCacheUpdate(indexesChangesState, axis) ⇒ boolean_

Reacts to an index-map cache update, and reports whether an editor was open when it landed.

That answer is RETURNED rather than stored, because both axes share this function: a column
update nested inside the row hooks would overwrite a shared flag, and by then `EditorManager`
has discarded the stranded editor, so it would write `false` and the outer row repair would run
the full record test instead of the narrower one - dropping a selection the editor deliberately
kept. Returning it gives each axis its own value.


| Param | Type | Description |
| --- | --- | --- |
| indexesChangesState | `object` | The state object of the index mapper's cache update. |
| indexesChangesState.hiddenIndexesChanged | `boolean` | Whether the hidden indexes changed. |
| indexesChangesState.trimmedIndexesChanged | `boolean` | Whether the trimmed indexes changed. |
| axis | `'row'` <br/> `'column'` | The mapper axis that was updated. |



### persistValidationResult

::: ask-about-api persistValidationResult|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L3254

:::

_Core~persistValidationResult(cellProperties, valid, structureVersion)_

Writes a validation result onto the cell's CURRENT stored meta object.

The object a validator is given is captured before it runs, and an `updateSettings` clearing the
meta cache in that window detaches it - a write on it then reaches nothing. Both directions
matter. A failure that never reaches the stored meta leaves the cell unmarked, which is the
async half of GitHub issue #7553. A pass that never reaches it leaves behind the `false` that
`restoreInvalidCellMetas` re-applied for a cell that was invalid when the clear happened, so a
corrected value keeps its red mark - and the same holds for the `allowInvalid: false` cancel
path, where the rejected edit is dropped but the cell would stay flagged.

The lookup is a peek, so a passing result never materializes a meta object on its own and
`_validateCells` keeps its O(invalid cells) retention bound. A failure does materialize, because
it has to be rendered. Physical coordinates come off the meta object itself rather than being
re-derived from the visual ones, which a row insert or move in the same window would shift.

The coordinates are only usable while the grid's structure has not moved. `LazyFactoryMap`
re-keys stored meta objects when rows or columns are inserted or removed, but the `row`/`col`
fields stamped on those objects are not rewritten - so a pair captured before such a change can
name a different cell after it, and writing through would flag a cell the user never touched.
`structureVersion` is captured when validation starts; when it has moved, the result is dropped
rather than written somewhere it does not belong. The direct write on the captured object still
happened, and that object follows the shift on its own.


| Param | Type | Description |
| --- | --- | --- |
| cellProperties | `object` | The cell meta object the validator was handed. |
| valid | `boolean` | The validation result to persist. |
| structureVersion | `number` | The structure version captured when validation started. |



### populateFromArray

::: ask-about-api populateFromArray|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L3889

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
| [method] | `string` | <code>&quot;overwrite&quot;</code> | `optional` Populate method, possible values: `'shift_down'`, `'shift_right'`, `'overwrite'`. The `input` rows may differ in length. The widest row sets the width of the populated area, and a shorter row fills the positions it does not reach with the empty-cell value (`null`). |


**Returns**: `object` | `undefined` - Ending td in pasted area (only if any cell was changed).  

### propToCol

::: ask-about-api propToCol|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L6933

:::

_core.propToCol(prop) ⇒ string | number | function | null_

Returns column index that corresponds with the given property.

Returns `null` when the argument names no column that currently exists and is visible – an
index past the last column, or one whose column is trimmed. Both forms answer the same way: a
cached property and a bare physical index on array data now agree.

A property this data set does not use is handed back unchanged, so validate with
`Number.isInteger()` rather than comparing against [Core#countCols](@/api/core.md#countcols): `null` compares as
`0` and would pass such a check.

The TypeScript declaration is narrower than what runs, at both ends. It narrows the result to
`number | null`, so a returned property name is not visible to the type checker, and it narrows
the parameter to `string | number`, so passing a `columns[].data` accessor function works at
runtime but does not type-check.


| Param | Type | Description |
| --- | --- | --- |
| prop | `string` <br/> `number` <br/> `function` | Property name, physical column index, or a `columns[].data`   accessor function. |


**Returns**: `string` | `number` | `function` | `null` - Visual column index, `null` when the argument names no
  visible column, or the passed argument when it is a property this data set does not use.  

### queueValidators

::: ask-about-api queueValidators|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L2930

:::

_Core~queueValidators(changes, [source], loadGeneration, waitingForValidator, pendingRowMetas, ledger, records, onRejected)_

Starts the validator of every change that has one, and queues each until it answers. A change the
validator rejects under `allowInvalid: false` is taken out of the list. Nothing is validated once the
set's load generation is not the current one: a `loadData()` landed in the loop (a `beforeValidate`
listener can run one), or the set is a validator's correction made after a load overtook the change it
corrects. The set is dropped then, and validating it would read the loaded records' meta, mark them
for values never written, and count the call in `_hasPendingValidation()` under the new load.


| Param | Type | Description |
| --- | --- | --- |
| changes | `Array` | The changes, in the form `[row, prop, oldValue, newValue]`. |
| [source] | `string` | `optional` The change source. |
| loadGeneration | `number` | The load generation the set was made on. |
| waitingForValidator | `object` | The queue. |
| pendingRowMetas | `Array<object>` | Collects the cell meta of the cells validated in rows that do   not exist yet. |
| ledger | `object` <br/> `null` | Orders the writes to one cell, or `null` for a validator's correction. |
| records | `object` | The records of the set's changes. Captured right before the first validator is   called, so a set no validator waits on captures nothing. |
| onRejected | `function` | Called with each rejected change, before it is taken out of the list. |



### readStoredThemeOverrides

::: ask-about-api readStoredThemeOverrides|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L2542

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L2523

:::

_Core~readThemeOverrides(settings) ⇒ object_

Reads the per-instance color scheme and density overrides from a settings object.

Only the keys actually present are returned, so a missing key keeps the value already applied
instead of resetting it to the theme default.


| Param | Type | Description |
| --- | --- | --- |
| settings | `object` | The settings object to read the overrides from. |


**Returns**: `object` - The theme overrides object.  

### recordValidatorGeneration

::: ask-about-api recordValidatorGeneration|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L554

:::

_Core~recordValidatorGeneration(record, prop, generation)_

Records an unanswered validator call made for a change, until `releaseValidatorGeneration()`.


| Param | Type | Description |
| --- | --- | --- |
| record | `object` | The tracked record of the row the validator checks. |
| prop | `*` | The property the validator checks. |
| generation | `number` | The `validationLoadGeneration` of the call. |



### refreshAfterFontsLoad

::: ask-about-api refreshAfterFontsLoad|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L2463

:::

_Core~refreshAfterFontsLoad()_

Re-measures the grid after the document finished loading a web font (DEV-199). The rows and columns
were measured with the fallback font, and the new font changes the size of the text without changing
the size of the container, so no resize observer sees it. Without this, the cells that grew stay out
of line with their row headers and frozen columns, the grid keeps its old height, and columns sized
from their content clip the wider text.

The handler fires `afterFontsLoad`, on which the sizing plugins re-measure, then drops the engine's
size caches and renders. `refreshDimensions()` is not enough: it skips the render when the container
keeps its size, which is the case for a grid with a fixed `height`. On a hidden grid the re-measure
waits until the grid is shown, and so does the render after a listener that hid the grid.



### refreshAfterFontsLoadOnceShown

::: ask-about-api refreshAfterFontsLoadOnceShown|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L2502

:::

_Core~refreshAfterFontsLoadOnceShown()_

Runs `refreshAfterFontsLoad()` again once the hidden grid is shown.



### refreshDimensions

::: ask-about-api refreshDimensions|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L4789

:::

_core.refreshDimensions()_

Updates dimensions of the table. The method compares previous dimensions with the current ones and updates accordingly.

You rarely need to call this method. Handsontable already calls it for you on a window resize and through a
`ResizeObserver` on the container. The case it does not cover is a container resized while the grid is
hidden (for example inside a `display: none` tab or accordion): the observer callback is skipped, so call
this method yourself once the grid becomes visible again. A web font that loads after the grid renders needs no
call: Handsontable re-measures its rows and columns when the document finishes loading a font.

The method renders when the measured size changed. It also renders unconditionally when the grid scrolls
with the window (no fixed `height`), so on such a grid it is not free even at an unchanged size. To repaint
the cells without re-measuring the container, use [render()](@/api/core.md#render) instead.

When the size changed while a cell editor is open, the editor moves onto its cell. If the cell was not fully
in view, the grid first scrolls it into view and renders once more, which fires
[afterScroll](@/api/hooks.md#afterscroll). An editor that waits for an asynchronous validator moves after the
validator answers, and with rendering suspended it moves after the next render.

**Emits**: [`Hooks#event:beforeRefreshDimensions`](@/api/hooks.md#beforerefreshdimensions), [`Hooks#event:afterRefreshDimensions`](@/api/hooks.md#afterrefreshdimensions)  


### releaseValidatorGeneration

::: ask-about-api releaseValidatorGeneration|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L570

:::

_Core~releaseValidatorGeneration(record, prop, generation)_

Forgets one unanswered validator call `recordValidatorGeneration()` recorded.


| Param | Type | Description |
| --- | --- | --- |
| record | `object` | The tracked record of the row the validator checks. |
| prop | `*` | The property the validator checks. |
| generation | `number` | The `validationLoadGeneration` of the call. |



### removeCellMeta

::: ask-about-api removeCellMeta|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L7593

:::

_core.removeCellMeta(row, column, key)_

Remove a property defined by the `key` argument from the cell meta object for the provided `row` and `column` coordinates.

An index that lies outside the grid's current range is not translated – it is used as the physical index as it
is, the same way [Core#setCellMeta](@/api/core.md#setcellmeta) writes one. With nothing trimmed, that keeps a coordinate captured
before the data shrank (through `updateData`, which keeps the cell meta) addressing the record it was written
to. With rows or columns trimmed (`trimRows`, a filter), the physical index the raw value names can be a live
trimmed record, or a record the grid shows at a different visual index (when the trimmed records sit before it),
so such a call removes the key from that record without an error – pass the visual index of the cell instead.

**Emits**: [`Hooks#event:beforeRemoveCellMeta`](@/api/hooks.md#beforeremovecellmeta), [`Hooks#event:afterRemoveCellMeta`](@/api/hooks.md#afterremovecellmeta)  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| key | `string` | Property name. |



### removeHook

::: ask-about-api removeHook|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L9578

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



### removeTrailingItems

::: ask-about-api removeTrailingItems|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L1364

:::

_Core~removeTrailingItems(axis, index, amount)_

Removes the last rows or columns of the grid with the `auto` source, and keeps the editor and the selection
on what is left.

It is not `alter()`: the rows and columns it removes were created without it (`adjustRowsAndCols()` calls
the data map directly), so `alter()`'s bookkeeping would be one-sided here - it lowers `fixedRowsBottom` and
splices `colHeaders`, neither of which the creation raised or extended.


| Param | Type | Description |
| --- | --- | --- |
| axis | `string` | The axis to remove from, `'row'` or `'column'`. |
| index | `number` | The visual index of the first removed row or column. |
| amount | `number` | The number of rows or columns to remove. |



### render

::: ask-about-api render|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L4205

:::

_core.render()_

Rerenders the table. Calling this method recalculates the layout, redraws the cells, and applies the changes
to the DOM. Every redrawn cell runs its cell renderer and the [cells](@/api/options.md#cells) function again.
The data, the selection, and the scroll position are left as they are.

The render covers the cells that are currently rendered: the viewport plus the buffer set by
[viewportRowRenderingOffset](@/api/options.md#viewportrowrenderingoffset) and
[viewportColumnRenderingOffset](@/api/options.md#viewportcolumnrenderingoffset). It does not cover the whole
data set, unless you turn virtualization off with [renderAllRows](@/api/options.md#renderallrows) or
[renderAllColumns](@/api/options.md#renderallcolumns). The cost therefore scales with the number of rendered
cells and with the work those functions do. The number of records you hold is not what drives it.

You rarely need to call this method. Handsontable renders itself after every CRUD operation and at other
points in its lifecycle. Call it yourself when you change something Handsontable cannot detect on its own.
The common case is [setCellMeta()](@/api/core.md#setcellmeta), which updates cell metadata without
repainting the grid. Because that method never renders, a sequence of such calls followed by one
`render()` already costs exactly one render.

When you mix metadata changes with CRUD operations, wrap the whole sequence in
[batch()](@/api/core.md#batch) and call `render()` **inside** the callback. `batch()` on its own only
suppresses the renders the CRUD operations would have triggered; it does not add one, so a callback
holding nothing but [setCellMeta()](@/api/core.md#setcellmeta) calls leaves the grid unpainted.

There is no API for rendering a single cell or a single row.

To apply new configuration options, use [updateSettings()](@/api/core.md#updatesettings). To react to a
container that changed size, use [refreshDimensions()](@/api/core.md#refreshdimensions).

For the full rendering model, see the [Understanding rendering](@/guides/optimization/rendering/rendering.md)
guide.

**Example**  
```js
hot.setCellMeta(0, 0, 'className', 'my-highlight');
hot.render(); // without this, the class is stored but not visible

// several metadata changes, still a single render
hot.setCellMeta(0, 0, 'className', 'my-highlight');
hot.setCellMeta(1, 0, 'readOnly', true);
hot.render();

// mixed with CRUD operations: batch them, and render inside the callback
hot.batch(() => {
  hot.alter('insert_row_above', 5, 45);
  hot.setCellMeta(0, 0, 'className', 'my-highlight');
  hot.render();
});
```


### repairSelection

::: ask-about-api repairSelection|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L1106

:::

_Core~repairSelection(isStructuralChange, indexesChangesState, hadOpenEditor, axis)_

Drops a selection that a TRIMMING index map has left pointing at something other than the
record it was put on.

A hidden row keeps its place in the visual space, so `selection.commit()` above is enough for
it. A trimmed row leaves that space, so the highlight's visual coordinate can outlive its
record - and a write through such a coordinate makes `applyChanges()` APPEND records to the
data set. `Selection#deselectIfHighlightStranded()` holds the rule and the reasoning.

TWO changes invalidate the captured record instead of stranding the selection, and both are
answered by re-reading it from the visual coordinate, which came through them intact:

  - a STRUCTURAL change (a row or column insert or remove) renumbers the physical space. It
    raises `trimmedIndexesChanged` exactly as a filter does, so the flag cannot tell them apart
    - but the SIZE of that space can, since only an insert or a remove changes it. This is the
    same discrimination `EditorManager` makes for an open editor.
  - a PERMUTATION (a sort, a row move) rewrites which physical index each visual index maps to
    while trimming nothing. Left unhandled it does not merely blur the record test, it INVERTS
    it: after a sort the captured index names a different record, so a healthy selection is
    dropped and a genuinely stranded one is kept.

An editor changes what this may do, and WHICH editor state matters is the whole subtlety. Two
readings are taken, because `EditorManager` acts between them inside the public hooks:

  - An editor STILL open afterwards was rebound onto its record, and it owns the selection -
    the pending commit goes through the editor's own coordinates, and `CopyPaste` refuses to
    paste while an editor is open. Nothing here may interfere; moving the selection to follow
    that editor is a separate change.
  - An editor that was open BEFORE and is gone now was discarded, because the trim took its
    record away. Nothing owns the selection any more, and the corruption is live again: the
    highlight outlives the editor and the next paste appends records. So the repair runs - but
    only against a coordinate that addresses NOTHING. `EditorManager` deliberately leaves a
    still-addressable coordinate alone so the next keystroke re-prepares against the record now
    under the cursor, and a write there lands on a real record rather than appending.


| Param | Type | Description |
| --- | --- | --- |
| isStructuralChange | `boolean` | Whether that axis's physical index count just changed. |
| indexesChangesState | `object` | The state object of the index mapper's cache update. |
| indexesChangesState.trimmedIndexesChanged | `boolean` | Whether the trimmed indexes changed. |
| indexesChangesState.indexesSequenceChanged | `boolean` | Whether the indexes sequence changed. |
| hadOpenEditor | `boolean` | Whether an editor was open when the update landed. |
| axis | `'row'` <br/> `'column'` | The mapper axis that was updated. |



### resolveRenderableScrollTarget

::: ask-about-api resolveRenderableScrollTarget|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L9068

:::

_Core~resolveRenderableScrollTarget(row, col) ⇒ Object | false_

Resolves renderable row and column indexes for scrolling, accounting for hidden indexes.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` <br/> `undefined` | Visual row index. |
| col | `number` <br/> `undefined` | Visual column index. |


**Returns**: `Object` | `false` - Resolved
  renderable indexes, or `false` when scrolling target is not reachable.  

### resolveRowHeightByPhysicalIndex

::: ask-about-api resolveRowHeightByPhysicalIndex|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L8469

:::

_Core~resolveRowHeightByPhysicalIndex(option, row) ⇒ number | undefined | null_

Resolves one row's value out of the `rowHeights` or `minRowHeights` setting. The function is called
with the physical row index, and the array is read at the entry the row was declared at (the physical
index at the time of the declaration, kept by `RowSizeSettings` across row inserts and removals), so a
height stays with its row when rows are moved, sorted, trimmed, filtered, collapsed, inserted, or
removed. Headers (negative indexes) have no physical index, so they keep the index they were given, and a row
outside the index mapper gets no value. A number and a string apply to every row, so they skip the translation.


| Param | Type | Description |
| --- | --- | --- |
| option | `string` | `rowHeights` or `minRowHeights`. |
| row | `number` | Visual row index. |



### resumeExecution

::: ask-about-api resumeExecution|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L4436

:::

_core.resumeExecution([forceFlushChanges])_

Resumes the execution process. In combination with the [Core#suspendExecution](@/api/core.md#suspendexecution)
method it allows aggregating the table logic changes after which the cache is
updated. Resuming the state automatically invokes the table cache updating process.

The method is intended to be used by advanced users. Suspending the execution
process could cause visual glitches caused by not updated the internal table cache.

Only the call that ends the outermost [Core#suspendExecution](@/api/core.md#suspendexecution) call resumes the execution and fires
the [`beforeResumeExecution`](@/api/hooks.md#beforeresumeexecution) and
[`afterResumeExecution`](@/api/hooks.md#afterresumeexecution) hooks. A forced nested call
(`forceFlushChanges`) updates the index cache too, and the execution stays suspended. A nested call, a
forced nested call, and a call while the execution is not suspended fire nothing. The execution resumes,
and `afterResumeExecution` fires, even when a `beforeResumeExecution` listener throws. A
`beforeResumeExecution` listener that leaves the execution suspended keeps it suspended: the hook fires again,
with `afterResumeExecution`, on the call that ends it.

With the `batchEvaluation` setting of the [`formulas`](@/api/options.md#formulas) option, the
[`Formulas`](@/api/formulas.md) plugin can batch HyperFormula's recalculation too, until the execution
resumes.

**Emits**: [`Hooks#event:beforeResumeExecution`](@/api/hooks.md#beforeresumeexecution), [`Hooks#event:afterResumeExecution`](@/api/hooks.md#afterresumeexecution)  
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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L4169

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L9594

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



### runOperation

::: ask-about-api runOperation|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L4676

:::

_core.runOperation(name, callback, [source]) ⇒ \*_

Runs the callback as one operation, so every change it makes is recorded as a single user action –
for example, one undo step of the [`UndoRedo`](@/api/undoRedo.md) plugin. Operations nest: called
inside another operation (a [`batch()`](@/api/core.md#batch), another `runOperation()`, or a
change a hook makes while an edit is applied), the callback joins the outer operation instead of
starting its own.

`runOperation()` neither suspends rendering nor batches the index recalculations. To do that as well,
call [`batch()`](@/api/core.md#batch), which is one operation too.

**Since**: 19.0.0  
**Example**  
```js
// Undoing restores both cells and the removed row in one step
hot.runOperation('import', () => {
  hot.setDataAtCell(0, 0, 'A');
  hot.setDataAtCell(1, 0, 'B');
  hot.alter('remove_row', 5);
}, 'myImport');
```

| Param | Type | Description |
| --- | --- | --- |
| name | `string` | The operation name. It becomes the `actionType` of the undo step when the operation is the outermost one. |
| callback | `function` | The operation. |
| [source] | `string` | `optional` The operation source, passed to the undo stack hooks. |


**Returns**: `*` - The value the callback returns.  

### scrollToFocusedCell

::: ask-about-api scrollToFocusedCell|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L9178

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L9083

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


**Returns**: `boolean` - `true` if viewport was scrolled, `false` otherwise, including when the grid has no view yet (as inside a hook that fires during initialization).  

### selectAll

::: ask-about-api selectAll|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L8996

:::

_core.selectAll([includeRowHeaders], [includeColumnHeaders], [options], [changeListener])_

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
// Select all cells without switching the keyboard focus to Handsontable.
hot.selectAll(true, true, { focusPosition: false }, false);
```

**Since**: 0.38.2  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [includeRowHeaders] | `boolean` | <code>false</code> | `optional` If `true`, includes the row headers in the selection. |
| [includeColumnHeaders] | `boolean` | <code>false</code> | `optional` If `true`, includes the column headers in the selection. |
| [options] | `object` |  | `optional` Additional object with options. Since 14.0.0. |
| [options.focusPosition] | `Object` <br/> `CellCoords` <br/> `boolean` |  | `optional` The argument allows changing the cell/header focus position. The value takes an object with a `row` and `col` properties from -N to N, where negative values point to the headers and positive values point to the cell range. If `false`, the focus position won't be changed. When the [Options#navigableHeaders](@/api/options.md#navigableheaders) option is disabled (the default), a `focusPosition` that points to a header is relocated to the nearest cell in the data set. Example: ```js hot.selectAll(0, 0, { focusPosition: { row: 0, col: 1 }, disableHeadersHighlight: true }) ``` |
| [options.disableHeadersHighlight] | `boolean` |  | `optional` If `true`, disables highlighting the headers even when the logical coordinates points on them. This only suppresses the highlight shown on headers of a fully-selected row or column. It doesn't affect the focus indicator on the individual cell or header that holds the focus, which stays visible even when [Options#navigableHeaders](@/api/options.md#navigableheaders) moves the focus onto a header. |
| [changeListener] | `boolean` | <code>true</code> | `optional` If `true`, the grid moves the browser focus to the selection's highlighted cell, as before. Unlike `selectCells()`, the grid does not start listening. If `false`, the browser focus stays on an outside input, textarea, select, or contenteditable. A focused button, the document body, or an iframe still loses focus to the highlighted cell. |



### selectCell

::: ask-about-api selectCell|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L8738

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


**Returns**: `boolean` - `true`: the selection was successful, `false`: the selection failed, or the grid has no view yet (as inside a hook that fires during initialization).  

### selectCells

::: ask-about-api selectCells|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L8799

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


**Returns**: `boolean` - `true`: the selection was successful, `false`: the selection failed, or the grid has no view yet (as inside a hook that fires during initialization).  

### selectColumns

::: ask-about-api selectColumns|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L8904

:::

_core.selectColumns(startColumn, [endColumn], [focusPosition], [changeListener]) ⇒ boolean_

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
// Select a column without switching the keyboard focus to Handsontable.
hot.selectColumns(1, 1, 0, false);
```

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| startColumn | `number` <br/> `string` |  | The visual column index or column property from which the selection starts. |
| [endColumn] | `number` <br/> `string` | <code>startColumn</code> | `optional` The visual column index or column property to which the selection finishes. If `endColumn` is not defined the column defined by `startColumn` will be selected. |
| [focusPosition] | `number` <br/> `Object` <br/> `CellCoords` | <code>0</code> | `optional` The argument allows changing the cell/header focus position. The value can take visual row index from -N to N, where negative values point to the headers and positive values point to the cell range. An object with `row` and `col` properties also can be passed to change the focus position horizontally. |
| [changeListener] | `boolean` | <code>true</code> | `optional` If `true`, the grid moves the browser focus to the selection's highlighted cell, as before. Unlike `selectCells()`, the grid does not start listening. If `false`, the browser focus stays on an outside input, textarea, select, or contenteditable. A focused button, the document body, or an iframe still loses focus to the highlighted cell. |


**Returns**: `boolean` - `true` if selection was successful, `false` otherwise, including when the grid has no view yet (as inside a hook that fires during initialization).  

### selectRows

::: ask-about-api selectRows|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L8948

:::

_core.selectRows(startRow, [endRow], [focusPosition], [changeListener]) ⇒ boolean_

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
// Select a row without switching the keyboard focus to Handsontable.
hot.selectRows(1, 1, 0, false);
```

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| startRow | `number` |  | The visual row index from which the selection starts. |
| [endRow] | `number` | <code>startRow</code> | `optional` The visual row index to which the selection finishes. If `endRow` is not defined the row defined by `startRow` will be selected. |
| [focusPosition] | `number` <br/> `Object` <br/> `CellCoords` | <code>0</code> | `optional` The argument allows changing the cell/header focus position. The value can take visual row index from -N to N, where negative values point to the headers and positive values point to the cell range. An object with `row` and `col` properties also can be passed to change the focus position vertically. |
| [changeListener] | `boolean` | <code>true</code> | `optional` If `true`, the grid moves the browser focus to the selection's highlighted cell, as before. Unlike `selectCells()`, the grid does not start listening. If `false`, the browser focus stays on an outside input, textarea, select, or contenteditable. A focused button, the document body, or an iframe still loses focus to the highlighted cell. |


**Returns**: `boolean` - `true` if selection was successful, `false` otherwise, including when the grid has no view yet (as inside a hook that fires during initialization).  

### setCellMeta

::: ask-about-api setCellMeta|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L7827

:::

_core.setCellMeta(row, column, key, value)_

Sets a property defined by the `key` property to the meta object of a cell corresponding to params `row` and `column`.

This method updates internal cell metadata only. It does not repaint the grid. To reflect visual changes (such as
`className`, `type`, or `readOnly`), call [render()](@/api/core.md#render) afterward. Because this method never
renders on its own, several such calls followed by one [render()](@/api/core.md#render) already cost exactly one
render. Wrapping them in [batch()](@/api/core.md#batch) alone does **not** repaint the grid: `batch()` only
suppresses renders that other operations would have triggered, so it still needs a
[render()](@/api/core.md#render) inside its callback. For why the repaint is a separate step, see the
[Understanding rendering](@/guides/optimization/rendering/rendering.md) guide.

An index that lies outside the grid's current range is not translated – it is used as the physical index as it
is. [Core#removeCellMeta](@/api/core.md#removecellmeta) reads such an index the same way, so a key written past the current range can
be removed again by the same coordinates. That holds with nothing trimmed. With rows or columns trimmed
(`trimRows`, a filter), the physical index the raw value names can be a live trimmed record, or a record the
grid shows at a different visual index (when the trimmed records sit before it), so such a call writes the key
onto that record – pass the visual index of the cell instead.

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L7721

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L3555

:::

_core.setDataAtCell(row, [column], [value], [source])_

Set new value to a cell. To change many cells at once (recommended way), pass an array of `changes` in format
`[[row, col, value],...]` as the first argument.

Writing past the last column creates the missing columns only where the grid can create them: an
array-of-arrays [`data`](@/api/options.md#data) source with no [`columns`](@/api/options.md#columns) option and
[`allowInsertColumn`](@/api/options.md#allowinsertcolumn) left on. With an array data source that cannot grow,
the value is still written to the matching array index, so
[`getSourceData()`](@/api/core.md#getsourcedata) returns it while the grid never displays it.

On an **object** data source – including one whose [`dataSchema`](@/api/options.md#dataschema) is a function –
that write is **deprecated as of 19.0.0** and will be ignored from 20.0.0 on: the value cannot become a column
there, so it only adds a property the schema never declared. A one-time console warning says so. To write a
field the grid shows no column for, address it by property name with
[`setDataAtRowProp()`](@/api/core.md#setdataatrowprop) instead. A grid that declares no columns at all is
exempt – there every index is past the last column, and writing is how an empty dataset gets bootstrapped.

Avoid calling this method unconditionally from inside a [`renderer`](@/api/options.md#renderer) function.
Changing a cell's data triggers Handsontable to re-render, which can re-invoke the same renderer and create an
infinite loop. If you need to update data from within a renderer, guard the call (for example, skip it when the
new value already equals the current one), or, preferably, perform the update in a data-change hook such as
[Hooks#afterChange](@/api/hooks.md#afterchange) and keep the renderer display-only.

**Emits**: [`Hooks#event:beforeChange`](@/api/hooks.md#beforechange), [`Hooks#event:afterChange`](@/api/hooks.md#afterchange)  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` <br/> `Array` | Visual row index or array of changes in format `[[row, col, value],...]`. |
| [column] | `number` | `optional` Visual column index. |
| [value] | `string` | `optional` New value. |
| [source] | `string` | `optional` String that identifies how this change will be described in the changes array (useful in [Hooks#afterChange](@/api/hooks.md#afterchange) or [Hooks#beforeChange](@/api/hooks.md#beforechange) callbacks). Set to 'edit' if left empty. |



### setDataAtCell

::: ask-about-api setDataAtCell|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L3613

:::

_Core~setDataAtCell(row, [column], [value], [source])_

The body of `setDataAtCell`, run inside its operation.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` <br/> `Array` | Visual row index or array of changes in format `[[row, col, value],...]`. |
| [column] | `number` | `optional` Visual column index. |
| [value] | `string` | `optional` New value. |
| [source] | `string` | `optional` String that identifies how this change will be described in the changes array. |



### setDataAtRowIdProp

::: ask-about-api setDataAtRowIdProp|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L7109

:::

_core.setDataAtRowIdProp(id, prop, value, [source]) ⇒ boolean_

Sets a value in the row that has the given id, wherever the row is now. If no row has the id (for example,
the row was removed), it does nothing.

For a visible row (one with a visual index, hidden rows included), it works like
[`setDataAtRowProp()`](@/api/core.md#setdataatrowprop). For a row that is trimmed or filtered out, it writes
to the source data with [`setSourceDataAtCell()`](@/api/core.md#setsourcedataatcell), so the value is not
validated and [`afterChange`](@/api/hooks.md#afterchange) does not fire for it.

**Since**: 19.0.0  

| Param | Type | Description |
| --- | --- | --- |
| id | `*` | The row's id. |
| prop | `string` <br/> `number` | The property name, or the physical column index of a row array. |
| value | `*` | The new value. |
| [source] | `string` | `optional` The source of the change, passed on to the hooks. |


**Returns**: `boolean` - `true` when a row has the id and the value was set, `false` otherwise.  

### setDataAtRowProp

::: ask-about-api setDataAtRowProp|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L3754

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



### setDataAtRowProp

::: ask-about-api setDataAtRowProp|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L3778

:::

_Core~setDataAtRowProp(row, prop, value, [source])_

The body of `setDataAtRowProp`, run inside its operation.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` <br/> `Array` | Visual row index or array of changes in format `[[row, prop, value], ...]`. |
| prop | `string` | Property name or the source string. |
| value | `string` | Value to be set. |
| [source] | `string` | `optional` String that identifies how this change will be described in changes array. |



### setSourceDataAtCell

::: ask-about-api setSourceDataAtCell|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L7332

:::

_core.setSourceDataAtCell(row, column, value, [source])_

Set the provided value in the source data set at the provided coordinates.

This method fires [`afterSetSourceDataAtCell`](@/api/hooks.md#aftersetsourcedataatcell). It doesn't fire
[`beforeChange`](@/api/hooks.md#beforechange) or [`afterChange`](@/api/hooks.md#afterchange), so a custom
`source` never reaches those two hooks. To pass a custom `source` to `afterChange`, use
[`setDataAtCell()`](@/api/core.md#setdataatcell) or
[`setDataAtRowProp()`](@/api/core.md#setdataatrowprop).

The hook also lists a change that the [`sourceDataValidator`](@/api/options.md#sourcedatavalidator)
rejects. When [`allowInvalid`](@/api/options.md#allowinvalid) is `false`, the grid doesn't store that
value, but the `changes` array of the hook still lists it.

An open editor keeps what the user typed, unless the call writes the edited cell itself: then the
editor shows the new value.

__Note__: this method takes physical row and column indexes. [Core#setDataAtCell](@/api/core.md#setdataatcell) takes a visual
row and a visual column, and [Core#setDataAtRowProp](@/api/core.md#setdataatrowprop) takes a visual row. Swapping one call for the
other with the same numbers can write to a different row when the grid is sorted or filtered. To
translate an index, use [Core#toVisualRow](@/api/core.md#tovisualrow) or [Core#toVisualColumn](@/api/core.md#tovisualcolumn). A trimmed row has no
visual index, so neither of those two methods can write it.

**Emits**: [`Hooks#event:afterSetSourceDataAtCell`](@/api/hooks.md#aftersetsourcedataatcell)  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` <br/> `Array` | Physical row index or array of changes in format `[[row, prop, value], ...]`. |
| column | `number` <br/> `string` <br/> `function` | Physical column index, prop name, or a `columns[].data`   accessor function (called as `accessor(rowObject, value)`). |
| value | `*` | The value to be set at the provided coordinates. |
| [source] | `string` | `optional` Source of the change as a string. The method passes it to the   `afterSetSourceDataAtCell` hook. In the array form, pass it as the fourth argument   (`setSourceDataAtCell(changes, undefined, undefined, source)`): a source in the second   argument only reaches the undo step, and the hook gets `undefined`. |



### setSourceDataAtCell

::: ask-about-api setSourceDataAtCell|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L7376

:::

_Core~setSourceDataAtCell(row, column, value, [source])_

The body of `setSourceDataAtCell`, run inside its operation.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` <br/> `Array` | Physical row index or array of changes in format `[[row, prop, value], ...]`. |
| column | `number` <br/> `string` <br/> `function` | Physical column index, prop name, or a `columns[].data` accessor. |
| value | `*` | The value to be set at the provided coordinates. |
| [source] | `string` | `optional` Source of the change as a string. |



### shouldRestoreSelection

::: ask-about-api shouldRestoreSelection|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L967

:::

_Core~shouldRestoreSelection(indexesChangesState) ⇒ boolean_

Tells whether an update is a PURE TRIM, which is the only shape the physical selection snapshot
can be restored across. Trimming only removes records, so the survivors of a rectangular range
stay contiguous and a `CellRange` still describes them; a permutation can scatter them.


| Param | Type | Description |
| --- | --- | --- |
| indexesChangesState | `object` | The state object of the index mapper's cache update. |
| indexesChangesState.indexesSequenceChanged | `boolean` | Whether the indexes sequence changed. |
| indexesChangesState.trimmedIndexesChanged | `boolean` | Whether the trimmed indexes changed. |



### shrinkAxis

::: ask-about-api shrinkAxis|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L1408

:::

_Core~shrinkAxis(axisState)_

Gives back the filler rows or columns at the end of one axis that its lowered minimum sizes no longer
require. Does nothing when neither of that axis's two options was lowered.


| Param | Type | Description |
| --- | --- | --- |
| axisState | `object` | The axis, its current state, and its minimum sizes before and after the update. |
| axisState.axis | `string` | The axis to shrink, `'row'` or `'column'`. |
| axisState.getCount | `function` | Gives the number of rows or columns on the axis. |
| axisState.getNotTrimmedCount | `function` | Gives the number of rows or columns left by the trimming maps. |
| axisState.isEmpty | `function` | Answers whether the row or column at a visual index is empty. |
| axisState.isRemovable | `function` | Answers whether the row or column at a visual index is a filler. |
| axisState.previousMinimum | `number` | The `minRows`/`minCols` value before the update. |
| axisState.previousSpare | `number` | The `minSpareRows`/`minSpareCols` value before the update. |
| axisState.minimum | `number` | The `minRows`/`minCols` value after the update. |
| axisState.spare | `number` | The `minSpareRows`/`minSpareCols` value after the update. |



### spliceCellsMeta

::: ask-about-api spliceCellsMeta|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L7687

:::

_core.spliceCellsMeta(visualIndex, [deleteAmount], [...cellMetaRows])_

Removes or adds one or more rows of the cell meta objects to the cell meta collections.

**Since**: 0.30.0  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| visualIndex | `number` |  | A visual index that specifies at what position to add/remove items. |
| [deleteAmount] | `number` | <code>0</code> | `optional` The number of items to be removed. If set to 0, no cell meta objects will be removed. |
| [...cellMetaRows] | `object` |  | `optional` The new cell meta row objects to be added to the cell meta collection. |



### spliceCol <span class="tag-deprecated">Deprecated</span>

::: ask-about-api spliceCol|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L3918

:::

_core.spliceCol(column, index, amount, [...elements]) ⇒ Array_

::: warning
Since 19.0.0. Handsontable no longer uses this method internally and it duplicates
&#x60;populateFromArray()&#x60;, so it will be removed in 20.0.0. Change the data yourself and write it
back with [Core#populateFromArray](@/api/core.md#populatefromarray), or use [Core#alter](@/api/core.md#alter) with &#x60;insert_col&#x60; and
&#x60;remove_col&#x60; to add or remove columns.
:::
Deprecated. Adds/removes data from the column. This method works the same as Array.splice for arrays.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Index of the column in which do you want to do splice. |
| index | `number` | Index at which to start changing the array. If negative, will begin that many elements from the end. |
| amount | `number` | An integer indicating the number of old array elements to remove. If amount is 0, no elements are removed. |
| [...elements] | `number` | `optional` The elements to add to the array. If you don't specify any elements, spliceCol simply removes elements from the array. |


**Returns**: `Array` - Returns removed portion of columns.  

### spliceRow <span class="tag-deprecated">Deprecated</span>

::: ask-about-api spliceRow|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L3936

:::

_core.spliceRow(row, index, amount, [...elements]) ⇒ Array_

::: warning
Since 19.0.0. Handsontable no longer uses this method internally and it duplicates
&#x60;populateFromArray()&#x60;, so it will be removed in 20.0.0. Change the data yourself and write it
back with [Core#populateFromArray](@/api/core.md#populatefromarray), or use [Core#alter](@/api/core.md#alter) with &#x60;insert_row&#x60; and
&#x60;remove_row&#x60; to add or remove rows.
:::
Deprecated. Adds/removes data from the row. This method works the same as Array.splice for arrays.


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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L4360

:::

_core.suspendExecution()_

Suspends the execution process. It's helpful to wrap the table logic changes
such as index changes into one call after which the cache is updated. As a result,
it improves the performance of wrapped operations.

The method is intended to be used by advanced users. Suspending the execution
process could cause visual glitches caused by not updated the internal table cache.

Calls nest. Only the outermost call suspends the execution and fires the
[`beforeSuspendExecution`](@/api/hooks.md#beforesuspendexecution) and
[`afterSuspendExecution`](@/api/hooks.md#aftersuspendexecution) hooks. When an `afterSuspendExecution`
listener throws, the method resumes the execution (firing the resume hooks) and rethrows the error.
A call a `beforeSuspendExecution` or `beforeResumeExecution` listener makes on the same instance fires no
hooks.

With the `batchEvaluation` setting of the [`formulas`](@/api/options.md#formulas) option, the
[`Formulas`](@/api/formulas.md) plugin can batch HyperFormula's recalculation too, but a render in between
still recalculates.

**Emits**: [`Hooks#event:beforeSuspendExecution`](@/api/hooks.md#beforesuspendexecution), [`Hooks#event:afterSuspendExecution`](@/api/hooks.md#aftersuspendexecution)  
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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L4133

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


### toCellMetaPhysicalCoords

::: ask-about-api toCellMetaPhysicalCoords|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L7635

:::

_Core~toCellMetaPhysicalCoords(row, column) ⇒ Array&lt;number&gt;_

Translates the visual coordinates a cell meta mutator receives into the physical ones the meta
manager stores under. An index inside the grid's current range is translated through the index
mappers; an index outside it is used as the physical index as it is, so a key written past the
current range can be read and removed again by the same coordinates. [Core#setCellMeta](@/api/core.md#setcellmeta),
[Core#removeCellMeta](@/api/core.md#removecellmeta) and `_setCellMetaDeclarative` all resolve their coordinates here, so
a change to the rule (for example for trimmed rows) reaches every one of them.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index, or a raw index past the current range. |
| column | `number` | Visual column index, or a raw index past the current range. |


**Returns**: `Array<number>` - The `[physicalRow, physicalColumn]` pair.  

### toHTML

::: ask-about-api toHTML|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L9631

:::

_core.toHTML() ⇒ string_

Converts instance into outerHTML of HTMLTableElement.

**Since**: 7.1.0  


### toPhysicalColumn

::: ask-about-api toPhysicalColumn|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L6991

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L6980

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L9639

:::

_core.toTableElement() ⇒ HTMLTableElement_

Converts instance into HTMLTableElement.

**Since**: 7.1.0  


### toVisualColumn

::: ask-about-api toVisualColumn|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L6969

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L6958

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L3846

:::

_core.unlisten()_

Stop listening to keyboard input on the document body. Calling this method makes the Handsontable inactive for
any keyboard events.



### updateData

::: ask-about-api updateData|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L4843

:::

_core.updateData(data, [source])_

The `updateData()` method replaces Handsontable's [`data`](@/api/options.md#data) with a new dataset.

The `updateData()` method:
- Keeps cells' states (e.g. cells' [formatting](@/guides/cell-features/formatting-cells/formatting-cells.md) and cells' [`readOnly`](@/api/options.md#readonly) states)
- Keeps rows' states (e.g. row order)
- Keeps columns' states (e.g. column order)
  (`updateSettings({ data, columns })` is the exception: it resets them when the columns changed, see [Core#updateSettings](@/api/core.md#updatesettings))
- Keeps the sorted row order and the trimmed rows. It does not sort or filter the new values again. To apply them, call `sort(getSortConfig())` of the `ColumnSorting` or `MultiColumnSorting` plugin, or `filter()` of the `Filters` plugin.
- Clears the undo and redo history of the `UndoRedo` plugin, unless `data` is what the grid shows
  already: the same array, a copy of it, or rows that hold the same values. Cells are compared with `===`, so a
  nested object that was copied counts as another value, and a copy of the array clears the history when the
  `NestedRows` plugin is on.

To replace Handsontable's [`data`](@/api/options.md#data) and reset states, use the [`loadData()`](#loaddata) method.

A change that still waits for its cell's [`validator`](@/api/options.md#validator) is written at its row and
column of the new data when the validator answers, so pass the same records the grid shows. A `data` update
through [`updateSettings()`](#updatesettings) runs `updateData()` too. To replace the records and drop such a
change, use `loadData()`.

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L5234

:::

_core.updateSettings(settings, [init])_

Use it if you need to change configuration after initialization. The `settings` argument is an object containing the changed
settings, declared the same way as in the initial settings object.

__Note__, that although the `updateSettings` method doesn't overwrite the previously declared settings, it might reset
the settings made post-initialization. (for example - ignore changes made using the columnResize feature).

Passing `columns` inside the `settings` object resets the states corresponding to rows and columns
(for example, row/column sequence, column width, row height, frozen columns etc.). Passing `data` does not reset these states, with one exception: when the same call changes the column layout through `columns`, the column states (width, hiding, order, sort) start over. Adding columns to the end, or removing them from the end, keeps the states of the other columns. Rows keep theirs.

After initialization, passing `data` calls [`updateData()`](@/api/core.md#updatedata) internally.
The resulting [`beforeUpdateData`](@/api/hooks.md#beforeupdatedata) and
[`afterUpdateData`](@/api/hooks.md#afterupdatedata) hooks receive `"updateSettings"` as their
`source`, while [`afterChange`](@/api/hooks.md#afterchange) receives `null` as its `changes`
argument and `"updateData"` as its `source`. If you call `updateSettings` with `data` inside
`afterChange`, check the hook's `source` to prevent an infinite loop.

Cell meta is preserved across `updateSettings`, even when `settings` includes `cell`, `cells`, or `columns`. This
covers both meta set imperatively through [Core#setCellMeta](@/api/core.md#setcellmeta) (for example, by the user or the context menu)
and meta applied from the declarative [`cell`](@/api/options.md#cell) option on an earlier call. Preserved meta
stays with its row, so it follows sorting and row moves.

Passing `cell` restates the option: it replaces every previously declared entry, so `cell: []` removes them all. On
a direct conflict, a value re-stated through `cell` takes precedence over the preserved value. Where `cell` is not
passed, an imperative [Core#setCellMeta](@/api/core.md#setcellmeta) made after the declaration wins.

A failed validation result is preserved as well, so a cell marked invalid keeps its `htInvalid` class across
`updateSettings`. To reset the validation state, use [loadData()](@/api/core.md#loaddata) or validate the cells again.

A hook function passed in `settings` replaces the function that earlier settings passed for the same hook. An
array of callbacks is added beside the callbacks earlier settings passed. A hook set to `null` removes every
callback that settings passed for it and leaves `null` in [Core#getSettings](@/api/core.md#getsettings). A hook set to `undefined` is
left as it is. Listeners added with [Core#addHook](@/api/core.md#addhook) are not affected by either.

The legacy [`fixedColumnsLeft`](@/api/options.md#fixedcolumnsleft) option is applied as
[`fixedColumnsStart`](@/api/options.md#fixedcolumnsstart), while the settings object that
[`afterUpdateSettings`](@/api/hooks.md#afterupdatesettings) receives keeps the name you passed. Passing both
names in one call throws an error. When you pass them in separate calls, the later value applies.

Four options can only be set at initialization: [`ariaTags`](@/api/options.md#ariatags),
[`layoutDirection`](@/api/options.md#layoutdirection), [`renderAllColumns`](@/api/options.md#renderallcolumns),
and [`renderAllRows`](@/api/options.md#renderallrows). A call whose `settings` names any of them throws an
error, even when you didn't set the option at initialization. The call is refused as a whole: it applies
none of its other options. The check looks at the top-level keys only, so one of these options inside
[`columns`](@/api/options.md#columns) or [`cell`](@/api/options.md#cell) throws only once it is written,
after the options in front of it were applied.

This method reinitializes the affected plugins and then renders, so it does more work than a plain
[render()](@/api/core.md#render). When only cell metadata changed, call [render()](@/api/core.md#render)
instead. See the [Understanding rendering](@/guides/optimization/rendering/rendering.md) guide.

When `settings` includes [`data`](@/api/options.md#data), loading the data does not paint the grid on its own.
Rendering is held while the data loads, so [`afterUpdateData`](@/api/hooks.md#afterupdatedata) and
[`afterChange`](@/api/hooks.md#afterchange) run with [`isRenderSuspended()`](@/api/core.md#isrendersuspended)
returning `true`. The grid paints after the settings are applied, so
[`afterUpdateSettings`](@/api/hooks.md#afterupdatesettings) also runs before that paint. Use
[`afterRender`](@/api/hooks.md#afterrender) to read the new cells.

When [Hooks#hasExternalDataSource](@/api/hooks.md#hasexternaldatasource) is true, Handsontable clears and rebinds the placeholder dataset only during
initialization or when `settings` replaces `dataProvider` with another value. A `data` value is ignored with a
warning and keeps the loaded rows, and so does the same `dataProvider` object passed again; to reload the rows,
call [`fetchData()`](@/api/dataProvider.md#fetchdata). Other keys alone (for example `height`) keep the loaded
rows and send no request. `pagination`, `columnSorting`, `filters`, or `columns`, with or without
`dataProvider`, reset the page, sort, or filters they hold, so the rows are fetched again; a `columns` value
sent without `dataProvider` also clears the sort.

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L9651

:::

_core.useTheme(themeName)_

Use the theme specified by the provided name.

When the grid runs a theme object (the `theme` option set to a theme config or a `ThemeBuilder`
instance) and you pass a different valid theme name, the grid stops using the theme object: its
injected styles and icon mapping are removed, and later changes to the theme object no longer
affect the grid. A value that is not a valid theme name (`ht-theme-<theme-name>`) is rejected
with a warning, and the grid keeps its current theme, theme object included.

**Since**: 15.0.0  

| Param | Type | Description |
| --- | --- | --- |
| themeName | `string` <br/> `boolean` <br/> `undefined` | The name of the theme to use. |



### validateAndApplyChanges

::: ask-about-api validateAndApplyChanges|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L3711

:::

_Core~validateAndApplyChanges(changes, [source], loadGeneration)_

Validates the changes and applies the ones that pass. An asynchronous validator answers after the
operation that made the change has returned, so the operation's transaction is held until the
changes land – they are part of the same user action. `validateChanges` calls back once every
validator has answered, including when every change is rejected; when it throws before that (a
`beforeValidate` listener that throws), it never calls back and the hold is released here.

The changes address the data the grid held when they were made. When a `loadData()` replaces that
data before the last validator answers, the changes are dropped: written now, they would land in
the loaded rows at the same coordinates, which usually hold other records. The generation is read
by the caller before `beforeChange`, so a load from a listener of the write's own hooks drops the
set too, and a validator's correction carries the generation of the validation that wrote it
(`getChangeLoadGeneration()`). The validation hooks still fire for them, `afterChange` does not. `updateData()` does not count as a replacement,
because the wrappers call it with the same records in a new array, often while an edit is waiting.
The functions `_addDroppedChangesListener()` added are told about a dropped set, in the order they
were added, with the same array the other change hooks received and the changes a validator rejected
under `allowInvalid: false`, which were taken out of that array.


| Param | Type | Description |
| --- | --- | --- |
| changes | `Array` | The processed changes. |
| [source] | `string` | `optional` The change source. |
| loadGeneration | `number` | The `validationLoadGeneration` the changes were made against. |



### validateCell

::: ask-about-api validateCell|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L3306

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L8066

:::

_core.validateCells([callback])_

Validates every cell in the data set,
using a [validator function](@/guides/cell-functions/cell-validator/cell-validator.md) configured for each cell.

Doesn't validate cells that are currently [trimmed](@/guides/rows/row-trimming/row-trimming.md)
or [filtered](@/guides/columns/column-filter/column-filter.md),
as such cells are not included in the data set until you bring them back again.

Does validate rows hidden with [`HiddenRows`](@/api/hiddenRows.md) and columns hidden with
[`HiddenColumns`](@/api/hiddenColumns.md). Those cells stay in the data set.

An `autocomplete`, `dropdown`, or `multiselect` cell is validated on the value it stores, the same
value an edit validates. A [`valueGetter`](@/api/options.md#valuegetter) you configure yourself is
applied first, as before.

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L8127

:::

_core.validateColumns([columns], [callback])_

Validates columns using their validator functions and calls callback when finished.

If one of the cells is invalid, the callback will be fired with `'valid'` arguments as `false` - otherwise it
 would equal `true`.

An `autocomplete`, `dropdown`, or `multiselect` cell is validated on the value it stores, the same
value an edit validates. A [`valueGetter`](@/api/options.md#valuegetter) you configure yourself is
applied first, as before.

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L8099

:::

_core.validateRows([rows], [callback])_

Validates rows using their validator functions and calls callback when finished.

If one of the cells is invalid, the callback will be fired with `'valid'` arguments as `false` - otherwise it
 would equal `true`.

An `autocomplete`, `dropdown`, or `multiselect` cell is validated on the value it stores, the same
value an edit validates. A [`valueGetter`](@/api/options.md#valuegetter) you configure yourself is
applied first, as before.

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



### writeCellMetaChange

::: ask-about-api writeCellMetaChange|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L7654

:::

_Core~writeCellMetaChange(physicalRow, physicalColumn, key, write)_

Runs one cell meta write and journals it when a transaction records. Only an imperative write
is journaled – one made while a `cell`-option or plugin-declarative scope is open is
configuration being applied, not a user action. The values are kept by reference: a meta value
can be a function or a class instance (a `renderer`, an `editor`) whose identity matters, and
meta values are replaced, not mutated in place.


| Param | Type | Description |
| --- | --- | --- |
| physicalRow | `number` | The physical row index. |
| physicalColumn | `number` | The physical column index. |
| key | `string` | The meta key. |
| write | `function` | The write. |



### writeChange

::: ask-about-api writeChange|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L3015

:::

_Core~writeChange(visualRow, prop, value, run, [recordRow])_

Writes one change into the data set, and journals it when a transaction records.


| Param | Type | Description |
| --- | --- | --- |
| visualRow | `number` | The visual row index. |
| prop | `string` <br/> `number` | The column property. |
| value | `*` | The value to write. |
| run | `ReversedCellRun` | The `writeChangesToData()` call the write belongs to. |
| [recordRow] | `number` | `optional` The physical row of the record a change that waited for its validator was   resolved to. The write goes to that row, whatever visual row (or none, for a trimmed record) it has. |



### writeSourceChange

::: ask-about-api writeSourceChange|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L7467

:::

_Core~writeSourceChange(row, prop, value, [byProp])_

Writes one value into the source data, and journals it when a transaction records.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| row | `number` <br/> `string` |  | The physical row index (a numeric string is accepted, as `setAtCell` does). |
| prop | `number` <br/> `string` <br/> `function` |  | The physical column index, the prop name, or a `columns[].data` accessor. |
| value | `*` |  | The value to write. |
| [byProp] | `boolean` | <code>false</code> | `optional` `true` to write a numeric `prop` as the key it names, past the columns   the first row declares (see `DataSource#setAtCell`). |



### writeValue

::: ask-about-api writeValue|Core

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/core.ts#L3046

:::

_Core~writeValue(visualRow, prop, value, [recordRow])_

Writes one value into the data set: by the visual row, or by the physical row of the record a change that
waited for its validator was resolved to.


| Param | Type | Description |
| --- | --- | --- |
| visualRow | `number` | The visual row index. |
| prop | `string` <br/> `number` | The column property. |
| value | `*` | The value to write. |
| [recordRow] | `number` | `optional` The physical row of the record, for a change that waited for its validator. |


