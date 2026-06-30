---
title: Configuration options
metaTitle: Options API reference - JavaScript Data Grid | Handsontable
permalink: /api/options
canonicalUrl: /api/options
searchCategory: API Reference
hotPlugin: false
editLink: false
id: oabbxeng
description: A complete list of Handsontable's configuration options that let you customize your data grid instance.
react:
  id: oga06iva
  metaTitle: Options API reference - React Data Grid | Handsontable
angular:
  id: c9r5t8yx
  metaTitle: Options API reference - Angular Data Grid | Handsontable
---

[[toc]]

## Description

[Configuration options](@/guides/getting-started/configuration-options/configuration-options.md) let you heavily customize your Handsontable instance. For example, you can:

- Enable and disable built-in features
- Enable and configure additional [plugins](@/api/plugins.md)
- Personalize Handsontable's look
- Adjust Handsontable's behavior
- Implement your own custom features

::: only-for javascript

To apply [configuration options](@/guides/getting-started/configuration-options/configuration-options.md), pass them as
a second argument of the [Handsontable constructor](@/guides/getting-started/installation/installation.md#initialize-handsontable),
using the [object literal notation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer):

Read more on the [Configuration options](@/guides/getting-started/configuration-options/configuration-options.md) page.

```js
const container = document.getElementById('example');

const hot = new Handsontable(container, {
  // configuration options, in the object literal notation
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    ['A1', 'B1', 'C1', 'D1', 'E1'],
    ['A2', 'B2', 'C2', 'D2', 'E2'],
    ['A3', 'B3', 'C3', 'D3', 'E3'],
    ['A4', 'B4', 'C4', 'D4', 'E4'],
    ['A5', 'B5', 'C5', 'D5', 'E5'],
  ],
  width: 400,
  height: 300,
  colHeaders: true,
  rowHeaders: true,
  customBorders: true,
  dropdownMenu: true,
  multiColumnSorting: true,
  filters: true,
  manualRowMove: true,
});
```
:::

::: only-for react

To apply configuration options, pass them as individual props
of the [`HotTable`](@/guides/getting-started/installation/installation.md#_4-use-the-hottable-component)
or [`HotColumn`](@/guides/columns/react-hot-column/react-hot-column.md) components.

Read more on the [Configuration options](@/guides/getting-started/configuration-options/configuration-options.md) page.

```jsx
<HotTable
  // configuration options, in the object literal notation
  licenseKey='non-commercial-and-evaluation'
  data={[
    ['A1', 'B1', 'C1', 'D1', 'E1'],
    ['A2', 'B2', 'C2', 'D2', 'E2'],
    ['A3', 'B3', 'C3', 'D3', 'E3'],
    ['A4', 'B4', 'C4', 'D4', 'E4'],
    ['A5', 'B5', 'C5', 'D5', 'E5'],
  ]}
  width={400}
  height={300}
  colHeaders={true}
  rowHeaders={true}
  customBorders={true}
  dropdownMenu={true}
  multiColumnSorting={true}
  filters={true}
  manualRowMove={true}
/>
```
:::

::: only-for angular
```ts
settings = {
  data: [
    ["A1", "B1", "C1", "D1", "E1"],
    ["A2", "B2", "C2", "D2", "E2"],
    ["A3", "B3", "C3", "D3", "E3"],
    ["A4", "B4", "C4", "D4", "E4"],
    ["A5", "B5", "C5", "D5", "E5"],
  ],
  width: 400,
  height: 300,
  colHeaders: true,
  rowHeaders: true,
  customBorders: true,
  dropdownMenu: true,
  multiColumnSorting: true,
  filters: true,
  manualRowMove: true,
};
```

```html
<hot-table [settings]="settings" />
```
:::

Depending on your needs, you can apply [configuration options](@/api/options.md) to different elements of your grid:
- [The entire grid](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options)
- [Individual columns](@/guides/getting-started/configuration-options/configuration-options.md#set-column-options)
- [Individual rows](@/guides/getting-started/configuration-options/configuration-options.md#set-row-options)
- [Individual cells](@/guides/getting-started/configuration-options/configuration-options.md#set-cell-options)
- [Individual grid elements, based on any logic you implement](@/guides/getting-started/configuration-options/configuration-options.md#implementing-custom-logic)

Read more:
- [Configuration options](@/guides/getting-started/configuration-options/configuration-options.md)


## Members

### activeHeaderClassName

::: ask-about-api activeHeaderClassName|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L178

:::

_options.activeHeaderClassName : string_

The `activeHeaderClassName` option lets you add a CSS class name
to every currently-active, currently-selected header (when a whole column or row is selected).

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](#columns), [`cells`](#cells), or [`cell`](#cell) options.

Read more:
- [`currentRowClassName`](#currentrowclassname)
- [`currentColClassName`](#currentcolclassname)
- [`currentHeaderClassName`](#currentheaderclassname)
- [`invalidCellClassName`](#invalidcellclassname)
- [`readOnlyCellClassName`](#readonlycellclassname)
- [`commentedCellClassName`](#commentedcellclassname)
- [`noWordWrapClassName`](#nowordwrapclassname)
- [`TableClassName`](#tableclassname)
- [`className`](#classname)

**Default**: <code>"ht__active_highlight"</code>  
**Category**: [Core](@/api/core.md)  
**Since**: 0.38.2  
**Example**  
```js
// add an `ht__active_highlight` CSS class name
// to every currently-active, currently-selected header
activeHeaderClassName: 'ht__active_highlight',
```


### allowEmpty

::: ask-about-api allowEmpty|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L226

:::

_options.allowEmpty : boolean_

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
To use the [`allowEmpty`](#allowempty) option, you need to set the [`validator`](#validator) option (or the [`type`](#type) option).
:::

This option can be set at any level of the [cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration):
the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options), the [`columns`](#columns) level, the [`cells`](#cells) level, and the [`cell`](#cell) level.

**Default**: <code>true</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api allowHtml|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L264

:::

_options.allowHtml : boolean_

The `allowHtml` option configures whether [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
and [`dropdown`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md) cells' [`source`](#source) data
is treated as HTML.

You can set the `allowHtml` option to one of the following:

| Setting           | Description                                         |
| ----------------- | --------------------------------------------------- |
| `false` (default) | The [`source`](#source) data is not treated as HTML |
| `true`            | The [`source`](#source) data is treated as HTML     |

__Warning:__ Setting the `allowHtml` option to `true` can cause serious XSS vulnerabilities.

Read more:
- [Autocomplete cell type](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
- [Dropdown cell type](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md)
- [`source`](#source)

**Default**: <code>false</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api allowInsertColumn|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L283

:::

_options.allowInsertColumn : boolean_

If set to `true`, the `allowInsertColumn` option adds the following menu items to the [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md):
- **Insert column left**
- **Insert column right**

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](#columns), [`cells`](#cells), or [`cell`](#cell) options.

**Default**: <code>true</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
// hide the 'Insert column left' and 'Insert column right' menu items from the context menu
allowInsertColumn: false,
```


### allowInsertRow

::: ask-about-api allowInsertRow|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L299

:::

_options.allowInsertRow : boolean_

If set to `true`, the `allowInsertRow` option adds the following menu items to the [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md):
- **Insert row above**
- **Insert row below**

**Default**: <code>true</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
// hide the 'Insert row above' and 'Insert row below' menu items from the context menu
allowInsertRow: false,
```


### allowInvalid

::: ask-about-api allowInvalid|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L330

:::

_options.allowInvalid : boolean_

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
**Category**: [Core](@/api/core.md)  
**Example**  
```js
// don't accept `invalid` values
// don't allow the user to close the cell editor
// don't save `invalid` values into the data source
allowInvalid: false,
```


### allowRemoveColumn

::: ask-about-api allowRemoveColumn|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L351

:::

_options.allowRemoveColumn : boolean_

If set to `true`, the `allowRemoveColumn` option adds the following menu items to the [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md):
- **Remove column**

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](#columns), [`cells`](#cells), or [`cell`](#cell) options.

Read more:
- [Context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)

**Default**: <code>true</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
// hide the 'Remove column' menu item from the context menu
allowRemoveColumn: false,
```


### allowRemoveRow

::: ask-about-api allowRemoveRow|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L369

:::

_options.allowRemoveRow : boolean_

If set to `true`, the `allowRemoveRow` option adds the following menu items to the [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md):
- **Remove row**

Read more:
- [Context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)

**Default**: <code>true</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
// hide the 'Remove row' menu item from the context menu
allowRemoveRow: false,
```


### ariaTags

::: ask-about-api ariaTags|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L380

:::

_options.ariaTags : boolean_

If set to `true`, the accessibility-related ARIA tags will be added to the table. If set to `false`, they
will be omitted.
Defaults to `true`.

**Default**: <code>true</code>  
**Category**: [Core](@/api/core.md)  
**Since**: 14.0.0  


### autoColumnSize

::: ask-about-api autoColumnSize|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L429

:::

_options.autoColumnSize : object | boolean_

The `autoColumnSize` option configures the [`AutoColumnSize`](@/api/autoColumnSize.md) plugin.

You can set the `autoColumnSize` option to one of the following:

| Setting   | Description                                                                                  |
| --------- | -------------------------------------------------------------------------------------------- |
| `false`   | Disable the [`AutoColumnSize`](@/api/autoColumnSize.md) plugin                               |
| `true`    | Enable the [`AutoColumnSize`](@/api/autoColumnSize.md) plugin with the default configuration |
| An object | Enable the [`AutoColumnSize`](@/api/autoColumnSize.md) plugin and modify the plugin options  |

If you set the `autoColumnSize` option to an object, you can set the following [`AutoColumnSize`](@/api/autoColumnSize.md) plugin options:

| Property                | Possible values                 | Description                                                                                                    |
| ----------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `syncLimit`             | A number \| A percentage string | The number/percentage of columns to keep in sync<br>(default: `50`)                                            |
| `useHeaders`            | `true` \| `false`               | When calculating column widths:<br>`true`: use column headers<br>`false`: don't use column headers          |
| `samplingRatio`         | A number                        | The number of samples of the same length to be used in column width calculations                               |
| `allowSampleDuplicates` | `true` \| `false`               | When calculating column widths:<br>`true`: Allow duplicate samples<br>`false`: Don't allow duplicate samples |

By default, the `autoColumnSize` option is set to `undefined`,
but the [`AutoColumnSize`](@/api/autoColumnSize.md) plugin acts as enabled.
To disable the [`AutoColumnSize`](@/api/autoColumnSize.md) plugin completely,
set the `autoColumnSize` option to `false`.

Using the [`colWidths`](#colwidths) option forcibly disables the [`AutoColumnSize`](@/api/autoColumnSize.md) plugin.

Read more:
- [Plugins: `AutoColumnSize`](@/api/autoColumnSize.md)

**Default**: <code>undefined</code>  
**Category**: [AutoColumnSize](@/api/autoColumnSize.md)  
**Example**  
```js
autoColumnSize: {
  // keep 40% of columns in sync (the rest of columns: async)
  syncLimit: '40%',
  // when calculating column widths, use column headers
  useHeaders: true,
  // when calculating column widths, use 10 samples of the same length
  samplingRatio: 10,
  // when calculating column widths, allow duplicate samples
  allowSampleDuplicates: true
},
```


### autoRowSize

::: ask-about-api autoRowSize|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L466

:::

_options.autoRowSize : object | boolean_

The `autoRowSize` option configures the [`AutoRowSize`](@/api/autoRowSize.md) plugin.

You can set the `autoRowSize` option to one of the following:

| Setting   | Description                                                                            |
| --------- | -------------------------------------------------------------------------------------- |
| `false`   | Disable the [`AutoRowSize`](@/api/autoRowSize.md) plugin                               |
| `true`    | Enable the [`AutoRowSize`](@/api/autoRowSize.md) plugin with the default configuration |
| An object | Enable the [`AutoRowSize`](@/api/autoRowSize.md) plugin and modify the plugin options  |

To give Handsontable's scrollbar a proper size, set the `autoRowSize` option to `true`.

If you set the `autoRowSize` option to an object, you can set the following [`AutoRowSize`](@/api/autoRowSize.md) plugin options:

| Property    | Possible values                 | Description                                                       |
| ----------- | ------------------------------- | ----------------------------------------------------------------- |
| `syncLimit` | A number \| A percentage string | The number/percentage of rows to keep in sync<br>(default: `500`) |

Using the [`rowHeights`](#rowheights) option forcibly disables the [`AutoRowSize`](@/api/autoRowSize.md) plugin.

Read more:
- [Plugins: `AutoRowSize`](@/api/autoRowSize.md)

**Default**: <code>undefined</code>  
**Category**: [AutoRowSize](@/api/autoRowSize.md)  
**Example**  
```js
autoRowSize: {
  // keep 40% of rows in sync (the rest of rows: async)
  syncLimit: '40%'
},
```


### autoWrapCol

::: ask-about-api autoWrapCol|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L488

:::

_options.autoWrapCol : boolean_

| Setting           | Description                                                                                                                                                                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `false` (default) | When you select a bottom-most cell, pressing <kbd>**↓**</kbd> doesn't do anything.<br><br>When you select a top-most cell, pressing <kbd>**↑**</kbd> doesn't do anything.                                                                    |
| `true`            | When you select a bottom-most cell, pressing <kbd>**↓**</kbd> takes you to the top-most cell of the next column.<br><br>When you select a top-most cell, pressing <kbd>**↑**</kbd> takes you to the bottom-most cell of the previous column. |

**Default**: <code>false</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api autoWrapRow|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L513

:::

_options.autoWrapRow : boolean_

| Setting           | Description                                                                                                                                                                                                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `false` (default) | When you select the first cell of a row, pressing <kbd>**←**</kbd>* (or <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd>\*\*) doesn't do anything.<br><br>When you select the last cell of a row, pressing <kbd>**→**</kbd>* (or <kbd>**Tab**</kbd>**) doesn't do anything.                                                  |
| `true`            | When you select the first cell of a row, pressing <kbd>**←**</kbd>* (or <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd>\*\*) takes you to the last cell of the row above.<br><br>When you select the last cell of a row, pressing <kbd>**→**</kbd>* (or <kbd>**Tab**</kbd>**) takes you to the first cell of the row below. |

\* The exact key depends on your [`layoutDirection`](#layoutdirection) configuration.<br>
\*\* Unless [`tabNavigation`](#tabnavigation) is set to `false`.

**Default**: <code>false</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
// when you select the first cell of a row, pressing ⬅ (or Shift+Tab) doesn't do anything
// when you select the last cell of a row, pressing ➡ (or Tab) doesn't do anything
autoWrapRow: false, // default setting

// when you select the first cell of a row, pressing ⬅ (or Shift+Tab) takes you to the last cell of the row above
// when you select the last cell of a row, pressing ➡ (or Tab) takes you to the first cell of the row below
autoWrapRow: true,
```


### bindRowsWithHeaders

::: ask-about-api bindRowsWithHeaders|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L545

:::

_options.bindRowsWithHeaders : boolean | string_

The `bindRowsWithHeaders` option configures the [`BindRowsWithHeaders`](@/api/bindRowsWithHeaders.md) plugin.

When enabled, each row stays permanently linked to its row header label, regardless of row sorting or row moving.
Normally, row headers display the visual row index and update as rows are reordered; with this plugin enabled,
the header travels with the data row it was originally assigned to.

You can set the `bindRowsWithHeaders` option to one of the following:

| Setting | Description                                                                  |
| ------- | ---------------------------------------------------------------------------- |
| `false` | Disable the the [`BindRowsWithHeaders`](@/api/bindRowsWithHeaders.md) plugin |
| `true`  | Enable the the [`BindRowsWithHeaders`](@/api/bindRowsWithHeaders.md) plugin  |

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](#columns), [`cells`](#cells), or [`cell`](#cell) options.

Read more:
- [Plugins: `BindRowsWithHeaders`](@/api/bindRowsWithHeaders.md)

**Default**: <code>undefined</code>  
**Category**: [BindRowsWithHeaders](@/api/bindRowsWithHeaders.md)  
**Example**  
```js
// enable the `BindRowsWithHeaders` plugin
bindRowsWithHeaders: true
```


### cell

::: ask-about-api cell|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L573

:::

_options.cell : Array&lt;Array&gt;_

The `cell` option lets you apply [configuration options](@/guides/getting-started/configuration-options/configuration-options.md) to individual cells.

The `cell` option overwrites the [top-level grid options](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options),
and the [`columns`](#columns) options.

Read more:
- [Configuration options: Setting cell options](@/guides/getting-started/configuration-options/configuration-options.md#set-cell-options)
- [`columns`](#columns)

**Default**: <code>[]</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api cells|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L616

:::

_options.cells : function_

The `cells` option lets you apply any other [configuration options](@/guides/getting-started/configuration-options/configuration-options.md) to
individual grid elements (columns, rows, cells), based on any logic you implement.

The `cells` option overwrites all other options (including options set by [`columns`](#columns) and [`cell`](#cell)).
It takes the following parameters:

| Parameter | Required | Type             | Description                                                                                                                                                                                                                                                                                                                             |
| --------- | -------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `row`     | Yes      | Number           | A physical row index                                                                                                                                                                                                                                                                                                                    |
| `column`  | Yes      | Number           | A physical column index                                                                                                                                                                                                                                                                                                                 |
| `prop`    | No       | String \| Number | If [`data`](#data) is set to an [array of arrays](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-arrays), `prop` is the same number as `column`.<br><br>If [`data`](#data) is set to an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects), `prop` is a property name for the column's data object. |

Read more:
- [Configuration options: Implementing custom logic](@/guides/getting-started/configuration-options/configuration-options.md#implement-custom-logic)
- [Configuration options: Setting row options](@/guides/getting-started/configuration-options/configuration-options.md#set-row-options)
- [`columns`](#columns)
- [`cell`](#cell)

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api checkedTemplate|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L666

:::

_options.checkedTemplate : boolean | string | number_

The `checkedTemplate` option lets you configure what value
a checked [`checkbox`](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md) cell has.

You can set the `checkedTemplate` option to one of the following:

| Setting          | Description                                                                                                                                                                              |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `true` (default) | If a [`checkbox`](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md) cell is checked,<br>the [`getDataAtCell`](@/api/core.md#getdataatcell) method for this cell returns `true`                  |
| A string         | If a [`checkbox`](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md) cell is checked,<br>the [`getDataAtCell`](@/api/core.md#getdataatcell) method for this cell returns a string of your choice |

::: warning
When you set `checkedTemplate` to a custom string value (e.g. `'Yes'`), using `true` in your data source to
represent a checked state is no longer valid. Only the exact custom string value matches a checked checkbox.
Pair `checkedTemplate` with [`uncheckedTemplate`](#uncheckedtemplate) to define both states explicitly.
:::

This option can be set at any level of the [cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration):
the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options), the [`columns`](#columns) level, the [`cells`](#cells) level, and the [`cell`](#cell) level.

Read more:
- [Checkbox cell type: Checkbox template](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md#checkbox-template)
- [`getDataAtCell()`](@/api/core.md#getdataatcell)
- [`uncheckedTemplate`](#uncheckedtemplate)

**Default**: <code>true</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api className|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L712

:::

_options.className : string | Array&lt;string&gt;_

The `className` option lets you add CSS class names to every currently-selected element.

You can set the `className` option to one of the following:

| Setting             | Description                                                      |
| ------------------- | ---------------------------------------------------------------- |
| A string            | Add a single CSS class name to every currently-selected element  |
| An array of strings | Add multiple CSS class names to every currently-selected element |

::: tip
Don't change the `className` metadata of the [column summary](@/guides/columns/column-summary/column-summary.md) row.
To style the summary row, use the class name assigned automatically by the [`ColumnSummary`](@/api/columnSummary.md) plugin: `columnSummaryResult`.
:::

To apply different CSS class names on different levels, use Handsontable's [cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration).

Read more:
- [Configuration options: Cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration)
- [`currentRowClassName`](#currentrowclassname)
- [`currentColClassName`](#currentcolclassname)
- [`currentHeaderClassName`](#currentheaderclassname)
- [`activeHeaderClassName`](#activeheaderclassname)
- [`invalidCellClassName`](#invalidcellclassname)
- [`placeholderCellClassName`](#placeholdercellclassname)
- [`commentedCellClassName`](#commentedcellclassname)
- [`noWordWrapClassName`](#nowordwrapclassname)
- [`readOnlyCellClassName`](#readonlycellclassname)
- [`TableClassName`](#tableclassname)

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
// add a `your-class-name` CSS class name
// to every currently-selected element
className: 'your-class-name',

// add `first-class-name` and `second-class-name` CSS class names
// to every currently-selected element
className: ['first-class-name', 'second-class-name'],
```


### colHeaders

::: ask-about-api colHeaders|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L746

:::

_options.colHeaders : boolean | Array&lt;string&gt; | function_

The `colHeaders` option configures your grid's column headers.

You can set the `colHeaders` option to one of the following:

| Setting  | Description                                                          |
| -------- | -------------------------------------------------------------------- |
| `true`   | Enable the default column headers ('A', 'B', 'C', ...)               |
| `false`  | Disable column headers                                               |
| An array | Define your own column headers (e.g. `['One', 'Two', 'Three', ...]`) |
| A function | Define your own column headers, using a function                     |

Read more:
- [Column header](@/guides/columns/column-header/column-header.md)

**Default**: <code>null</code>  
**Category**: [Core](@/api/core.md)  
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


### collapsibleColumns

::: ask-about-api collapsibleColumns|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L787

:::

_options.collapsibleColumns : boolean | Array&lt;object&gt;_

The `collapsibleColumns` option configures the [`CollapsibleColumns`](@/api/collapsibleColumns.md) plugin.

You can set the `collapsibleColumns` option to one of the following:

| Setting              | Description                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| `false`              | Disable the [`CollapsibleColumns`](@/api/collapsibleColumns.md) plugin                            |
| `true`               | Enable the [`CollapsibleColumns`](@/api/collapsibleColumns.md) plugin                             |
| An array of objects  | Enable the [`CollapsibleColumns`](@/api/collapsibleColumns.md) plugin for selected column headers |

When using an array of objects, specify the header to make collapsible using `row` and `col`.
The `row` value is a negative integer that counts header levels from the bottom of the header area:
`-1` is the header row closest to the data, `-2` is one level above, and so on.
This option requires the [`nestedHeaders`](#nestedheaders) plugin to be configured.

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](#columns), [`cells`](#cells), or [`cell`](#cell) options.

Read more:
- [Plugins: `CollapsibleColumns`](@/api/collapsibleColumns.md)
- [`nestedHeaders`](#nestedheaders)

**Default**: <code>undefined</code>  
**Category**: [CollapsibleColumns](@/api/collapsibleColumns.md)  
**Example**  
```js
// enable column collapsing for all headers
collapsibleColumns: true,

// enable column collapsing for selected headers
collapsibleColumns: [
  {row: -4, col: 1, collapsible: true},
  {row: -3, col: 5, collapsible: true}
],
```


### columnHeaderHeight

::: ask-about-api columnHeaderHeight|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L812

:::

_options.columnHeaderHeight : number | Array&lt;number&gt;_

The `columnHeaderHeight` option configures the height of column headers.

You can set the `columnHeaderHeight` option to one of the following:

| Setting  | Description                                         |
| -------- | --------------------------------------------------- |
| A number | Set the same height for every column header         |
| An array | Set different heights for individual column headers |

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
// set the same height for every column header
columnHeaderHeight: 25,

// set different heights for individual column headers
columnHeaderHeight: [25, 30, 55],
```


### columns

::: ask-about-api columns|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L867

:::

_options.columns : Array&lt;object&gt; | function_

The `columns` option lets you apply any other [configuration options](@/guides/getting-started/configuration-options/configuration-options.md) to individual columns (or ranges of columns).

You can set the `columns` option to one of the following:
- An array of objects (each object represents one column)
- A function that returns an array of objects

The `columns` option overwrites the [top-level grid options](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).

When you use `columns`, the [`startCols`](#startcols), [`minCols`](#mincols), and [`maxCols`](#maxcols) options are ignored.

Read more:
- [Configuration options: Setting column options](@/guides/getting-started/configuration-options/configuration-options.md#set-column-options)
- [`startCols`](#startcols)
- [`minCols`](#mincols)
- [`maxCols`](#maxcols)
- [`data`](#data)

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
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


### columnSorting

::: ask-about-api columnSorting|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L940

:::

_options.columnSorting : boolean | object_

The `columnSorting` option configures the [`ColumnSorting`](@/api/columnSorting.md) plugin.

You can set the `columnSorting` option to one of the following:

| Setting    | Description                                                                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `true`     | Enable the [`ColumnSorting`](@/api/columnSorting.md) plugin with the default configuration                                             |
| `false`    | Disable the [`ColumnSorting`](@/api/columnSorting.md) plugin                                                                           |
| An object  | - Enable the [`ColumnSorting`](@/api/columnSorting.md) plugin<br>- Modify the [`ColumnSorting`](@/api/columnSorting.md) plugin options |

If you set the `columnSorting` option to an object,
you can set the following [`ColumnSorting`](@/api/columnSorting.md) plugin options:

| Option                   | Possible settings                                                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `indicator`              | `true`: Display the arrow icon in the column header, to indicate a sortable column<br>`false`: Don't display the arrow icon in the column header  |
| `headerAction`           | `true`: Enable clicking on the column header to sort the column<br>`false`: Disable clicking on the column header to sort the column             |
| `sortEmptyCells`         | `true`: Sort empty cells as well<br>`false`: Place empty cells at the end                                                                        |
| `compareFunctionFactory` | A [custom compare function](@/guides/rows/rows-sorting/rows-sorting.md#add-a-custom-comparator)                                                                |

If you set the `columnSorting` option to an object,
you can also sort individual columns at Handsontable's initialization.
In the `columnSorting` object, add an object named `initialConfig`,
with the following properties:

| Option      | Possible settings   | Description                                                      |
| ----------- | ------------------- | ---------------------------------------------------------------- |
| `column`    | A number            | The index of the column that you want to sort at initialization  |
| `sortOrder` | `'asc'` \| `'desc'` | The sorting order:<br>`'asc'`: ascending<br>`'desc'`: descending |

Read more:
- [Rows sorting](@/guides/rows/rows-sorting/rows-sorting.md)
- [Rows sorting: Custom compare functions](@/guides/rows/rows-sorting/rows-sorting.md#add-a-custom-comparator)
- [`multiColumnSorting`](#multicolumnsorting)

**Default**: <code>undefined</code>  
**Category**: [ColumnSorting](@/api/columnSorting.md)  
**Example**  
```js
// enable the `ColumnSorting` plugin
columnSorting: true

// enable the `ColumnSorting` plugin with custom configuration
columnSorting: {
  // sort empty cells as well
  sortEmptyCells: true,
  // display the arrow icon in the column header
  indicator: true,
  // disable clicking on the column header to sort the column
  headerAction: false,
  // add a custom compare function
  compareFunctionFactory(sortOrder, columnMeta) {
    return function(value, nextValue) {
      // some value comparisons which will return -1, 0 or 1...
    }
  }
}

// enable the `ColumnSorting` plugin with an initial sort order:
// sort column 1 in ascending order at initialization
columnSorting: {
  initialConfig: {
    column: 1,
    sortOrder: 'asc'
  }
}
```


### columnSummary

::: ask-about-api columnSummary|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L993

:::

_options.columnSummary : Array&lt;object&gt; | function_

The `columnSummary` option configures the [`ColumnSummary`](@/api/columnSummary.md) plugin.

You can set the `columnSummary` option to an array of objects.
Each object configures a single column summary, using the following properties:

| Property                 | Possible values                                                         | Description                                                                                                                  |
| ------------------------ | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `sourceColumn`           | A number                                                                | [Column to summarize](@/guides/columns/column-summary/column-summary.md#step-2-select-cells-that-you-want-to-summarize)                     |
| `ranges`                 | An array                                                                | [Ranges of rows to summarize](@/guides/columns/column-summary/column-summary.md#step-2-select-cells-that-you-want-to-summarize)             |
| `type`                   | `'sum'` \| `'min'` \| `'max'` \| `'count'` \| `'average'` \| `'custom'` | [Summary function](@/guides/columns/column-summary/column-summary.md#step-3-calculate-your-summary)                                         |
| `destinationRow`         | A number                                                                | [Destination cell's row coordinate](@/guides/columns/column-summary/column-summary.md#step-4-provide-the-destination-cell-s-coordinates)    |
| `destinationColumn`      | A number                                                                | [Destination cell's column coordinate](@/guides/columns/column-summary/column-summary.md#step-4-provide-the-destination-cell-s-coordinates) |
| `forceNumeric`           | `true`  \| `false`                                                      | [Treat non-numerics as numerics](@/guides/columns/column-summary/column-summary.md#force-numeric-values)                                  |
| `reversedRowCoords`      | `true`  \| `false`                                                      | [Reverse row coordinates](@/guides/columns/column-summary/column-summary.md#step-5-make-room-for-the-destination-cell)                      |
| `suppressDataTypeErrors` | `true`  \| `false`                                                      | [Suppress data type errors](@/guides/columns/column-summary/column-summary.md#throw-data-type-errors)                                    |
| `readOnly`               | `true`  \| `false`                                                      | Make summary cell [read-only](@/api/options.md#readonly)                                                                                           |
| `roundFloat`             | `true`  \| `false`  \| A number                                         | [Round summary result](@/guides/columns/column-summary/column-summary.md#round-a-column-summary-result)                                  |
| `customFunction`         | A function                                                              | [Custom summary function](@/guides/columns/column-summary/column-summary.md#implement-a-custom-summary-function)                         |

Read more:
- [Column summary](@/guides/columns/column-summary/column-summary.md)
- [Plugins: `ColumnSummary`](@/api/columnSummary.md)

**Default**: <code>undefined</code>  
**Category**: [ColumnSummary](@/api/columnSummary.md)  
**Example**  
```js
columnSummary: [
  {
    sourceColumn: 0,
    ranges: [
      [0, 2], [4], [6, 8]
    ],
    type: 'custom',
    destinationRow: 4,
    destinationColumn: 1,
    forceNumeric: true,
    reversedRowCoords: true,
    suppressDataTypeErrors: false,
    readOnly: true,
    roundFloat: false,
    customFunction(endpoint) {
       return 100;
    }
  }
],
```


### colWidths

::: ask-about-api colWidths|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1041

:::

_options.colWidths : number | Array&lt;number&gt; | string | Array&lt;string&gt; | Array&lt;undefined&gt; | function_

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
- [`autoColumnSize`](#autocolumnsize)

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api commentedCellClassName|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1071

:::

_options.commentedCellClassName : string_

The `commentedCellClassName` option lets you add a CSS class name to cells
that have comments.

Read more:
- [Comments](@/guides/cell-features/comments/comments.md)
- [`comments`](#comments)
- [`readOnlyCellClassName`](#readonlycellclassname)
- [`currentRowClassName`](#currentrowclassname)
- [`currentHeaderClassName`](#currentheaderclassname)
- [`activeHeaderClassName`](#activeheaderclassname)
- [`invalidCellClassName`](#invalidcellclassname)
- [`placeholderCellClassName`](#placeholdercellclassname)
- [`readOnlyCellClassName`](#readonlycellclassname)
- [`noWordWrapClassName`](#nowordwrapclassname)
- [`TableClassName`](#tableclassname)
- [`className`](#classname)

**Default**: <code>"htCommentCell"</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
// add a `has-comment` CSS class name
// to each cell that has a comment
commentedCellClassName: 'has-comment',
```


### comments

::: ask-about-api comments|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1124

:::

_options.comments : boolean | Array&lt;object&gt;_

The `comments` option configures the [`Comments`](@/api/comments.md) plugin.

You can set the `comments` option to one of the following:

| Setting   | Description                                                                                                                                                                           |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `true`    | - Enable the [`Comments`](@/api/comments.md) plugin<br>- Add comment menu items to the [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)                                 |
| `false`   | Disable the [`Comments`](@/api/comments.md) plugin                                                                                                                                    |
| An object | - Enable the [`Comments`](@/api/comments.md) plugin<br>- Add comment menu items to the [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)<br>- Configure comment settings |

If you set the `comments` option to an object, you can configure the following comment options:

| Option         | Possible settings           | Description                                         |
| -------------- | --------------------------- | --------------------------------------------------- |
| `displayDelay` | A number (default: `250`)   | Display comments after a delay (in milliseconds)    |
| `readOnly`     | `true` \| `false` (default) | `true`: Make comments read-only                     |
| `style`        | An object                   | Set comment boxes' `width` and `height` (in pixels) |

Read more:
- [Comments](@/guides/cell-features/comments/comments.md)
- [Context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)
- [`width`](#width)
- [`height`](#height)
- [`readOnly`](#readonly)
- [`commentedCellClassName`](#commentedcellclassname)

**Default**: <code>false</code>  
**Category**: [Comments](@/api/comments.md)  
**Example**  
```js
// enable the `Comments` plugin
comments: true,

// enable the `Comments` plugin
// and configure its settings
comments: {
  // display all comments with a 1-second delay
  displayDelay: 1000,
  // make all comments read-only
  readOnly: true,
  // set the default size of all comment boxes
  style: {
    width: 300,
    height: 100
  }
}
```


### contextMenu

::: ask-about-api contextMenu|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1185

:::

_options.contextMenu : boolean | Array&lt;string&gt; | object_

The `contextMenu` option configures the [`ContextMenu`](@/api/contextMenu.md) plugin.

You can set the `contextMenu` option to one of the following:

| Setting   | Description                                                                                                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `false`   | Disable the [`ContextMenu`](@/api/contextMenu.md) plugin                                                                                                                                                |
| `true`    | - Enable the [`ContextMenu`](@/api/contextMenu.md) plugin<br>- Use the [default context menu options](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-default-options)                 |
| An array  | - Enable the [`ContextMenu`](@/api/contextMenu.md) plugin<br>- Modify [individual context menu options](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-specific-options)              |
| An object | - Enable the [`ContextMenu`](@/api/contextMenu.md) plugin<br>- Apply a [custom context menu configuration](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-a-fully-custom-configuration) |

Read more:
- [Context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)
- [Context menu: Context menu with default options](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-default-options)
- [Context menu: Context menu with specific options](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-specific-options)
- [Context menu: Context menu with fully custom configuration options](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-a-fully-custom-configuration)
- [Plugins: `ContextMenu`](@/api/contextMenu.md)

**Default**: <code>undefined</code>  
**Category**: [ContextMenu](@/api/contextMenu.md)  
**Example**  
```js
// enable the `ContextMenu` plugin
// use the default context menu options
contextMenu: true,

// enable the `ContextMenu` plugin
// and modify individual context menu options
contextMenu: ['row_above', 'row_below', '---------', 'undo', 'redo'],

// enable the `ContextMenu` plugin
// and apply a custom context menu configuration
contextMenu: {
  items: {
    'option1': {
      name: 'Option 1'
    },
    'option2': {
      name: 'Option 2',
      submenu: {
        items: [
          {
            key: 'option2:suboption1',
            name: 'Suboption 1',
            callback: function(key, options) {
              ...
            }
          },
          ...
        ]
      }
    }
  }
},
```


### copyable

::: ask-about-api copyable|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1234

:::

_options.copyable : boolean_

The `copyable` option determines whether a cell's value can be copied to the clipboard or not.

You can set the `copyable` option to one of the following:

| Setting                                                                                                        | Description                                                                                                            |
| -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `true` (default)                                                                                               | - On pressing <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**C**</kbd>, add the cell's value to the clipboard         |
| `false`<br>(default for the [`password`](@/guides/cell-types/password-cell-type/password-cell-type.md) [cell type](#type))        | - On pressing <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**C**</kbd>, add an empty string (`""`) to the clipboard   |

Read more:
- [Clipboard](@/guides/cell-features/clipboard/clipboard.md)
- [Configuration options: Cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration)
- [Password cell type](@/guides/cell-types/password-cell-type/password-cell-type.md)

**Default**: <code>true</code>  
**Category**: [Core](@/api/core.md)  
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


### copyPaste

::: ask-about-api copyPaste|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1301

:::

_options.copyPaste : object | boolean_

The `copyPaste` option configures the [`CopyPaste`](@/api/copyPaste.md) plugin.

You can set the `copyPaste` option to one of the following:

| Setting           | Description                                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `true` (default)  | Enable the [`CopyPaste`](@/api/copyPaste.md) plugin with the default configuration                                     |
| `false`           | Disable the [`CopyPaste`](@/api/copyPaste.md) plugin                                                                   |
| An object         | - Enable the [`CopyPaste`](@/api/copyPaste.md) plugin<br>- Modify the [`CopyPaste`](@/api/copyPaste.md) plugin options |

##### copyPaste: Additional options

If you set the `copyPaste` option to an object, you can set the following `CopyPaste` plugin options:

| Option                   | Possible settings                                  | Description                                                                                                                                                                                         |
| ------------------------ | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `columnsLimit`           | A number (default: `Infinity`)                     | The maximum number of columns that can be copied                                                                                                                                                    |
| `rowsLimit`              | A number (default: `Infinity`)                     | The maximum number of columns that can be copied                                                                                                                                                    |
| `pasteMode`              | `'overwrite'` \| `'shift_down'` \| `'shift_right'` | When pasting:<br>`'overwrite'`: overwrite the currently-selected cells<br>`'shift_down'`: move the currently-selected cells down<br>`'shift_right'`: move the currently-selected cells to the right |
| `copyColumnHeaders`      | Boolean (default: `false`)                         | `true`: add a context menu option for copying cells along with their nearest column headers                                                                                                         |
| `copyColumnGroupHeaders` | Boolean (default: `false`)                         | `true`: add a context menu option for copying cells along with all their related columns headers                                                                                                    |
| `copyColumnHeadersOnly`  | Boolean (default: `false`)                         | `true`: add a context menu option for copying column headers nearest to the selected cells (without copying cells)                                                                    |
| `uiContainer`            | An HTML element                                    | The UI container for the secondary focusable element                                                                                                                                                |

Read more:
- [Plugins: `CopyPaste`](@/api/copyPaste.md)
- [Guides: Clipboard](@/guides/cell-features/clipboard/clipboard.md)

**Default**: <code>true</code>  
**Category**: [CopyPaste](@/api/copyPaste.md)  
**Example**  
```js
// enable the plugin with the default configuration
copyPaste: true // set by default

// disable the plugin
copyPaste: false,

// enable the plugin with a custom configuration
copyPaste: {
  // set a maximum number of columns that can be copied
  columnsLimit: 25,

  // set a maximum number of rows that can be copied
  rowsLimit: 50,

  // set the paste behavior
  pasteMode: 'shift_down',

  // add the option to copy cells along with their nearest column headers
  copyColumnHeaders: true,

  // add the option to copy cells along with all their related columns headers
  copyColumnGroupHeaders: true,

  // add the option to copy just column headers (without copying cells)
  copyColumnHeadersOnly: true,

  // set a UI container
  uiContainer: document.body,
},
```


### currentColClassName

::: ask-about-api currentColClassName|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1329

:::

_options.currentColClassName : string_

The `currentColClassName` option lets you add a CSS class name
to each cell of the currently-visible, currently-selected columns.

Read more:
- [`currentRowClassName`](#currentrowclassname)
- [`currentHeaderClassName`](#currentheaderclassname)
- [`activeHeaderClassName`](#activeheaderclassname)
- [`invalidCellClassName`](#invalidcellclassname)
- [`placeholderCellClassName`](#placeholdercellclassname)
- [`readOnlyCellClassName`](#readonlycellclassname)
- [`commentedCellClassName`](#commentedcellclassname)
- [`noWordWrapClassName`](#nowordwrapclassname)
- [`TableClassName`](#tableclassname)
- [`className`](#classname)

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
// add a `your-class-name` CSS class name
// to each cell of the currently-visible, currently-selected columns
currentColClassName: 'your-class-name',
```


### currentHeaderClassName

::: ask-about-api currentHeaderClassName|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1356

:::

_options.currentHeaderClassName : string_

The `currentHeaderClassName` option lets you add a CSS class name
to every currently-visible, currently-selected header.

Read more:
- [`currentRowClassName`](#currentrowclassname)
- [`currentColClassName`](#currentcolclassname)
- [`activeHeaderClassName`](#activeheaderclassname)
- [`invalidCellClassName`](#invalidcellclassname)
- [`readOnlyCellClassName`](#readonlycellclassname)
- [`commentedCellClassName`](#commentedcellclassname)
- [`noWordWrapClassName`](#nowordwrapclassname)
- [`TableClassName`](#tableclassname)
- [`className`](#classname)

**Default**: <code>"ht__highlight"</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
// add an `ht__highlight` CSS class name
// to every currently-visible, currently-selected header
currentHeaderClassName: 'ht__highlight',
```


### currentRowClassName

::: ask-about-api currentRowClassName|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1384

:::

_options.currentRowClassName : string_

The `currentRowClassName` option lets you add a CSS class name
to each cell of the currently-visible, currently-selected rows.

Read more:
- [`currentColClassName`](#currentcolclassname)
- [`currentHeaderClassName`](#currentheaderclassname)
- [`activeHeaderClassName`](#activeheaderclassname)
- [`invalidCellClassName`](#invalidcellclassname)
- [`placeholderCellClassName`](#placeholdercellclassname)
- [`readOnlyCellClassName`](#readonlycellclassname)
- [`commentedCellClassName`](#commentedcellclassname)
- [`noWordWrapClassName`](#nowordwrapclassname)
- [`TableClassName`](#tableclassname)
- [`className`](#classname)

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
// add a `your-class-name` CSS class name
// to each cell of the currently-visible, currently-selected rows
currentRowClassName: 'your-class-name',
```


### customBorders

::: ask-about-api customBorders|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1497

:::

_options.customBorders : boolean | Array&lt;object&gt;_

The `customBorders` option configures the [`CustomBorders`](@/api/customBorders.md) plugin.

To enable the [`CustomBorders`](@/api/customBorders.md) plugin
(and add its menu items to the [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)),
set the `customBorders` option to `true`.

To enable the [`CustomBorders`](@/api/customBorders.md) plugin
and add a predefined border around a particular cell,
set the `customBorders` option to an array of objects.
Each object represents a border configuration for one cell, and has the following properties:

| Property | Sub-properties                | Types                                                 | Description                                                       |
| -------- | ----------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------- |
| `row`    | -                             | `row`: Number                                         | The cell's row coordinate.                                        |
| `col`    | -                             | `col`: Number                                         | The cell's column coordinate.                                     |
| `start`  | `width`<br>`color`<br>`style` | `width`: Number<br>`color`: String<br>`style`: String | If the [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is LTR (default): `start` sets the width (`width`), color (`color`) and style (`style`) of the left-hand border.<br><br>If the [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is RTL: `start` sets the width (`width`), color (`color`) and style (`style`) of the right-hand border. |
| `end`    | `width`<br>`color`<br>`style` | `width`: Number<br>`color`: String<br>`style`: String | If the [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is LTR (default): `end` sets the width (`width`), color (`color`) and style (`style`) of the right-hand border.<br><br>If the [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is RTL: `end` sets the width (`width`), color (`color`) and style (`style`) of the left-hand border. |
| `top`    | `width`<br>`color`<br>`style` | `width`: Number<br>`color`: String<br>`style`: String | Sets the width (`width`), color (`color`) and style (`style`) of the top border. |
| `bottom` | `width`<br>`color`<br>`style` | `width`: Number<br>`color`: String<br>`style`: String | Sets the width (`width`), color (`color`) and style (`style`) of the bottom border. |

To enable the [`CustomBorders`](@/api/customBorders.md) plugin
and add a predefined border around a range of cells,
set the `customBorders` option to an array of objects.
Each object represents a border configuration for a single range of cells, and has the following properties:

| Property | Sub-properties                               | Types                                                            | Description                                                                                  |
| -------- | -------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `range`  | `from` {`row`, `col`}<br>`to` {`row`, `col`} | `from`: Object<br>`to`: Object<br>`row`: Number<br>`col`: Number | If the [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is LTR (default):<br>- `from` selects the range's top-left corner.<br>- `to` selects the range's bottom-right corner.<br><br>If the [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is RTL: <br>- `from` selects the range's top-right corner.<br>- `to` selects the range's bottom-left corner. |
| `start`  | `width`<br>`color`<br>`style` | `width`: Number<br>`color`: String<br>`style`: String | If the [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is LTR (default): `start` sets the width (`width`), color (`color`) and style (`style`) of the left-hand border.<br><br>If the [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is RTL: `start` sets the width (`width`), color (`color`) and style (`style`) of the right-hand border. |
| `end`    | `width`<br>`color`<br>`style` | `width`: Number<br>`color`: String<br>`style`: String | If the [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is LTR (default): `end` sets the width (`width`), color (`color`) and style (`style`) of the right-hand border.<br><br>If the [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is RTL: `end` sets the width (`width`), color (`color`) and style (`style`) of the left-hand border. |
| `top`    | `width`<br>`color`<br>`style` | `width`: Number<br>`color`: String<br>`style`: String | Sets the width (`width`), color (`color`) and style (`style`) of the top border. |
| `bottom` | `width`<br>`color`<br>`style` | `width`: Number<br>`color`: String<br>`style`: String | Sets the width (`width`), color (`color`) and style (`style`) of the bottom border. |

Read more:
- [Formatting cells: Custom cell borders](@/guides/cell-features/formatting-cells/formatting-cells.md#custom-cell-borders)
- [Context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)
- [Plugins: `CustomBorders`](@/api/customBorders.md)
- [Layout direction](@/guides/internationalization/layout-direction/layout-direction.md)
- [`layoutDirection`](#layoutdirection)

**Default**: <code>false</code>  
**Category**: [CustomBorders](@/api/customBorders.md)  
**Example**  
```js
// enable the `CustomBorders` plugin
customBorders: true,

// enable the `CustomBorders` plugin
// and add a predefined border for a particular cell
customBorders: [
  // add an object with a border configuration for one cell
  {
    // set the cell's row coordinate
    row: 2,
    // set the cell's column coordinate
    col: 2,
    // set the left/right border's width and color
    start: {
      width: 2,
      color: 'red'
    },
    // set the right/left border's width, color and style
    end: {
      width: 1,
      color: 'green',
      style: 'dashed'
    },
    // set the top border's width and color
    top: '',
    // set the bottom border's width and color
    bottom: ''
  }
],

// enable the `CustomBorders` plugin
// and add a predefined border for a range of cells
customBorders: [
  // add an object with a border configuration for one range of cells
  {
    // select a range of cells
    range: {
      // set the range's top-left corner
      from: {
        row: 1,
        col: 1
      },
      // set the range's bottom-right corner
      to: {
        row: 3,
        col: 4
      }
    },
    // set the left/right border's width, color and style
    start: {
      width: 2,
      color: 'red',
      style: 'dashed'
    },
    // set the right/left border's width and color
    end: {},
    // set the top border's width and color
    top: {},
    // set the bottom border's width and color
    bottom: {}
  }
],
```


### data

::: ask-about-api data|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1549

:::

_options.data : Array&lt;Array&gt; | Array&lt;object&gt;_

The `data` option sets the initial [data](@/guides/getting-started/binding-to-data/binding-to-data.md) of your Handsontable instance.

Handsontable's data is bound to your source data by reference (i.e. when you edit Handsontable's data, your source data alters as well).

You can set the `data` option:
- Either to an [array of arrays](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-arrays).
- Or to an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects).

If you don't set the `data` option (or set it to `null`), Handsontable renders as an empty 5x5 grid by default.

When used inside the [`columns`](#columns) option, `data` has a different meaning: it acts as a property name
(or a dot-separated path) pointing to the field in each data row object that this column reads from and writes to.
In this context, `data` is not the full dataset but a column accessor string.

Read more:
- [Binding to data](@/guides/getting-started/binding-to-data/binding-to-data.md)
- [`dataSchema`](#dataschema)
- [`startRows`](#startrows)
- [`startCols`](#startcols)

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api dataDotNotation|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1624

:::

_options.dataDotNotation : boolean_

If `true`, Handsontable will interpret the dots in the columns mapping as a nested object path. If your dataset contains
the dots in the object keys and you don't want Handsontable to interpret them as a nested object path, set this option to `false`.

The option only works when defined in the global table settings.

**Default**: <code>true</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api dataProvider|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1587

:::

_options.dataProvider : object_

When set, the table loads data from an async provider (e.g. a REST API) instead of a static `data` array.
Use the **object** form with every key defined: **`rowId`**, **`fetchRows`**, **`onRowsCreate`**, **`onRowsUpdate`**,
and **`onRowsRemove`**. All five are required on that object so paging, row identity, and create, update, and remove
map cleanly to your backend. Pair with **`pagination`** for server-side paging.
Valid cell edits apply at once; if **`onRowsUpdate`** fails or **`beforeRowsMutation`** blocks the update, affected cells roll back.

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api dataSchema|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1661

:::

_options.dataSchema : object | function_

When the [`data`](#data) option is set to an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects)
(or is empty), the `dataSchema` option defines the structure of new rows.

Using the `dataSchema` option, you can start out with an empty grid.

You can set the `dataSchema` option to one of the following:
- An object
- A function

Read more:
- [Binding to data: Array of objects with custom data schema](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects-with-custom-data-schema)
- [Binding to data: Function data source and schema](@/guides/getting-started/binding-to-data/binding-to-data.md#function-data-source-and-schema)
- [`data`](#data)

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api dateFormat|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1732

:::

_options.dateFormat : Intl.DateTimeFormatOptions_

Configures the date format for date cells using an
[`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat)
options object.

The locale is controlled separately via the [`locale`](@/api/options.md#locale) option.

::: tip Source data format
Source data must be in ISO 8601 date format (`YYYY-MM-DD`). Otherwise operations such
as sorting and filtering can be unstable or unpredictable. The `dateFormat` object affects only how dates are
displayed; the underlying value should remain ISO.
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
**Category**: [Core](@/api/core.md)  
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


### defaultDate

::: ask-about-api defaultDate|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1835

:::

_options.defaultDate : string_

The `defaultDate` option configures the date pre-selected in the date picker editor
when opening an empty [`date`](@/guides/cell-types/date-cell-type/date-cell-type.md) cell for editing.

The option accepts a string in ISO 8601 format (`YYYY-MM-DD`).

::: tip
`defaultDate` affects only the date picker's initial selection when the cell is empty.
It does not automatically populate empty cells with this date - the cell's value remains empty
until the user confirms a selection.
:::

This option can be set at any level of the [cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration):
the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options), the [`columns`](#columns) level, the [`cells`](#cells) level, and the [`cell`](#cell) level.

Read more:
- [Date cell type](@/guides/cell-types/date-cell-type/date-cell-type.md)
- [`dateFormat`](#dateformat)

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
columns: [
  {
    type: 'date',
    defaultDate: '2015-02-02'
  }
],
```


### dialog

::: ask-about-api dialog|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2047

:::

_options.dialog : boolean | object_

The `dialog` option configures the [`Dialog`](@/api/dialog.md) plugin.

You can set the `dialog` option to one of the following:

| Setting   | Description                                                                 |
| --------- | --------------------------------------------------------------------------- |
| `false`   | Disable the [`Dialog`](@/api/dialog.md) plugin                              |
| `true`    | Enable the [`Dialog`](@/api/dialog.md) plugin with default options          |

##### dialog: Additional options

| Option                   | Possible settings                                                                                                               | Description                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------|
| `template`               | Object with the template configuration (default: `null`).                                                                       | The template of the dialog allows to use prebuild templates |
| `template.type`          | The type of the template ('confirm')                                                                                            | The type of the template                |
| `template.title`         | The title of the template                                                                                                       | The title of the template               |
| `template.description`   | The description of the template                                                                                                 | The description of the template         |
| `template.buttons`       | Array of objects with the buttons configuration (default: `[]`)                                                                 | The buttons of the template             |
| `template.buttons.text`  | The text of the button                                                                                                          | The text of the button                  |
| `template.buttons.type`  | The type of the button ('primary' | 'secondary')                                                                                | The type of the button                  |
| `template.buttons.callback` | The callback function to trigger when the button is clicked                                                                  | The callback function to trigger when the button is clicked |
| `content`                | A string, HTMLElement or DocumentFragment (default: `''`)                                                                       | The content of the dialog               |
| `customClassName`        | A string (default: `''`)                                                                                                        | The custom class name of the dialog     |
| `background`             | One of the options: `'solid'` or `'semi-transparent'` (default: `'solid'`)                                                      | The background of the dialog            |
| `contentBackground`      | Boolean (default: `false`)                                                                                                      | Whether to show the content background  |
| `animation`              | Boolean (default: `true`)                                                                                                       | Whether to show the animation           |
| `closable`               | Boolean (default: `false`)                                                                                                      | Whether to make the dialog closable     |
| `a11y`                   | Object with accessibility options (default: `{ role: 'dialog', ariaLabel: 'Dialog', ariaLabelledby: '', ariaDescribedby: '' }`) | Accessibility options for the dialog    |
| `a11y.role`              | The role of the dialog ('dialog' | 'alertdialog')                                                                               | The role of the dialog                  |
| `a11y.ariaLabel`         | The label of the dialog                                                                                                         | The label of the dialog                 |
| `a11y.ariaLabelledby`    | The ID of the element that labels the dialog                                                                                    | The ID of the element that labels the dialog |
| `a11y.ariaDescribedby`   | The ID of the element that describes the dialog                                                                                 | The ID of the element that describes the dialog |

Read more:
- [Plugins: `Dialog`](@/api/dialog.md)

**Default**: <code>false</code>  
**Category**: [Dialog](@/api/dialog.md)  
**Since**: 16.1.0  
**Example**  
::: only-for javascript
```js
// enable the Dialog plugin with default option
dialog: true,

// enable the Dialog plugin with custom configuration
dialog: {
  content: 'Dialog content',
  customClassName: 'custom-dialog',
  background: 'semi-transparent',
  contentBackground: false,
  animation: false,
  closable: true,
  a11y: {
    role: 'dialog',
    ariaLabel: 'Dialog',
    ariaLabelledby: 'titleID',
    ariaDescribedby: 'descriptionID',
  }
}

// enable the Dialog plugin using a template
dialog: {
  template: {
    type: 'confirm',
    title: 'Confirm',
    description: 'Do you want change the value?',
    buttons: [
      {
        text: 'Ok',
        type: 'primary',
        callback: () => {
          console.log('Ok');
        }
      },
    ],
  },
}
```
:::

::: only-for react
```jsx
// enable the Dialog plugin with default option
<HotTable
  dialog={true}
/>

// enable the Dialog plugin with custom configuration
<HotTable
  dialog={{
    content: 'Dialog content',
    customClassName: 'custom-dialog',
    background: 'semi-transparent',
    contentBackground: false,
    animation: false,
    closable: true,
    a11y: {
      role: 'dialog',
      ariaLabel: 'Dialog',
      ariaLabelledby: 'titleID',
      ariaDescribedby: 'descriptionID',
    }
  }
  }}
/>

// enable the Dialog plugin using a template
<HotTable
  dialog={{
    template: {
      type: 'confirm',
      title: 'Confirm',
      description: 'Do you want change the value?',
    }
  }}
/>
```
:::

::: only-for angular
```ts
settings = {
  dialog: {
    content: 'Dialog content',
    customClassName: 'custom-dialog',
    background: 'semi-transparent',
    contentBackground: false,
    animation: false,
    closable: true,
    a11y: {
      role: 'dialog',
      ariaLabel: 'Dialog',
      ariaLabelledby: 'titleID',
      ariaDescribedby: 'descriptionID',
    }
  }
};

// enable the Dialog plugin using a template
settings = {
  dialog: {
    template: {
      type: 'confirm',
      title: 'Confirm',
      description: 'Do you want change the value?',
    }
  }
};
```

```html
<hot-table [settings]="settings" />
```
:::


### disableVisualSelection

::: ask-about-api disableVisualSelection|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1885

:::

_options.disableVisualSelection : boolean | string | Array&lt;string&gt;_

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

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](#columns), [`cells`](#cells), or [`cell`](#cell) options.

When set to any non-`false` value, the second-click deselect behavior
(Ctrl/Cmd+click on an already-selected cell removing it from a multi-cell selection)
is also skipped. Without visible feedback, toggling layers off can cause unexpected
highlight jumps.

Read more:
- [Selection](@/guides/cell-features/selection/selection.md)

**Default**: <code>false</code>  
**Category**: [Core](@/api/core.md)  
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


### dragToScroll

::: ask-about-api dragToScroll|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2099

:::

_options.dragToScroll : boolean | object_

The `dragToScroll` option configures the [`DragToScroll`](@/api/dragToScroll.md) plugin.

You can set the `dragToScroll` option to one of the following:

| Setting          | Description                                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `true` (default) | Enable with default auto-scroll settings                                                                                                    |
| `false`          | Disable the plugin entirely                                                                                                                 |
| Object           | Enable with custom auto-scroll settings (see below)                                                                                        |

When passing an object, the following properties control the auto-scroll speed:

```js
dragToScroll: {
  interval: {
    min: 20,   // Fastest scroll interval in ms (reached at rampDistance)
    max: 500,  // Slowest scroll interval in ms (applied at the viewport edge)
  },
  rampDistance: 120,  // Pixels outside the edge over which speed ramps up
},
```

The viewport scrolls periodically while the mouse pointer stays outside the
viewport edge. Speed follows a logarithmic curve: slow at the edge, fast when
far outside. The active selection (regular drag-select or autofill drag)
extends to follow the scroll.

Read more:
- [Plugins: `DragToScroll`](@/api/dragToScroll.md)

**Default**: <code>true</code>  
**Category**: [DragToScroll](@/api/dragToScroll.md)  
**Example**  
```js
// Enable with default settings
dragToScroll: true,

// Enable with custom scroll speed
dragToScroll: {
  interval: { min: 60, max: 300 },
  rampDistance: 60,
},

// Disable
dragToScroll: false,
```


### dropdownMenu

::: ask-about-api dropdownMenu|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2159

:::

_options.dropdownMenu : boolean | object | Array&lt;string&gt;_

The `dropdownMenu` option configures the [`DropdownMenu`](@/api/dropdownMenu.md) plugin.

You can set the `dropdownMenu` option to one of the following:

| Setting   | Description                                                                                                                                                                                  |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `false`   | Disable the [`DropdownMenu`](@/api/dropdownMenu.md) plugin                                                                                                                                   |
| `true`    | - Enable the [`DropdownMenu`](@/api/dropdownMenu.md) plugin<br>- Use the [default context menu options](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-default-options)    |
| An array  | - Enable the [`DropdownMenu`](@/api/dropdownMenu.md) plugin<br>- Modify [individual context menu options](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-specific-options) |
| An object | - Enable the [`DropdownMenu`](@/api/dropdownMenu.md) plugin<br>- Apply a custom dropdown menu configuration                                                                                  |

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It is not possible to show or hide the dropdown menu icon for individual columns using this option.

Read more:
- [Context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)
- [Plugins: `DropdownMenu`](@/api/dropdownMenu.md)

**Default**: <code>undefined</code>  
**Category**: [DropdownMenu](@/api/dropdownMenu.md)  
**Example**  
```js
// enable the `DropdownMenu` plugin
// use the default context menu options
dropdownMenu: true,

// enable the `DropdownMenu` plugin
// and modify individual context menu options
dropdownMenu: ['---------', 'undo', 'redo'],

// enable the `DropdownMenu` plugin
// and apply a custom dropdown menu configuration
dropdownMenu: {
  items: {
    'option1': {
      name: 'Option 1'
    },
    'option2': {
      name: 'Option 2',
      submenu: {
        items: [
          {
            key: 'option2:suboption1',
            name: 'Suboption 1',
            callback(key, options) {
              ...
            }
          },
          ...
        ]
      }
    }
  }
},
```


### editor

::: ask-about-api editor|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2218

:::

_options.editor : string | function | boolean_

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

To set the [`editor`](#editor), [`renderer`](#renderer), and [`validator`](#validator)
options all at once, use the [`type`](#type) option.

Read more:
- [Cell editor](@/guides/cell-functions/cell-editor/cell-editor.md)
- [Cell type](@/guides/cell-types/cell-type/cell-type.md)
- [Configuration options: Cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration)
- [`type`](#type)

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
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


### emptyDataState

::: ask-about-api emptyDataState|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2312

:::

_options.emptyDataState : boolean | object_

The `emptyDataState` option configures the [`EmptyDataState`](@/api/emptyDataState.md) plugin.

You can set the `emptyDataState` option to one of the following:

| Setting   | Description                                                                        |
| --------- | ---------------------------------------------------------------------------------- |
| `false`   | Disable the [`EmptyDataState`](@/api/emptyDataState.md) plugin                     |
| `true`    | Enable the [`EmptyDataState`](@/api/emptyDataState.md) plugin                      |
| An object | Enable the [`EmptyDataState`](@/api/emptyDataState.md) plugin with custom settings |

If you set the `emptyDataState` option to an object, you can configure the following settings:

| Property  | Possible values                    | Description                                         |
| --------  | ---------------------------------- | --------------------------------------------------- |
| `message` | `string` \| `object` \| `function` | Message to display in the empty data state overlay. |

If you set the `message` option to an object, it have following properties:

| Property      | Possible values | Description                                             |
| ------------- | --------------- | ------------------------------------------------------- |
| `title`       | `string`        | Title to display in the empty data state overlay.       |
| `description` | `string`        | Description to display in the empty data state overlay. |
| `buttons`     | `array`         | Buttons to display in the empty data state overlay.     |
| `loading`     | `boolean`       | When `true`, shows a loading spinner (used for server fetch state). |

If you set the `message` option to a function, the `source` argument can be `"unknown"`, `"filters"`, or `"loading"`.
With [[Options#dataProvider]], the `"loading"` branch follows DataProvider fetch hooks (`beforeDataProviderFetch`,
`afterDataProviderFetch`, and related hooks) using the same rules as server-backed loading in the DataProvider plugin.
Internal refetches (for example after column sort or CRUD) set `skipLoading` on [[Hooks#beforeDataProviderFetch]] so the
EmptyDataState plugin can omit the loading overlay for those requests.

If you set the `buttons` option to an array, each item requires following properties:

| Property   | Possible values          | Description                                                  |
| ---------- | ------------------------ | ------------------------------------------------------------ |
| `text`     | `string`                 | Text to display in the button.                        |
| `type`     | 'primary' \| 'secondary' | Type of the button.                                   |
| `callback` | `function`               | Callback function to call when the button is clicked. |

Read more:
- [Plugins: `EmptyDataState`](@/api/emptyDataState.md)

**Default**: <code>false</code>  
**Category**: [EmptyDataState](@/api/emptyDataState.md)  
**Since**: 16.2.0  
**Example**  
```js
// Enable empty data state plugin with default messages
emptyDataState: true,

// Enable empty data state plugin with custom message
emptyDataState: {
  message: 'No data available',
},

// Enable empty data state plugin with custom message and buttons for any source
emptyDataState: {
  message: {
    title: 'No data available',
    description: 'There’s nothing to display yet.',
    buttons: [{ text: 'Reset filters', type: 'secondary', callback: () => {} }],
  },
},

// Enable empty data state plugin with custom message and buttons for specific source
emptyDataState: {
  message: (source) => {
    switch (source) {
      case "filters":
        return {
          title: 'No data available',
          description: 'There’s nothing to display yet.',
          buttons: [{ text: 'Reset filters', type: 'secondary', callback: () => {} }],
        };
      case "loading":
        return {
          title: 'Loading data',
          description: 'Please wait.',
        };
      default:
        return {
          title: 'No data available',
          description: 'There’s nothing to display yet.',
        };
    }
  },
},
```


### enterBeginsEditing

::: ask-about-api enterBeginsEditing|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2340

:::

_options.enterBeginsEditing : boolean_

The `enterBeginsEditing` option configures the action of the <kbd>**Enter**</kbd> key.

You can set the `enterBeginsEditing` option to one of the following:

| Setting          | Description                                                                                                                                                                                               |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `true` (default) | - On pressing <kbd>**Enter**</kbd> once, enter the editing mode of the active cell<br>- On pressing <kbd>**Enter**</kbd> twice, move to another cell,<br>as configured by the [`enterMoves`](#entermoves) setting |
| `false`          | - On pressing <kbd>**Enter**</kbd> once, move to another cell,<br>as configured by the [`enterMoves`](#entermoves) setting                                                                                    |

Read more:
- [`enterMoves`](#entermoves)

**Default**: <code>true</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
// press Enter once to start editing
// press Enter twice to move to another cell
enterBeginsEditing: true,

// press Enter once to move to another cell
enterBeginsEditing: false,
```


### enterCommits

::: ask-about-api enterCommits|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2362

:::

_options.enterCommits : boolean_

The `enterCommits` option configures whether the <kbd>**Enter**</kbd> key closes the [`multiSelect`](@/guides/cell-types/multiselect-cell-type/multiselect-cell-type.md) editor.

**Default**: <code>true</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api enterMoves|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2401

:::

_options.enterMoves : object | function_

The `enterMoves` option configures the action of the <kbd>**Enter**</kbd> key.

If the [`enterBeginsEditing`](#enterbeginsediting) option is set to `true`,
the `enterMoves` setting applies to the **second** pressing of the <kbd>**Enter**</kbd> key.

If the [`enterBeginsEditing`](#enterbeginsediting) option is set to `false`,
the `enterMoves` setting applies to the **first** pressing of the <kbd>**Enter**</kbd> key.

You can set the `enterMoves` option to an object with the following properties
(or to a function that returns such an object):

| Property | Type   | Description                                                                                                                                              |
| -------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `col`    | Number | - On pressing <kbd>**Enter**</kbd>, move selection `col` columns right<br>- On pressing <kbd>**Shift**</kbd>+<kbd>**Enter**</kbd>, move selection `col` columns left |
| `row`    | Number | - On pressing <kbd>**Enter**</kbd>, move selection `row` rows down<br>- On pressing <kbd>**Shift**</kbd>+<kbd>**Enter**</kbd>, move selection `row` rows up          |

Read more:
- [`enterBeginsEditing`](#enterbeginsediting)

**Default**: <code>{col: 0, row: 1}</code>  
**Category**: [Core](@/api/core.md)  
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


### exportFile

::: ask-about-api exportFile|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2440

:::

_options.exportFile : object_

The `exportFile` option configures the [`ExportFile`](@/api/exportFile.md) plugin.

You can set the `exportFile` option to one of the following:

| Setting     | Description                                                                                |
| ----------- | ------------------------------------------------------------------------------------------ |
| `undefined` | Use the [`ExportFile`](@/api/exportFile.md) plugin with the default configuration          |
| An object   | Enable the [`ExportFile`](@/api/exportFile.md) plugin and modify the plugin options        |

If you set the `exportFile` option to an object, you can configure the following options:

| Option    | Type     | Default | Description                                                                         |
| --------- | -------- | ------- | ----------------------------------------------------------------------------------- |
| `engines` | `Object` | –       | A map of format keys to their engine constructors. Pass `{ xlsx: ExcelJS }` to enable XLSX export via [ExcelJS](https://github.com/exceljs/exceljs). |

Read more:
- [Export to Excel](@/guides/accessories-and-menus/export-to-excel/export-to-excel.md)
- [Plugins: `ExportFile`](@/api/exportFile.md)

**Default**: <code>undefined</code>  
**Category**: [ExportFile](@/api/exportFile.md)  
**Since**: 17.1.0  
**Example**  
```js
import ExcelJS from 'exceljs';

// enable XLSX export
exportFile: {
  engines: { xlsx: ExcelJS },
},
```


### fillHandle

::: ask-about-api fillHandle|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2496

:::

_options.fillHandle : boolean | string | object_

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

**Default**: <code>true</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api filter|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2533

:::

_options.filter : boolean_

The `filter` option configures whether [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md) cells'
lists are updated by the end user's input.

You can set the `filter` option to one of the following:

| Setting          | Description                                                                                                           |
| ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| `true` (default) | When the end user types into the input area, only options matching the input are displayed                            |
| `false`          | When the end user types into the input area, all options are displayed<br>(options matching the input are put in bold |

Read more:
- [Autocomplete cell type](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
- [`source`](#source)
- [`filteringCaseSensitive`](#filteringcasesensitive)

**Default**: <code>true</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
columns: [{
  // set the `type` of each cell in this column to `autocomplete`
  type: 'autocomplete',
  // set options available in every `autocomplete` cell of this column
  source: ['A', 'B', 'C'],
  // when the end user types in `A`, display only the A option
  // when the end user types in `B`, display only the B option
  // when the end user types in `C`, display only the C option
  filter: true
}],
```


### filteringCaseSensitive

::: ask-about-api filteringCaseSensitive|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2572

:::

_options.filteringCaseSensitive : boolean_

The `filteringCaseSensitive` option configures whether [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md) and [`multiSelect`](@/guides/cell-types/multiselect-cell-type/multiselect-cell-type.md)-typed cells'
search inputs are case-sensitive.

You can set the `filteringCaseSensitive` option to one of the following:

| Setting           | Description                                                                                        |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| `false` (default) | [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md) cells' input is not case-sensitive |
| `true`            | [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md) cells' input is case-sensitive     |

Read more:
- [Autocomplete cell type](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
- [`source`](#source)
- [`filter`](#filter)

**Default**: <code>false</code>  
**Category**: [Core](@/api/core.md)  
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


### filters

::: ask-about-api filters|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2607

:::

_options.filters : boolean_

The `filters` option configures the [`Filters`](@/api/filters.md) plugin.

You can set the `filters` option to one of the following:

| Setting   | Description                                                          |
| --------- | -------------------------------------------------------------------- |
| `false`   | Disable the [`Filters`](@/api/filters.md) plugin                     |
| `true`    | Enable the [`Filters`](@/api/filters.md) plugin                      |
| An object | Enable the [`Filters`](@/api/filters.md) plugin with custom settings |

If you set the `filters` option to an object, you can configure the following settings:

| Property                 | Possible values   | Description                            |
| ------------------------ | ----------------- | -------------------------------------- |
| `searchMode` | `'show'` \| `'apply'` | Enable filtering only visible elements |

If filers is set to `true`, the `searchMode` option is set to `'show'` by default.

Read more:
- [Column filter](@/guides/columns/column-filter/column-filter.md)
- [Plugins: `Filters`](@/api/filters.md)
- [`dropdownMenu`](#dropdownmenu)

**Default**: <code>undefined</code>  
**Category**: [Filters](@/api/filters.md)  
**Example**  
```js
// enable the `Filters` plugin
filters: true,
```


### filterSelectedItems

::: ask-about-api filterSelectedItems|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2623

:::

_options.filterSelectedItems : boolean_

The `filterSelectedItems` option configures whether the selected items are filtered out of the dropdown, when using the search input of the [`multiSelect`](@/guides/cell-types/multiselect-cell-type/multiselect-cell-type.md) editor.

**Default**: <code>true</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
// filter out the selected items from the dropdown
filterSelectedItems: true,

// keep the selected items in the dropdown
filterSelectedItems: false,


### fixedColumnsLeft

::: ask-about-api fixedColumnsLeft|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2646

:::

_options.fixedColumnsLeft : number_

`fixedColumnsLeft` is a legacy option.

If your grid's [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is LTR (default), `fixedColumnsLeft` acts like the [`fixedColumnsStart`](#fixedcolumnsstart) option.

If your grid's [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is RTL, using `fixedColumnsLeft` throws an error.

Use [`fixedColumnsStart`](#fixedcolumnsstart), which works in any layout direction.

Read more:
- [`fixedColumnsStart`](#fixedcolumnsstart)

**Default**: <code>0</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
// freeze the first 3 columns from the left
fixedColumnsLeft: 3,
```


### fixedColumnsStart

::: ask-about-api fixedColumnsStart|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2683

:::

_options.fixedColumnsStart : number_

If your grid's [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is LTR (default), the `fixedColumnsStart` option sets the number of [frozen columns](@/guides/columns/column-freezing/column-freezing.md) at the left-hand edge of the grid.

If your grid's [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is RTL, the `fixedColumnsStart` option sets the number of [frozen columns](@/guides/columns/column-freezing/column-freezing.md) at the right-hand edge of the grid.

Read more:
- [Column freezing](@/guides/columns/column-freezing/column-freezing.md)
- [Layout direction](@/guides/internationalization/layout-direction/layout-direction.md)
- [`fixedColumnsLeft`](#fixedcolumnsleft)
- [`layoutDirection`](#layoutdirection)

**Default**: <code>0</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api fixedRowsBottom|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2708

:::

_options.fixedRowsBottom : number_

The `fixedRowsBottom` option sets the number of [frozen rows](@/guides/rows/row-freezing/row-freezing.md)
at the bottom of the grid.

::: tip
For the bottom frozen rows area to appear with a scroll separator, you must also set the [`height`](#height) option
in Handsontable's configuration. If the grid expands to fill its parent container without a defined height,
no vertical scrollbar is created and the fixed bottom rows area is not displayed.
:::

Read more:
- [Row freezing](@/guides/rows/row-freezing/row-freezing.md)
- [`height`](#height)

**Default**: <code>0</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
// freeze the bottom 3 rows
fixedRowsBottom: 3,
```


### fixedRowsTop

::: ask-about-api fixedRowsTop|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2732

:::

_options.fixedRowsTop : number_

The `fixedRowsTop` option sets the number of [frozen rows](@/guides/rows/row-freezing/row-freezing.md) at the top of the grid.

::: tip
For the top frozen rows area to be visually separated from the scrollable body, you must also set the [`height`](#height) option
in Handsontable's configuration. If the grid expands to fill its parent container without a defined height,
no vertical scrollbar is created and the fixed top rows area is not displayed.
:::

Read more:
- [Row freezing](@/guides/rows/row-freezing/row-freezing.md)
- [`height`](#height)

**Default**: <code>0</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
// freeze the top 3 rows
fixedRowsTop: 3,
```


### formulas

::: ask-about-api formulas|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2810

:::

_options.formulas : object_

The `formulas` option configures the [`Formulas`](@/api/formulas.md) plugin.

The [`Formulas`](@/api/formulas.md) plugin uses the [HyperFormula](https://handsontable.github.io/hyperformula/) calculation engine.
To install [HyperFormula](https://handsontable.github.io/hyperformula/), read the following:
- [Formula calculation: Initialization methods](@/guides/formulas/formula-calculation/formula-calculation.md#initialization-methods)

You can set the `formulas` option to an object with the following properties:

| Property    | Possible values                                                                                                                                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `engine`    | `HyperFormula` \|<br>A [HyperFormula](https://handsontable.github.io/hyperformula/) instance \|<br>A [HyperFormula configuration](https://handsontable.github.io/hyperformula/api/interfaces/configparams.html) object |
| `sheetId`   | A number                                                                                                                                                                                                               |
| `sheetName` | A string                                                                                                                                                                                                               |

Read more:
- [Plugins: `Formulas`](@/api/formulas.md)
- [Formula calculation](@/guides/formulas/formula-calculation/formula-calculation.md)
- [HyperFormula documentation: Client-side installation](https://handsontable.github.io/hyperformula/guide/client-side-installation)
- [HyperFormula documentation: Configuration options](https://handsontable.github.io/hyperformula/api/interfaces/configparams.html)

**Default**: <code>undefined</code>  
**Category**: [Formulas](@/api/formulas.md)  
**Example**  
```js
// either add the `HyperFormula` class
formulas: {
  // set `engine` to `HyperFormula`
  engine: HyperFormula,
  sheetId: 1,
  sheetName: 'Sheet 1'
}

// or, add a HyperFormula instance
// initialized with the `'internal-use-in-handsontable'` license key
const hyperformulaInstance = HyperFormula.buildEmpty({
  licenseKey: 'internal-use-in-handsontable',
});

formulas: {
  // set `engine` to a HyperFormula instance
  engine: hyperformulaInstance,
  sheetId: 1,
  sheetName: 'Sheet 1'
}

// or, add a HyperFormula configuration object
formulas: {
  // set `engine` to a HyperFormula configuration object
  engine: {
    hyperformula: HyperFormula // or `engine: hyperformulaInstance`
    leapYear1900: false,       // this option comes from HyperFormula
    // add more HyperFormula configuration options
  },
  sheetId: 1,
  sheetName: 'Sheet 1'
}

// use the same HyperFormula instance in multiple Handsontable instances

// a Handsontable instance `hot1`
formulas: {
  engine: HyperFormula,
  sheetId: 1,
  sheetName: 'Sheet 1'
}

// a Handsontable instance `hot2`
formulas: {
  engine: hot1.getPlugin('formulas').engine,
  sheetId: 1,
  sheetName: 'Sheet 1'
}
```


### fragmentSelection

::: ask-about-api fragmentSelection|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2835

:::

_options.fragmentSelection : boolean | string_

The `fragmentSelection` option configures text selection settings.

You can set the `fragmentSelection` option to one of the following:

| Setting           | Description                                        |
| ----------------- | ------------------------------------------------- |
| `false` (default) | Disable text selection                            |
| `true`            | Enable text selection in multiple cells at a time |
| `'cell'`          | Enable text selection in one cell at a time       |

**Default**: <code>false</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
// enable text selection in multiple cells at a time
fragmentSelection: true,

// enable text selection in one cell a time
fragmentSelection: 'cell',
```


### hashLength

::: ask-about-api hashLength|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2857

:::

_options.hashLength : number_

The `hashLength` option sets a fixed display length for the hash mask used by the
[`password`](@/guides/cell-types/password-cell-type/password-cell-type.md) cell type.

By default, the hash length equals the actual value length. Set `hashLength` to a positive
integer to always display that many hash symbols regardless of the real value length.

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api hashRevealDelay|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2881

:::

_options.hashRevealDelay : number_

The `hashRevealDelay` option enables a brief character-reveal on each keystroke in the
[`password`](@/guides/cell-types/password-cell-type/password-cell-type.md) cell type editor.

When set to a positive number (milliseconds), each typed character stays visible for that
duration and is then replaced by the `hashSymbol`. This lets the user confirm what they
typed without permanently exposing the value. Requires `type: 'password'`.

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api hashSymbol|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2902

:::

_options.hashSymbol : string_

The `hashSymbol` option sets the character used as the hash mask in the
[`password`](@/guides/cell-types/password-cell-type/password-cell-type.md) cell type renderer.

Defaults to `'*'`. You can use any character, HTML entity, or string.

**Default**: <code>"*"</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api headerClassName|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2926

:::

_options.headerClassName : string_

The `headerClassName` option allows adding one or more class names to the column headers' inner `div` element.
It can be used to align the labels in the column headers to left, center or right by setting this option to
`htLeft`, `htCenter`, or `htRight` respectively.

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api height|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2982

:::

_options.height : number | 'auto' | string | function_

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

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
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


### hiddenColumns

::: ask-about-api hiddenColumns|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3026

:::

_options.hiddenColumns : boolean | object_

The `hiddenColumns` option configures the [`HiddenColumns`](@/api/hiddenColumns.md) plugin.

You can set the `hiddenColumns` option to one of the following:

| Setting   | Description                                                                                  |
| --------- | -------------------------------------------------------------------------------------------- |
| `false`   | Disable the [`HiddenColumns`](@/api/hiddenColumns.md) plugin                                 |
| `true`    | Enable the [`HiddenColumns`](@/api/hiddenColumns.md) plugin with the default plugin options  |
| An object | - Enable the [`HiddenColumns`](@/api/hiddenColumns.md) plugin<br>- Modify the plugin options |

If you set the `hiddenColumns` to an object, you can set the following [`HiddenColumns`](@/api/hiddenColumns.md) plugin options:

| Property           | Possible values     | Description                                                                                                                                             |
| ------------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `columns`          | An array of indexes | An array of indexes of columns that are hidden at initialization                                                                                        |
| `copyPasteEnabled` | `true` \| `false`   | `true`: when copying or pasting data, take hidden columns into account<br>`false`: when copying or pasting data, don't take hidden columns into account |
| `indicators`       | `true` \| `false`   | `true`: display UI markers to indicate the presence of hidden columns<br>`false`: display UI markers                                                    |

Read more:
- [Plugins: `HiddenColumns`](@/api/hiddenColumns.md)
- [Column hiding](@/guides/columns/column-hiding/column-hiding.md)

**Default**: <code>undefined</code>  
**Category**: [HiddenColumns](@/api/hiddenColumns.md)  
**Example**  
```js
// enable the `HiddenColumns` plugin
hiddenColumns: true,

// enable `HiddenColumns` plugin, and modify the plugin options
hiddenColumns: {
  // set columns that are hidden by default
  columns: [5, 10, 15],
  // when copying or pasting data, take hidden columns into account
  copyPasteEnabled: true,
  // show where hidden columns are
  indicators: true
}
```


### hiddenRows

::: ask-about-api hiddenRows|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3070

:::

_options.hiddenRows : boolean | object_

The `hiddenRows` option configures the [`HiddenRows`](@/api/hiddenRows.md) plugin.

You can set the `hiddenRows` option to one of the following:

| Setting   | Description                                                                            |
| --------- | -------------------------------------------------------------------------------------- |
| `false`   | Disable the [`HiddenRows`](@/api/hiddenRows.md) plugin                                 |
| `true`    | Enable the [`HiddenRows`](@/api/hiddenRows.md) plugin with the default plugin options  |
| An object | - Enable the [`HiddenRows`](@/api/hiddenRows.md) plugin<br>- Modify the plugin options |

If you set the `hiddenRows` to an object, you can set the following [`HiddenRows`](@/api/hiddenRows.md) plugin options:

| Property           | Possible values     | Description                                                                                                                                       |
| ------------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rows   `          | An array of indexes | An array of indexes of rows that are hidden at initialization                                                                                     |
| `copyPasteEnabled` | `true` \| `false`   | `true`: when copying or pasting data, take hidden rows into account<br>`false`: when copying or pasting data, don't take hidden rows into account |
| `indicators`       | `true` \| `false`   | `true`: display UI markers to indicate the presence of hidden rows<br>`false`: display UI markers                                                 |

Read more:
- [Plugins: `HiddenRows`](@/api/hiddenRows.md)
- [Row hiding](@/guides/rows/row-hiding/row-hiding.md)

**Default**: <code>undefined</code>  
**Category**: [HiddenRows](@/api/hiddenRows.md)  
**Example**  
```js
// enable the `HiddenRows` plugin
hiddenRows: true,

// enable `HiddenRows` plugin, and modify the plugin options
hiddenRows: {
  // set rows that are hidden by default
  rows: [5, 10, 15],
  // when copying or pasting data, take hidden rows into account
  copyPasteEnabled: true,
  // show where hidden rows are
  indicators: true
}
```


### imeFastEdit

::: ask-about-api imeFastEdit|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3130

:::

_options.imeFastEdit : boolean_

The `imeFastEdit` option allows using the "fast edit" feature for the IME users. It's disabled by default
because of its incompatibility with some of the accessibility features.

Enabling this option can make a negative impact on how some screen readers handle reading the table cells.

**Category**: [Core](@/api/core.md)  
**Since**: 14.0.0  


### initialState

::: ask-about-api initialState|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3091

:::

_options.initialState : object | undefined_

The `initialState` option configures the grid's initial state.
This object accepts any grid configuration option. In case of conflicts between
`initialState` and table settings, the table settings take precedence.
Note: The `initialState` option is ignored when passed to the
[`updateSettings()`](@/api/core.md#updatesettings) method.

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
**Since**: 16.1.0  
**Example**  
```js
initialState: {
  // configure initial column order
  manualColumnMove: [1, 0],
},
```


### injectCoreCss

::: ask-about-api injectCoreCss|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5556

:::

_options.injectCoreCss : boolean_

The `injectCoreCss` option controls whether Handsontable injects its core CSS into the document.

You can set the `injectCoreCss` option to one of the following:

| Setting            | Description                                                                                                      |
| ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `true` (default)   | Inject core styles into the document head                                                                        |
| `false`            | Do not inject core styles (use when you load CSS yourself, e.g. `import 'handsontable/styles/handsontable.css'`) |

Read more:
- [Themes](@/guides/styling/themes/themes.md)

**Default**: <code>true</code>  
**Category**: [Core](@/api/core.md)  
**Since**: 17.0.0  
**Example**  
```js
// inject core CSS (default)
injectCoreCss: true,

// skip injection when you load Handsontable CSS yourself
injectCoreCss: false,
```


### invalidCellClassName

::: ask-about-api invalidCellClassName|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3119

:::

_options.invalidCellClassName : string_

The `invalidCellClassName` option lets you add a CSS class name to cells
that were marked as `invalid` by the [cell validator](@/guides/cell-functions/cell-validator/cell-validator.md).

Read more:
- [Cell validator](@/guides/cell-functions/cell-validator/cell-validator.md)
- [`currentRowClassName`](#currentrowclassname)
- [`currentHeaderClassName`](#currentheaderclassname)
- [`activeHeaderClassName`](#activeheaderclassname)
- [`currentColClassName`](#currentcolclassname)
- [`readOnlyCellClassName`](#readonlycellclassname)
- [`commentedCellClassName`](#commentedcellclassname)
- [`noWordWrapClassName`](#nowordwrapclassname)
- [`TableClassName`](#tableclassname)
- [`className`](#classname)

**Default**: <code>"htInvalid"</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
// add a `highlight-error` CSS class name
// to every `invalid` cell`
invalidCellClassName: 'highlight-error',
```


### label

::: ask-about-api label|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3256

:::

_options.label : object_

The `label` option configures [`checkbox`](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md) cells` labels.

You can set the `label` option to an object with the following properties:

| Property    | Possible values                   | Description                                                                                                                                                                                                             |
| ----------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `position`  | `'after'` (default) \| `'before'` | `'after'`: place the label to the right of the checkbox<br>`'before'`: place the label to the left of the checkbox                                                                                                      |
| `value`     | A string \| A function            | The label's text                                                                                                                                                                                                        |
| `separated` | `false` (default) \| `true`       | `false`: don't separate the label from the checkbox<br>`true`: separate the label from the checkbox                                                                                                                     |
| `property`  | A string                          | - A [`data`](#data) object property name that's used as the label's text <br>- Works only when the [`data`](#data) option is set to an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects) |

Read more:
- [Checkbox cell type: Checkbox labels](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md#checkbox-labels)

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
columns: [{
  type: 'checkbox',
  // add 'My label:' after the checkbox
  label: { position: 'before', value: 'My label: ', separated: true }
}],
```


### language

::: ask-about-api language|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3308

:::

_options.language : string_

The `language` option configures Handsontable's [language](@/guides/internationalization/language/language.md) settings.

This option controls the language used for all built-in UI strings, including context menu labels,
column sorting labels, validation messages, and other user-visible text. It does not affect the locale
used for number or date formatting - use the [`locale`](#locale) option for that.

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](#columns), [`cells`](#cells), or [`cell`](#cell) options.

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
- [`locale`](#locale)
- [`layoutDirection`](#layoutdirection)

**Default**: <code>"en-US"</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
// set Handsontable's language to Polish
language: 'pl-PL',
```


### layout

::: ask-about-api layout|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3374

:::

_options.layout : object_

The `layout` option configures the order of plugin UI elements within the user-orderable
wrapper slots rendered around the grid: `top` and `bottom`. Each slot takes an ordered array
of element keys (for example `'pagination'`). Keys you list are placed first in that order;
any remaining elements follow by their default weight. The grid and the overlays layer (the
modal layer, such as the dialog) are not orderable through this option. The license
notification is not orderable either; it always renders last in the `bottom` slot.

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
**Since**: 18.0.0  
**Example**  
```js
// render pagination above a custom 'summary' element registered in the bottom slot
layout: {
  bottom: ['pagination', 'summary'],
},
```


### layoutDirection

::: ask-about-api layoutDirection|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3352

:::

_options.layoutDirection : string_

The `layoutDirection` option configures whether Handsontable renders from the left to the right, or from the right to the left.

You can set the layout direction only at Handsontable's [initialization](@/guides/getting-started/installation/installation.md#initialize-handsontable). Any change of the `layoutDirection` option after the initialization (e.g. using the [`updateSettings()`](@/api/core.md#updatesettings) method) is ignored.

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
- [`language`](#language)
- [`locale`](#locale)
- [`fixedColumnsStart`](#fixedcolumnsstart)
- [`customBorders`](#customborders)

**Default**: <code>"inherit"</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api licenseKey|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3401

:::

_options.licenseKey : string_

The `licenseKey` option sets your Handsontable license key.

You can set the `licenseKey` option to one of the following:

| Setting                                                                                                 | Description                                                                                       |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| A string with your [commercial license key](@/guides/getting-started/license-key/license-key.md#commercial-license) | For [commercial use](@/guides/technical-specification/software-license/software-license.md#commercial-use)         |
| `'non-commercial-and-evaluation'`                                                                       | For [non-commercial use](@/guides/technical-specification/software-license/software-license.md#non-commercial-use) |

Read more:
- [License key](@/guides/getting-started/license-key/license-key.md)

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
// for commercial use
licenseKey: 'xxxxx-xxxxx-xxxxx-xxxxx-xxxxx', // your commercial license key

// for non-commercial use
licenseKey: 'non-commercial-and-evaluation',
```


### loading

::: ask-about-api loading|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3479

:::

_options.loading : boolean | object_

The `loading` option configures the [`Loading`](@/api/loading.md) plugin.

Loading plugin, automatically loads [`Dialog`](@/api/dialog.md) plugin.

You can set the `loading` option to one of the following:

| Setting   | Description                                                                 |
| --------- | --------------------------------------------------------------------------- |
| `false`   | Disable the [`Loading`](@/api/loading.md) plugin                           |
| `true`    | Enable the [`Loading`](@/api/loading.md) plugin with default configuration |
| An object | - Enable the [`Loading`](@/api/loading.md) plugin<br>- Apply custom configuration |

If you set the `loading` option to an object, you can configure the following loading options:

| Option        | Possible settings | Description                                               |
| ------------- | ----------------- | --------------------------------------------------------- |
| `icon`        | A string          | Custom loading icon to display (default: `<svg />`)       |
| `title`       | A string          | Custom loading title to display (default: `'Loading...'`) |
| `description` | A string          | Custom loading description to display (default: `''`)     |

Read more:
- [Plugins: `Loading`](@/api/loading.md)

**Default**: <code>false</code>  
**Category**: [Loading](@/api/loading.md)  
**Since**: 16.1.0  
**Example**  
```js
// enable the `Loading` plugin with default configuration
loading: true,

// enable the `Loading` plugin with custom configuration
loading: {
  icon: 'A custom loading icon in SVG format',
  title: 'Custom loading title',
  description: 'Custom loading description',
}
```


### locale

::: ask-about-api locale|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3436

:::

_options.locale : string_

The `locale` option configures Handsontable's [locale](@/guides/internationalization/locale/locale.md) settings.

You can set the `locale` option to any valid and canonicalized Unicode BCP 47 locale tag,
both for the [entire grid](@/guides/internationalization/locale/locale.md#set-the-grid-s-locale),
and for [individual columns](@/guides/internationalization/locale/locale.md#set-a-column-s-locale).

Read more:
- [Locale](@/guides/internationalization/locale/locale.md)
- [`language`](#language)
- [`layoutDirection`](#layoutdirection)

**Default**: <code>"en-US"</code>  
**Category**: [Core](@/api/core.md)  
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


### manualColumnFreeze

::: ask-about-api manualColumnFreeze|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3536

:::

_options.manualColumnFreeze : boolean_

The `manualColumnFreeze` option configures the [`ManualColumnFreeze`](@/api/manualColumnFreeze.md) plugin.

You can set the `manualColumnFreeze` option to one of the following:

| Setting  | Description                                                            |
| -------- | ---------------------------------------------------------------------- |
| `true`   | Enable the [`ManualColumnFreeze`](@/api/manualColumnFreeze.md) plugin  |
| `false`  | Disable the [`ManualColumnFreeze`](@/api/manualColumnFreeze.md) plugin |

Read more:
- [Column freezing](@/guides/columns/column-freezing/column-freezing.md#user-triggered-freeze)

**Default**: <code>undefined</code>  
**Category**: [ManualColumnFreeze](@/api/manualColumnFreeze.md)  
**Example**  
```js
// enable the `ManualColumnFreeze` plugin
manualColumnFreeze: true,
```


### manualColumnMove

::: ask-about-api manualColumnMove|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3567

:::

_options.manualColumnMove : boolean | Array&lt;number&gt;_

The `manualColumnMove` option configures the [`ManualColumnMove`](@/api/manualColumnMove.md) plugin.

You can set the `manualColumnMove` option to one of the following:

| Setting  | Description                                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------------------------ |
| `true`   | Enable the [`ManualColumnMove`](@/api/manualColumnMove.md) plugin                                                  |
| `false`  | Disable the [`ManualColumnMove`](@/api/manualColumnMove.md) plugin                                                 |
| An array | - Enable the [`ManualColumnMove`](@/api/manualColumnMove.md) plugin<br>- Move individual columns at initialization |

Read more:
- [Column moving](@/guides/columns/column-moving/column-moving.md)

**Default**: <code>undefined</code>  
**Category**: [ManualColumnMove](@/api/manualColumnMove.md)  
**Example**  
```js
// enable the `ManualColumnMove` plugin
manualColumnMove: true,

// enable the `ManualColumnMove` plugin
// at initialization, move column 0 to 1
// at initialization, move column 1 to 4
// at initialization, move column 2 to 6
manualColumnMove: [1, 4, 6],
```


### manualColumnResize

::: ask-about-api manualColumnResize|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3599

:::

_options.manualColumnResize : boolean | Array&lt;number&gt;_

The `manualColumnResize` option configures the [`ManualColumnResize`](@/api/manualColumnResize.md) plugin.

You can set the `manualColumnResize` option to one of the following:

| Setting  | Description                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------- |
| `true`   | Enable the [`ManualColumnResize`](@/api/manualColumnResize.md) plugin                                                 |
| `false`  | Disable the [`ManualColumnResize`](@/api/manualColumnResize.md) plugin                                                |
| An array | - Enable the [`ManualColumnResize`](@/api/manualColumnResize.md) plugin<br>- Set initial widths of individual columns |

Read more:
- [Column width: Column stretching](@/guides/columns/column-width/column-width.md#column-stretching)

**Default**: <code>undefined</code>  
**Category**: [ManualColumnResize](@/api/manualColumnResize.md)  
**Example**  
```js
// enable the `manualColumnResize` plugin
manualColumnResize: true,

// enable the `manualColumnResize` plugin
// set the initial width of column 0 to 40 pixels
// set the initial width of column 1 to 50 pixels
// set the initial width of column 2 to 60 pixels
manualColumnResize: [40, 50, 60],
```


### manualRowMove

::: ask-about-api manualRowMove|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3631

:::

_options.manualRowMove : boolean | Array&lt;number&gt;_

The `manualRowMove` option configures the [`ManualRowMove`](@/api/manualRowMove.md) plugin.

You can set the `manualRowMove` option to one of the following:

| Setting  | Description                                                                                               |
| -------- | --------------------------------------------------------------------------------------------------------- |
| `true`   | Enable the [`ManualRowMove`](@/api/manualRowMove.md) plugin                                               |
| `false`  | Disable the [`ManualRowMove`](@/api/manualRowMove.md) plugin                                              |
| An array | - Enable the [`ManualRowMove`](@/api/manualRowMove.md) plugin<br>- Move individual rows at initialization |

Read more:
- [Row moving](@/guides/rows/row-moving/row-moving.md)

**Default**: <code>undefined</code>  
**Category**: [ManualRowMove](@/api/manualRowMove.md)  
**Example**  
```js
// enable the `ManualRowMove` plugin
manualRowMove: true,

// enable the `ManualRowMove` plugin
// at initialization, move row 1 to 0
// at initialization, move row 4 to 1
// at initialization, move row 6 to 2
manualRowMove: [1, 4, 6],
```


### manualRowResize

::: ask-about-api manualRowResize|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3663

:::

_options.manualRowResize : boolean | Array&lt;number&gt;_

The `manualRowResize` option configures the [`ManualRowResize`](@/api/manualRowResize.md) plugin.

You can set the `manualRowResize` option to one of the following:

| Setting  | Description                                                                                                   |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `true`   | Enable the [`ManualRowResize`](@/api/manualRowResize.md) plugin                                               |
| `false`  | Disable the [`ManualRowResize`](@/api/manualRowResize.md) plugin                                              |
| An array | - Enable the [`ManualRowResize`](@/api/manualRowResize.md) plugin<br>- Set initial heights of individual rows |

Read more:
- [Row height: Adjust the row height manually](@/guides/rows/row-height/row-height.md#adjust-the-row-height-manually)

**Default**: <code>undefined</code>  
**Category**: [ManualRowResize](@/api/manualRowResize.md)  
**Example**  
```js
// enable the `ManualRowResize` plugin
manualRowResize: true,

// enable the `ManualRowResize` plugin
// set the initial height of row 0 to 40 pixels
// set the initial height of row 1 to 50 pixels
// set the initial height of row 2 to 60 pixels
manualRowResize: [40, 50, 60],
```


### maxCols

::: ask-about-api maxCols|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3682

:::

_options.maxCols : number_

The `maxCols` option sets a maximum number of columns.

The `maxCols` option is used:
- At initialization: if the `maxCols` value is lower than the initial number of columns,
Handsontable trims columns from the right.
- At runtime: for example, when inserting columns.

**Default**: <code>Infinity</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
// set the maximum number of columns to 300
maxCols: 300,
```


### maxRows

::: ask-about-api maxRows|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3701

:::

_options.maxRows : number_

The `maxRows` option sets a maximum number of rows.

The `maxRows` option is used:
- At initialization: if the `maxRows` value is lower than the initial number of rows,
Handsontable trims rows from the bottom.
- At runtime: for example, when inserting rows.

**Default**: <code>Infinity</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
// set the maximum number of rows to 300
maxRows: 300,
```


### maxSelections

::: ask-about-api maxSelections|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3720

:::

_options.maxSelections : number_

The `maxSelections` option sets a maximum number of selections for the [`multiSelect`](@/guides/cell-types/multiselect-cell-type/multiselect-cell-type.md)-typed cells.

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
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


### mergeCells

::: ask-about-api mergeCells|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3786

:::

_options.mergeCells : boolean | Array&lt;object&gt;_

The `mergeCells` option configures the [`MergeCells`](@/api/mergeCells.md) plugin.

You can set the `mergeCells` option to one of the following:

| Setting               | Description                                                                                         |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| `true`                | Enable the [`MergeCells`](@/api/mergeCells.md) plugin                                               |
| `false`               | Disable the [`MergeCells`](@/api/mergeCells.md) plugin                                              |
| An array of objects   | - Enable the [`MergeCells`](@/api/mergeCells.md) plugin<br>- Merge specific cells at initialization |
| { virtualized: true } | Enable the [`MergeCells`](@/api/mergeCells.md) plugin with enabled virtualization mode              |


To merge specific cells at Handsontable's initialization,
set the `mergeCells` option to an array of objects, with the following properties:

| Property  | Description                                                |
| --------- | ---------------------------------------------------------- |
| `row`     | The row index of the merged section's beginning            |
| `col`     | The column index of the merged section's beginning         |
| `rowspan` | The width (as a number of rows) of the merged section      |
| `colspan` | The height (as a number of columns ) of the merged section |

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](#columns), [`cells`](#cells), or [`cell`](#cell) options.

Read more:
- [Merge cells](@/guides/cell-features/merge-cells/merge-cells.md)

**Default**: <code>false</code>  
**Category**: [MergeCells](@/api/mergeCells.md)  
**Example**  
```js
// enable the `MergeCells` plugin
mergeCells: true,

// enable the `MergeCells` plugin
// and merge specific cells at initialization
mergeCells: [
  // merge cells from cell (1,1) to cell (3,3)
  {row: 1, col: 1, rowspan: 3, colspan: 3},
  // merge cells from cell (3,4) to cell (2,2)
  {row: 3, col: 4, rowspan: 2, colspan: 2},
  // merge cells from cell (5,6) to cell (3,3)
  {row: 5, col: 6, rowspan: 3, colspan: 3}
],

// enable the `MergeCells` plugin with enabled virtualization mode
// and merge specific cells at initialization
mergeCells: {
  virtualized: true,
  cells: [
    // merge cells from cell (1,1) to cell (3,3)
    {row: 1, col: 1, rowspan: 3, colspan: 3},
    // merge cells from cell (3,4) to cell (2,2)
    {row: 3, col: 4, rowspan: 2, colspan: 2},
    // merge cells from cell (5,6) to cell (3,3)
    {row: 5, col: 6, rowspan: 3, colspan: 3}
  ],
},
```


### minCols

::: ask-about-api minCols|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3812

:::

_options.minCols : number_

The `minCols` option sets a minimum number of columns.

The `minCols` option is used:
- At initialization: if the `minCols` value is higher than the initial number of columns,
Handsontable adds empty columns to the right.
- At runtime: for example, when removing columns.

The `minCols` option works only when your [`data`](#data) is an [array of arrays](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-arrays).
When your [`data`](#data) is an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects),
you can only have as many columns as defined in:
- The first data row
- The [`dataSchema`](#dataschema) option
- The [`columns`](#columns) option

**Default**: <code>0</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
// set the minimum number of columns to 10
minCols: 10,
```


### minRowHeights

::: ask-about-api minRowHeights|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3842

:::

_options.minRowHeights : number | Array&lt;number&gt; | string | Array&lt;string&gt; | Array&lt;undefined&gt; | function_

Alias for the [`rowHeights`](#rowheights) option.

See the [`rowHeights`](#rowheights) option description for more information.

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api minRows|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3861

:::

_options.minRows : number_

The `minRows` option sets a minimum number of rows.

The `minRows` option is used:
- At initialization: if the `minRows` value is higher than the initial number of rows,
Handsontable adds empty rows at the bottom.
- At runtime: for example, when removing rows.

**Default**: <code>0</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
// set the minimum number of rows to 10
minRows: 10,
```


### minSpareCols

::: ask-about-api minSpareCols|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3888

:::

_options.minSpareCols : number_

The `minSpareCols` option sets a minimum number of empty columns
at the grid's right-hand end.

If there already are other empty columns at the grid's right-hand end,
they are counted into the `minSpareCols` value.

The total number of columns can't exceed the [`maxCols`](#maxcols) value.

The `minSpareCols` option works only when your [`data`](#data) is an [array of arrays](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-arrays).
When your [`data`](#data) is an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects),
you can only have as many columns as defined in:
- The first data row
- The [`dataSchema`](#dataschema) option
- The [`columns`](#columns) option

**Default**: <code>0</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
// at Handsontable's initialization, add at least 3 empty columns on the right
minSpareCols: 3,
```


### minSpareRows

::: ask-about-api minSpareRows|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3908

:::

_options.minSpareRows : number_

The `minSpareRows` option sets a minimum number of empty rows
at the bottom of the grid.

If there already are other empty rows at the bottom,
they are counted into the `minSpareRows` value.

The total number of rows can't exceed the [`maxRows`](#maxrows) value.

**Default**: <code>0</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
// at Handsontable's initialization, add at least 3 empty rows at the bottom
minSpareRows: 3,
```


### multiColumnSorting

::: ask-about-api multiColumnSorting|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3980

:::

_options.multiColumnSorting : boolean | object_

The `multiColumnSorting` option configures the [`MultiColumnSorting`](@/api/multiColumnSorting.md) plugin.

You can set the `multiColumnSorting` option to one of the following:

| Setting    | Description                                                                                                                                                |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `true`     | Enable the [`MultiColumnSorting`](@/api/multiColumnSorting.md) plugin with the default configuration                                                       |
| `false`    | Disable the [`MultiColumnSorting`](@/api/multiColumnSorting.md) plugin                                                                                     |
| An object  | - Enable the [`MultiColumnSorting`](@/api/multiColumnSorting.md) plugin<br>- Modify the [`MultiColumnSorting`](@/api/multiColumnSorting.md) plugin options |

If you set the `multiColumnSorting` option to an object,
you can set the following [`MultiColumnSorting`](@/api/multiColumnSorting.md) plugin options:

| Option                   | Possible settings                                                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `indicator`              | `true`: Display the arrow icon in the column header, to indicate a sortable column<br>`false`: Don't display the arrow icon in the column header |
| `headerAction`           | `true`: Enable clicking on the column header to sort the column<br>`false`: Disable clicking on the column header to sort the column             |
| `sortEmptyCells`         | `true`: Sort empty cells as well<br>`false`: Place empty cells at the end                                                                        |
| `compareFunctionFactory` | A [custom compare function](@/guides/rows/rows-sorting/rows-sorting.md#add-a-custom-comparator)                                                               |

If you set the `multiColumnSorting` option to an object,
you can also sort individual columns at Handsontable's initialization.
In the `multiColumnSorting` object, add an object named `initialConfig`,
with the following properties:

| Option      | Possible settings   | Description                                                      |
| ----------- | ------------------- | ---------------------------------------------------------------- |
| `column`    | A number            | The index of the column that you want to sort at initialization  |
| `sortOrder` | `'asc'` \| `'desc'` | The sorting order:<br>`'asc'`: ascending<br>`'desc'`: descending |

Read more:
- [Rows sorting](@/guides/rows/rows-sorting/rows-sorting.md)
- [`columnSorting`](#columnsorting)

**Default**: <code>undefined</code>  
**Category**: [MultiColumnSorting](@/api/multiColumnSorting.md)  
**Example**  
```js
// enable the `MultiColumnSorting` plugin
multiColumnSorting: true

// enable the `MultiColumnSorting` plugin with custom configuration
multiColumnSorting: {
  // sort empty cells as well
  sortEmptyCells: true,
  // display the arrow icon in the column header
  indicator: true,
  // disable clicking on the column header to sort the column
  headerAction: false,
  // add a custom compare function
  compareFunctionFactory(sortOrder, columnMeta) {
    return function(value, nextValue) {
      // some value comparisons which will return -1, 0 or 1...
    }
  }
}

// enable the `MultiColumnSorting` plugin with a multi-column initial sort order:
// sort column 1 ascending first, then column 2 descending
multiColumnSorting: {
  initialConfig: [
    { column: 1, sortOrder: 'asc' },
    { column: 2, sortOrder: 'desc' }
  ]
}
```


### navigableHeaders

::: ask-about-api navigableHeaders|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3998

:::

_options.navigableHeaders : boolean_

When set to `true`, the `navigableHeaders` option lets you navigate [row headers](@/guides/rows/row-header/row-header.md) and [column headers](@/guides/columns/column-header/column-header.md), using the arrow keys or the <kbd>**Tab**</kbd> key (if the [`tabNavigation`](#tabnavigation) option is set to `true`).

**Default**: <code>false</code>  
**Category**: [Core](@/api/core.md)  
**Since**: 14.0.0  
**Example**  
```js
// you can navigate row and column headers with the keyboard
navigableHeaders: true,

// default behavior: you can't navigate row and column headers with the keyboard
navigableHeaders: false,
```


### nestedHeaders

::: ask-about-api nestedHeaders|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4090

:::

_options.nestedHeaders : boolean | Array&lt;Array&gt;_

The `nestedHeaders` option configures the [`NestedHeaders`](@/api/nestedHeaders.md) plugin.

You can set the `nestedHeaders` option to one of the following:

| Setting           | Description                                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `false` (default) | Disable the [`NestedHeaders`](@/api/nestedHeaders.md) plugin                                                                          |
| `true`            | - Enable the [`NestedHeaders`](@/api/nestedHeaders.md) plugin<br>- Don't configure any nested headers                                 |
| Array of arrays   | - Enable the [`NestedHeaders`](@/api/nestedHeaders.md) plugin<br>- Configure headers that are nested on Handsontable's initialization |

If you set the `nestedHeaders` option to an array of arrays, each array configures one row of
nested headers (top row first). Within a row, headers are listed left to right.

Each array element configures one header, and can be one of the following:

| Array element | Description                                               |
| ------------- | --------------------------------------------------------- |
| A string      | The header's label                                        |
| An object     | A header configuration object (see the properties below) |

A header configuration object accepts the following properties:

| Property          | Type      | Description                                                                                                                                                                                                                                                                                          |
| ----------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`           | `string`  | The header's label.                                                                                                                                                                                                                                                                                  |
| `colspan`         | `number`  | The number of data columns the header spans (an integer greater than `1`). Groups the columns it covers.                                                                                                                                                                                             |
| `rowspan`         | `number`  | The number of header rows the header spans (an integer greater than `1`).                                                                                                                                                                                                                            |
| `headerClassName` | `string`  | One or more space-separated CSS class names added to the header element (for example, `'htRight'`).                                                                                                                                                                                                  |
| `visibleWhen`     | `string`  | For a header inside a collapsible group, sets in which collapse state the header (and its columns) stays visible: `'collapsed'` (visible only while the group is collapsed), `'expanded'` (visible only while the group is expanded), or `'always'` (visible in both states). When omitted, a header in such a group defaults to `'expanded'` - it is hidden when the group collapses. At least one column of a group always stays visible. |

::: tip
A header group is made collapsible through the [`collapsibleColumns`](#collapsiblecolumns) option, not through
`nestedHeaders`. Once a group is collapsible, mark the column(s) you want to keep visible when it collapses
with `visibleWhen: 'always'` (or `'collapsed'`); the remaining columns are hidden on collapse by default.
:::

::: tip
When `nestedHeaders` is configured, the `label` defined in the [`columns`](#columns) option for the same
column is replaced by the `label` from `nestedHeaders`. The `nestedHeaders` label takes precedence.
:::

Read more:
- [Plugins: `NestedHeaders`](@/api/nestedHeaders.md)
- [Column groups: Nested headers](@/guides/columns/column-groups/column-groups.md#nested-headers)
- [Column groups: Choose which columns stay visible when collapsed](@/guides/columns/column-groups/column-groups.md#choose-which-columns-stay-visible-when-collapsed)

**Default**: <code>undefined</code>  
**Category**: [NestedHeaders](@/api/nestedHeaders.md)  
**Example**  
```js
// group headers with `label` and `colspan`
nestedHeaders: [
  ['A', {label: 'B', colspan: 8}, 'C'],
  ['D', {label: 'E', colspan: 4}, {label: 'F', colspan: 4}, 'G'],
  ['H', 'I', 'J', 'K', 'L', 'M', 'N', 'R', 'S', 'T']
],

// choose which columns stay visible when a collapsible group is collapsed:
// unmarked headers (Jan, Feb, Mar) are hidden on collapse; `Total` appears only when collapsed
nestedHeaders: [
  ['Region', {label: 'Q1 2025', colspan: 4}],
  ['Region', 'Jan', 'Feb', 'Mar', {label: 'Total', visibleWhen: 'collapsed'}]
],
collapsibleColumns: true,
```


### nestedRows

::: ask-about-api nestedRows|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4115

:::

_options.nestedRows : boolean_

The `nestedRows` option configures the [`NestedRows`](@/api/nestedRows.md) plugin.

You can set the `nestedRows` option to one of the following:

| Setting           | Description                                            |
| ----------------- | ------------------------------------------------------ |
| `false` (default) | Disable the [`NestedRows`](@/api/nestedRows.md) plugin |
| `true`            | Enable the [`NestedRows`](@/api/nestedRows.md) plugin  |

Read more:
- [Plugins: `NestedRows`](@/guides/rows/row-parent-child/row-parent-child.md)

**Default**: <code>false</code>  
**Category**: [NestedRows](@/api/nestedRows.md)  
**Example**  
```js
// enable the `NestedRows` plugin
nestedRows: true,
```


### notification

::: ask-about-api notification|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3512

:::

_options.notification : boolean | object_

The `notification` option configures the [`Notification`](@/api/notification.md) plugin.

You can set the `notification` option to one of the following:

| Setting   | Description                                                                 |
| --------- | --------------------------------------------------------------------------- |
| `false`   | Disable the [`Notification`](@/api/notification.md) plugin                |
| `true`    | Enable the plugin with default options                                      |
| An object | Enable the plugin and set `stackLimit` and `animation`                      |

##### notification: Additional options

| Option        | Type      | Default | Description |
| ------------- | --------- | ------- | ----------- |
| `stackLimit`  | `number`  | `10`    | Maximum visible toasts per corner. Extra requests are queued. |
| `animation`   | `boolean` | `true`  | Fade and slide animation when toasts appear. |

Read more:
- [Plugins: `Notification`](@/api/notification.md)

**Default**: <code>false</code>  
**Category**: [Notification](@/api/notification.md)  
**Since**: 17.1.0  
**Example**  
```js
notification: true,
```


### noWordWrapClassName

::: ask-about-api noWordWrapClassName|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4143

:::

_options.noWordWrapClassName : string_

The `noWordWrapClassName` option lets you add a CSS class name
to each cell that has the [`wordWrap`](#wordwrap) option set to `false`.

Read more:
- [`wordWrap`](#wordwrap)
- [`currentRowClassName`](#currentrowclassname)
- [`currentColClassName`](#currentcolclassname)
- [`currentHeaderClassName`](#currentheaderclassname)
- [`invalidCellClassName`](#invalidcellclassname)
- [`readOnlyCellClassName`](#readonlycellclassname)
- [`commentedCellClassName`](#commentedcellclassname)
- [`noWordWrapClassName`](#nowordwrapclassname)
- [`TableClassName`](#tableclassname)
- [`className`](#classname)

**Default**: <code>"htNoWrap"</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
// add an `is-noWrapCell` CSS class name
// to each cell that doesn't wrap content
noWordWrapClassName: 'is-noWrapCell',
```


### numericFormat

::: ask-about-api numericFormat|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4234

:::

_options.numericFormat : object_

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
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api observeDOMVisibility|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4254

:::

_options.observeDOMVisibility : boolean_

If the `observeDOMVisibility` option is set to `true`,
Handsontable rerenders every time it detects that the grid was made visible in the DOM.

Handsontable uses a `MutationObserver` to watch for CSS changes (such as `display: none` being removed)
on the container element and its ancestors. When visibility is restored after being hidden,
Handsontable automatically triggers a rerender to ensure correct layout and dimensions.
Set this option to `false` if you want to control rendering manually (e.g. by calling `render()` yourself).

**Default**: <code>true</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
// don't rerender the grid on visibility changes
observeDOMVisibility: false,
```


### outsideClickDeselects

::: ask-about-api outsideClickDeselects|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4290

:::

_options.outsideClickDeselects : boolean | function_

The `outsideClickDeselects` option determines what happens to the current [selection](@/guides/cell-features/selection/selection.md)
when you click outside of the grid.

You can set the `outsideClickDeselects` option to one of the following:

| Setting          | Description                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------- |
| `true` (default) | On a mouse click outside of the grid, clear the current [selection](@/guides/cell-features/selection/selection.md) |
| `false`          | On a mouse click outside of the grid, keep the current [selection](@/guides/cell-features/selection/selection.md)  |
| A function       | A function that takes the click event target and returns a boolean                                       |

**Default**: <code>true</code>  
**Category**: [Core](@/api/core.md)  
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


### pagination

::: ask-about-api pagination|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4331

:::

_options.pagination : boolean_

The `pagination` option configures the [`Pagination`](@/api/pagination.md) plugin.

You can set the `pagination` option to one of the following:

| Setting                          | Description                                                                                   |
| -------------------------------- | --------------------------------------------------------------------------------------------- |
| `false`                          | Disable the [`Pagination`](@/api/pagination.md) plugin                                            |
| `true`                           | Enable the [`Pagination`](@/api/pagination.md) plugin                                             |

##### pagination: Additional options

If you set the `pagination` option to an object, you can set the following `Pagination` plugin options:

| Option                   | Possible settings                                  | Description                                                                                                                                                      |
| ------------------------ | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pageSize`               | A number or `auto` (default: `10`)                 | Sets the number of rows displayed per page. If `'auto'` is set, the page size will be calculated to match all rows to the currently set table's viewport height  |
| `pageSizeList`           | An array (default: `['auto', 5, 10, 20, 50, 100]`) | Defines the selectable values for page size in the UI                                                                                                            |
| `initialPage`            | A number (default: `1`)                            | Specifies which page to display on initial load                                                                                                                  |
| `showPageSize`           | Boolean (default: `true`)                          | Controls visibility of the "page size" section                                                                                                                   |
| `showCounter`            | Boolean (default: `true`)                          | Controls visibility of the "page counter" section (e.g., "1 - 10 of 50");                                                                                        |
| `showNavigation`         | Boolean (default: `true`)                          | Controls visibility of the "page navigation" section                                                                                                             |
| `uiContainer`            | An HTML element (default: `null`)                  | The container element where the pagination UI will be installed. If not provided, the pagination container will be injected below the root table element.        |

Read more:
- [Rows pagination](@/guides/rows/rows-pagination/rows-pagination.md)
- [Plugins: `Pagination`](@/api/pagination.md)

**Default**: <code>undefined</code>  
**Category**: [Pagination](@/api/pagination.md)  
**Since**: 16.1.0  
**Example**  
```js
// enable the `Pagination` plugin
pagination: true,
```


### parsePastedValue

::: ask-about-api parsePastedValue|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6385

:::

_options.parsePastedValue : boolean_

The `parsePastedValue` option determines how pasted content is written to cells when the user pastes
from the clipboard into Handsontable (e.g. from another Handsontable instance or between cells in the same table).
It does not affect how other applications read or process the clipboard.

When set to `false`, pasted content is written as plain strings. Non-scalar values (e.g. objects) are coerced
to string, so an object becomes `"[object Object]"`.

When set to `true`, pasted text is parsed so that JSON-like (or other supported) values are converted to
JavaScript values and written to the data source. This allows copying and pasting more sophisticated JavaScript
structures (e.g. objects, arrays) between cells and between Handsontable instances. Cells then store the resulting
object (e.g. `{ id: 1, value: 'A1' }`). Schema validation is relaxed so object-based values can be pasted into
cells that would normally expect a scalar.

You can set the `parsePastedValue` option to one of the following:

| Setting           | Description                                      |
| ----------------- | ------------------------------------------------ |
| `false` (default) | Write pasted content as plain strings            |
| `true`            | Parse pasted text and write JavaScript values    |

**Default**: <code>false</code>  
**Category**: [CopyPaste](@/api/copyPaste.md)  
**Since**: 17.0.0  
**Example**  
```js
// write pasted content as strings (objects become "[object Object]")
parsePastedValue: false,
```
**Example**  
```js
// parse pasted text so cells receive JavaScript objects when pasted content is object-like
parsePastedValue: true,
```


### placeholder

::: ask-about-api placeholder|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4367

:::

_options.placeholder : string_

The `placeholder` option lets you display placeholder text in every empty cell.

You can set the `placeholder` option to one of the following:

| Setting            | Example        | Description                                                           |
| ------------------ | -------------- | --------------------------------------------------------------------- |
| A non-empty string | `'Empty cell'` | Display `Empty cell` text in empty cells                              |
| A non-string value | `000`          | Display `000` text in empty cells (non-string values get stringified) |

Read more:
- [`placeholderCellClassName`](#placeholdercellclassname)

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api placeholderCellClassName|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4396

:::

_options.placeholderCellClassName : string_

The `placeholderCellClassName` option lets you add a CSS class name to cells
that contain [`placeholder`](#placeholder) text.

Read more:
- [Cell validator](@/guides/cell-functions/cell-validator/cell-validator.md)
- [`placeholder`](#placeholder)
- [`currentRowClassName`](#currentrowclassname)
- [`currentHeaderClassName`](#currentheaderclassname)
- [`activeHeaderClassName`](#activeheaderclassname)
- [`currentColClassName`](#currentcolclassname)
- [`readOnlyCellClassName`](#readonlycellclassname)
- [`commentedCellClassName`](#commentedcellclassname)
- [`noWordWrapClassName`](#nowordwrapclassname)
- [`TableClassName`](#tableclassname)
- [`className`](#classname)

**Default**: <code>"htPlaceholder"</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
// add a `has-placeholder` CSS class name
// to each cell that contains `placeholder` text
placeholderCellClassName: 'has-placeholder',
```


### preventOverflow

::: ask-about-api preventOverflow|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4423

:::

_options.preventOverflow : string | boolean_

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

**Default**: <code>false</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
// prevent horizontal overflowing
preventOverflow: 'horizontal',
```


### readOnly

::: ask-about-api readOnly|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4497

:::

_options.readOnly : boolean_

The `readOnly` option determines whether a [cell](@/guides/cell-features/disabled-cells/disabled-cells.md#read-only-specific-cells),
[comment](@/guides/cell-features/comments/comments.md#make-a-comment-read-only), [column](@/guides/cell-features/disabled-cells/disabled-cells.md#read-only-columns)
or the [entire grid](@/guides/cell-features/disabled-cells/disabled-cells.md#read-only-grid) is editable or not. You can configure it as follows:

| Setting           | Description                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `false` (default) | Set as editable                                                                                                           |
| `true`            | - Set as read-only<br>- Add the [`readOnlyCellClassName`](#readonlycellclassname) CSS class name (by default: `htDimmed`) |

`readOnly` cells can't be changed by the [`populateFromArray()`](@/api/core.md#populatefromarray) method.

Read more:
- [Disabled cells](@/guides/cell-features/disabled-cells/disabled-cells.md)
- [Configuration options: Cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration)

**Default**: <code>false</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api readOnlyCellClassName|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4524

:::

_options.readOnlyCellClassName : string_

The `readOnlyCellClassName` option lets you add a CSS class name to [read-only](#readonly) cells.

Read more:
- [`currentRowClassName`](#currentrowclassname)
- [`currentColClassName`](#currentcolclassname)
- [`currentHeaderClassName`](#currentheaderclassname)
- [`activeHeaderClassName`](#activeheaderclassname)
- [`invalidCellClassName`](#invalidcellclassname)
- [`placeholderCellClassName`](#placeholdercellclassname)
- [`commentedCellClassName`](#commentedcellclassname)
- [`noWordWrapClassName`](#nowordwrapclassname)
- [`readOnlyCellClassName`](#readonlycellclassname)
- [`TableClassName`](#tableclassname)

**Default**: <code>"htDimmed"</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
// add a `is-readOnly` CSS class name
// to every read-only cell
readOnlyCellClassName: 'is-readOnly',
```


### renderAllColumns

::: ask-about-api renderAllColumns|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4576

:::

_options.renderAllColumns : boolean_

The `renderAllColumns` option configures Handsontable's [column virtualization](@/guides/columns/column-virtualization/column-virtualization.md).

You can set the `renderAllColumns` option to one of the following:

| Setting           | Description                                                                                                                                                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `false` (default) | Enable [column virtualization](@/guides/columns/column-virtualization/column-virtualization.md), rendering only visible columns for better performance with many columns.                                                                              |
| `true`            | Disable [column virtualization](@/guides/columns/column-virtualization/column-virtualization.md)<br>(render all columns of the grid), rendering all columns in the dataset, and ensuring all columns are available regardless of horizontal scrolling. |

Setting `renderAllColumns` to `true` overwrites the [`viewportColumnRenderingOffset`](#viewportcolumnrenderingoffset) setting.

Read more:
- [Column virtualization](@/guides/columns/column-virtualization/column-virtualization.md)

**Default**: <code>false</code>  
**Category**: [Core](@/api/core.md)  
**Since**: 14.1.0  
**Example**  
```js
// disable column virtualization
renderAllColumns: true,
```


### renderAllRows

::: ask-about-api renderAllRows|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4549

:::

_options.renderAllRows : boolean_

The `renderAllRows` option controls Handsontable's [row virtualization](@/guides/rows/row-virtualization/row-virtualization.md).
You can configure it as follows:

| Setting           | Description                                                                                                                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `false` (default) | Enable [row virtualization](@/guides/rows/row-virtualization/row-virtualization.md), rendering only the visible rows for optimal performance with large datasets.                                                  |
| `true`            | Disable [row virtualization](@/guides/rows/row-virtualization/row-virtualization.md)<br>(render all rows of the grid), rendering all rows in the dataset for consistent rendering and screen reader accessibility. |

Setting `renderAllRows` to `true` overwrites the [`viewportRowRenderingOffset`](#viewportrowrenderingoffset) setting.

Read more:
- [Row virtualization](@/guides/rows/row-virtualization/row-virtualization.md)

**Default**: <code>false</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
// disable row virtualization
renderAllRows: true,
```


### renderer

::: ask-about-api renderer|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4638

:::

_options.renderer : string | function_

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

To set the [`renderer`](#renderer), [`editor`](#editor), and [`validator`](#validator)
options all at once, use the [`type`](#type) option.

Read more:
- [Cell renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md)
- [Cell type](@/guides/cell-types/cell-type/cell-type.md)
- [Configuration options: Cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration)
- [`type`](#type)

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api rowHeaders|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4829

:::

_options.rowHeaders : boolean | Array&lt;string&gt; | function_

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

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api rowHeaderWidth|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4854

:::

_options.rowHeaderWidth : number | Array&lt;number&gt;_

The `rowHeaderWidth` option configures the width of row headers.

You can set the `rowHeaderWidth` option to one of the following:

| Setting  | Description                                     |
| -------- | ----------------------------------------------- |
| A number | Set the same width for every row header         |
| An array | Set different widths for individual row headers |

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
// set the same width for every row header
rowHeaderWidth: 25,

// set different widths for individual row headers
rowHeaderWidth: [25, 30, 55],
```


### rowHeights

::: ask-about-api rowHeights|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4899

:::

_options.rowHeights : number | Array&lt;number&gt; | string | Array&lt;string&gt; | Array&lt;undefined&gt; | function_

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

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api sanitizer|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6346

:::

_options.sanitizer : function_

The `sanitizer` option configures the function used to sanitize HTML before it is written to the DOM.
Whenever Handsontable sets HTML (e.g. cell content, headers, context menu labels, dialog content,
paste from clipboard), it can pass the string through this function first. Sanitization is important
when content comes from users or external sources to prevent XSS (e.g. script injection, event handlers).

By default (when no sanitizer is set), HTML is applied as-is (pass-through). You are responsible for
XSS protection. Set a sanitizer when you need to allow rich content while stripping or neutralizing
dangerous markup.

The function receives the raw HTML string and an optional second argument (source) indicating where
the content is used (e.g. `'innerHTML'`, `'CopyPaste.paste'`), so you can apply different rules per source.
It must return a string that is safe to assign to `innerHTML`.

This option is only respected when set in the table settings. It does not work when defined per column
or per cell (e.g. in `columns` or cell meta).

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
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


### search

::: ask-about-api search|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4976

:::

_options.search : boolean | object_

The `search` option enables and configures the [`Search`](@/api/search.md) plugin.

| Setting           | Description                                                                    |
| ----------------- | ------------------------------------------------------------------------------ |
| `false` (default) | Disable the [`Search`](@/api/search.md) plugin                                 |
| `true`            | Enable the [`Search`](@/api/search.md) plugin with the default configuration   |
| An object         | Enable the [`Search`](@/api/search.md) plugin and apply a custom configuration |

When set to an object, the following properties are supported:

| Property            | Type       | Default                          | Description                                                                                                                                                        |
| ------------------- | ---------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `searchResultClass` | `string`   | `'htSearchResult'`               | CSS class name applied to every cell where `isSearchResult === true`.                                                                                              |
| `queryMethod`       | `Function` | Case-insensitive substring match | Tests whether the query string matches a cell value. Signature: `(queryStr: string, value: string\|number\|null, cellProperties: object) => boolean`.              |
| `callback`          | `Function` | Sets `isSearchResult` on cell metadata | Called for every cell after each test. Signature: `(instance: Handsontable, row: number, col: number, data: string\|number\|null, testResult: boolean) => void`. |

Default `queryMethod` behavior: case-insensitive, locale-aware substring match using `toLocaleLowerCase()` with `cellProperties.locale`.

Default `callback` behavior: sets `instance.getCellMeta(row, col).isSearchResult = testResult` on every cell.

**Per-cell overrides:** `queryMethod` and `callback` can also be set on individual cells, columns, or rows
using the cascading configuration model. A cell-level `search.queryMethod` or `search.callback` takes
precedence over the plugin-level setting for that cell. `searchResultClass` does not support per-cell overrides.

Read more:
- [Searching values](@/guides/navigation/searching-values/searching-values.md)
- [Custom query method](@/guides/navigation/searching-values/searching-values.md#custom-query-method)
- [Custom callback](@/guides/navigation/searching-values/searching-values.md#custom-callback)
- [Per-cell overrides](@/guides/navigation/searching-values/searching-values.md#per-cell-querymethod-and-callback)

**Default**: <code>false</code>  
**Category**: [Search](@/api/search.md)  
**Example**  
```js
// Enable with the default configuration
search: true,

// Enable with a custom configuration
search: {
  // Apply a custom CSS class to matching cells instead of 'htSearchResult'
  searchResultClass: 'customClass',
  // Replace the built-in substring match with exact matching
  queryMethod(queryStr, value, cellProperties) {
    if (!queryStr || queryStr.length === 0) return false;
    if (value === undefined || value === null) return false;

    return queryStr.toString() === value.toString();
  },
  // Count results while preserving default highlighting
  callback(instance, row, col, data, testResult) {
    // Preserve the default isSearchResult flag so highlighting still works
    instance.getCellMeta(row, col).isSearchResult = testResult;

    if (testResult) {
      // Custom logic: e.g., increment a result counter
    }
  }
},

// Override queryMethod for a specific column only (per-cell via cascading config)
columns: [
  {},
  {
    search: {
      queryMethod(queryStr, value) {
        return queryStr.toString() === value.toString(); // exact match for column 1
      }
    }
  }
],
```


### searchInput

::: ask-about-api searchInput|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4993

:::

_options.searchInput : boolean_

The `searchInput` option configures whether the [`multiSelect`](@/guides/cell-types/multiselect-cell-type/multiselect-cell-type.md) editor's search input is visible.

**Default**: <code>true</code>  
**Category**: [Core](@/api/core.md)  
**Since**: 17.0.0  
**Example**  
```js
columns: [{
  type: 'multiselect',
  // hide the `multiSelect` editor's search input
  searchInput: false,
}],
```


### selectionMode

::: ask-about-api selectionMode|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5025

:::

_options.selectionMode : string_

The `selectionMode` option configures how [selection](@/guides/cell-features/selection/selection.md) works.

You can set the `selectionMode` option to one of the following:

| Setting      | Description                                                  |
| ------------ | ------------------------------------------------------------ |
| `'single'`   | Allow the user to select only one cell at a time.            |
| `'range'`    | Allow the user to select one range of cells at a time.       |
| `'multiple'` | Allow the user to select multiple ranges of cells at a time. |

Read more:
- [Selection: Selecting ranges](@/guides/cell-features/selection/selection.md#select-ranges)

**Default**: <code>"multiple"</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api selectOptions|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5081

:::

_options.selectOptions : Array&lt;string&gt; | object | function_

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
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api skipColumnOnPaste|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5112

:::

_options.skipColumnOnPaste : boolean_

The `skipColumnOnPaste` option determines whether you can paste data into a given column.

You can only apply the `skipColumnOnPaste` option to an entire column, using the [`columns`](#columns) option. This option is not supported for the global table level settings.

You can set the `skipColumnOnPaste` option to one of the following:

| Setting           | Description                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| `false` (default) | Enable pasting data into this column                                                                  |
| `true`            | - Disable pasting data into this column<br>- On pasting, paste data into the next column to the right |

Read more:
- [Configuration options: Setting column options](@/guides/getting-started/configuration-options/configuration-options.md#set-column-options)

**Default**: <code>false</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api skipRowOnPaste|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5148

:::

_options.skipRowOnPaste : boolean_

The `skipRowOnPaste` option determines whether you can paste data into a given row.

You can only apply the `skipRowOnPaste` option to an entire row, using the [`cells`](#cells) option. This option is not supported for the global table level settings.

You can set the `skipRowOnPaste` option to one of the following:

| Setting           | Description                                                                         |
| ----------------- | ----------------------------------------------------------------------------------- |
| `false` (default) | Enable pasting data into this row                                                   |
| `true`            | - Disable pasting data into this row<br>- On pasting, paste data into the row below |

Read more:
- [Configuration options: Setting row options](@/guides/getting-started/configuration-options/configuration-options.md#set-row-options)

**Default**: <code>false</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api sortByRelevance|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5180

:::

_options.sortByRelevance : boolean_

The `sortByRelevance` option configures whether [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md) cells'
lists are sorted in the same order as provided in the [`source`](#source) option.

You can set the `sortByRelevance` option to one of the following:

| Setting          | Description                                                                  |
| ---------------- | ---------------------------------------------------------------------------- |
| `true` (default) | Sort options in the same order as provided in the [`source`](#source) option |
| `false`          | Sort options alphabetically                                                  |

Read more:
- [`source`](#source)
- [Autocomplete cell type](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)

**Default**: <code>true</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api source|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5266

:::

_options.source : Array | function_

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
- [`strict`](#strict)
- [`allowHtml`](#allowhtml)
- [`filter`](#filter)
- [`sortByRelevance`](#sortbyrelevance)

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api sourceDataValidator|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5961

:::

_options.sourceDataValidator : function_

The [`sourceDataValidator`](@/api/options.md#sourcedatavalidator) option sets a function that validates values
when they are written to the source data layer. Validation runs on table initialization and when calling
[`loadData`](@/api/core.md#loaddata), [`updateData`](@/api/core.md#updatedata), or
[`setSourceDataAtCell`](@/api/core.md#setsourcedataatcell). It does not run for the `setData*` family of methods.

Return `true` from the function to mark the value as valid, or `false` to mark it invalid. When a value is
invalid and [`allowInvalid`](@/api/options.md#allowinvalid) is `false`, it is replaced with `null` in the
source (on initialization and when calling `loadData` or `updateData`). When `allowInvalid` is `true`, invalid
values are kept; a warning is still logged when the validator returns `false`. An exception:
[`setSourceDataAtCell`](@/api/core.md#setsourcedataatcell) - when the validator returns `false`, the write is
skipped and the cell is not nullified; the previous value in the source remains unchanged. Use
[`allowEmpty`](@/api/options.md#allowempty) to treat `null`, `undefined`, or `''` as valid when appropriate.

Optionally set [`sourceDataWarningMessage`](@/api/options.md#sourcedatawarningmessage) to customize the
message logged for invalid values.

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api sourceDataWarningMessage|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5977

:::

_options.sourceDataWarningMessage : string_

The [`sourceDataWarningMessage`](@/api/options.md#sourcedatawarningmessage) option sets the message used when
a value fails [`sourceDataValidator`](@/api/options.md#sourcedatavalidator). When not set, no message is logged.

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
**Since**: 17.0.0  
**Example**  
```js
sourceDataWarningMessage: 'The source data is invalid.',
```


### sourceSortFunction

::: ask-about-api sourceSortFunction|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5203

:::

_options.sourceSortFunction : function_

The `sourceSortFunction` option sets a function to sort the options available in [`multiSelect`](@/guides/cell-types/multiselect-cell-type/multiselect-cell-type.md)-typed cells.

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api startCols|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5289

:::

_options.startCols : number_

If the [`data`](#data) option is not set, the `startCols` option sets the initial number of empty columns.

The `startCols` option works only in Handsontable's constructor and only when [`data`](#data) is not provided.

::: tip
When [`minSpareCols`](#minsparecols) is set alongside `startCols`, the `startCols` columns count toward the
minimum number of spare columns. As a result, the total initial column count will be the maximum of
`startCols` and `minSpareCols`.
:::

**Default**: <code>5</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
// start with 15 empty columns
startCols: 15,
```


### startRows

::: ask-about-api startRows|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5312

:::

_options.startRows : number_

If the [`data`](#data) option is not set, the `startRows` option sets the initial number of empty rows.

The `startRows` option works only in Handsontable's constructor and only when [`data`](#data) is not provided.

::: tip
When [`minSpareRows`](#minsparerows) is set alongside `startRows`, the `startRows` rows count toward the
minimum number of spare rows. As a result, the total initial row count will be the maximum of
`startRows` and `minSpareRows`.
:::

**Default**: <code>5</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
// start with 15 empty rows
startRows: 15,
```


### stretchH

::: ask-about-api stretchH|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5340

:::

_options.stretchH : string_

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

**Default**: <code>"none"</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
// fit the grid to the container
// by stretching all columns evenly
stretchH: 'all',
```


### strict

::: ask-about-api strict|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5376

:::

_options.strict : boolean_

The `strict` option configures the behavior of [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md) cells.

You can set the `strict` option to one of the following:

| Setting | Mode                                                                                          | Description                                                                                |
| ------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `true`  | [Strict mode](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md#autocomplete-strict-mode)         | The end user:<br>- Can only choose one of suggested values<br>- Can't enter a custom value |
| `false` | [Flexible mode](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md#autocomplete-flexible-mode)     | The end user:<br>- Can choose one of suggested values<br>- Can enter a custom value        |

This option can be set at any level of the [cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration):
the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options), the [`columns`](#columns) level, the [`cells`](#cells) level, and the [`cell`](#cell) level.

Read more:
- [Autocomplete cell type](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
- [`source`](#source)

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api tableClassName|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5415

:::

_options.tableClassName : string | Array&lt;string&gt;_

The `tableClassName` option lets you add CSS class names
to every Handsontable instance inside the `container` element.

You can set the `tableClassName` option to one of the following:

| Setting             | Description                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------ |
| A string            | Add a single CSS class name to every Handsontable instance inside the `container` element  |
| An array of strings | Add multiple CSS class names to every Handsontable instance inside the `container` element |

Read more:
- [`currentRowClassName`](#currentrowclassname)
- [`currentColClassName`](#currentcolclassname)
- [`currentHeaderClassName`](#currentheaderclassname)
- [`activeHeaderClassName`](#activeheaderclassname)
- [`invalidCellClassName`](#invalidcellclassname)
- [`placeholderCellClassName`](#placeholdercellclassname)
- [`readOnlyCellClassName`](#readonlycellclassname)
- [`noWordWrapClassName`](#nowordwrapclassname)
- [`commentedCellClassName`](#commentedcellclassname)
- [`className`](#classname)

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api tabMoves|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5586

:::

_options.tabMoves : object | function_

The `tabMoves` option configures the action of the <kbd>**Tab**</kbd> key.

You can set the `tabMoves` option to an object with the following properties
(or to a function that returns such an object):

| Property | Type   | Description                                                                                                                                              |
| -------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `row`    | Number | - On pressing <kbd>**Tab**</kbd>, move selection `row` rows down<br>- On pressing <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd>, move selection `row` rows up              |
| `col`    | Number | - On pressing <kbd>**Tab**</kbd>, move selection `col` columns right<br>- On pressing <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd>, move selection `col` columns left     |

**Default**: <code>{row: 0, col: 1}</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api tabNavigation|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4019

:::

_options.tabNavigation : boolean_

When set to `false`, the `tabNavigation` option changes the behavior of the
<kbd>Tab</kbd> and <kbd>Shift</kbd>+<kbd>Tab</kbd> keyboard shortcuts. The Handsontable
no more captures that shortcuts to make the grid navigation available (`tabNavigation: true`)
but returns control to the browser so the native page navigation is possible.

**Default**: <code>true</code>  
**Category**: [Core](@/api/core.md)  
**Since**: 14.0.0  
**Example**  
```js
// you can't navigate row and column headers using <kbd>Tab</kbd> or <kbd>Shift</kbd>+<kbd>Tab</kbd> keyboard shortcuts
tabNavigation: false,

// default behavior: you can navigate row and column headers using <kbd>Tab</kbd> or <kbd>Shift</kbd>+<kbd>Tab</kbd> keyboard shortcuts
tabNavigation: true,
```


### textEllipsis

::: ask-about-api textEllipsis|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5445

:::

_options.textEllipsis : boolean_

The `textEllipsis` option configures whether the text content in the cells should be truncated with an ellipsis (three dots).

You can set the `textEllipsis` option to one of the following:

| Setting           | Description                                   |
| ----------------- | --------------------------------------------- |
| `false` (default) | Don't truncate text content with an ellipsis  |
| `true`            | Truncate text content with an ellipsis        |

**Default**: <code>false</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api theme|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5528

:::

_options.theme : ThemeBuilder | string | undefined_

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
- [`themeName`](#themename)

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api themeName|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5462

:::

_options.themeName : string | undefined_

The `themeName` option allows enabling a theme by that name.

Read more:
- [Themes](@/guides/styling/themes/themes.md)

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
**Since**: 15.0.0  
**Example**  
```js
themeName: 'ht-theme-name',
```


### timeFormat

::: ask-about-api timeFormat|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1798

:::

_options.timeFormat : object_

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
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api title|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5620

:::

_options.title : string_

The `title` option configures [column header](@/guides/columns/column-header/column-header.md) names.

You can set the `title` option to a string.

Read more:
- [Column header](@/guides/columns/column-header/column-header.md)
- [`columns`](#columns)

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api trimDropdown|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5665

:::

_options.trimDropdown : boolean_

The `trimDropdown` option configures the width of the [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
and [`dropdown`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md) lists.

When set to `true` (default), the list is trimmed to match the width of the edited cell,
which can truncate long option labels. When set to `false`, the list expands to fit its
longest option, which may make the list wider than the cell.

You can set the `trimDropdown` option to one of the following:

| Setting          | Description                                                                     |
| ---------------- | ------------------------------------------------------------------------------- |
| `true` (default) | Make the dropdown/autocomplete list's width the same as the edited cell's width |
| `false`          | Scale the dropdown/autocomplete list's width to the list's content              |

This option can be set at any level of the [cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration):
the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options), the [`columns`](#columns) level, the [`cells`](#cells) level, and the [`cell`](#cell) level.

Read more:
- [Autocomplete cell type](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
- [Dropdown cell type](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md)

**Default**: <code>true</code>  
**Category**: [Core](@/api/core.md)  
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


### trimRows

::: ask-about-api trimRows|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5696

:::

_options.trimRows : boolean | Array&lt;number&gt;_

The `trimRows` option configures the [`TrimRows`](@/api/trimRows.md) plugin.

You can set the `trimRows` option to one of the following:

| Setting                          | Description                                                                                   |
| -------------------------------- | --------------------------------------------------------------------------------------------- |
| `false`                          | Disable the [`TrimRows`](@/api/trimRows.md) plugin                                            |
| `true`                           | Enable the [`TrimRows`](@/api/trimRows.md) plugin                                             |
| An array of physical row indexes | - Enable the [`TrimRows`](@/api/trimRows.md) plugin<br>- Trim selected rows at initialization |

Read more:
- [Plugins: `TrimRows`](@/api/trimRows.md)
- [Row trimming](@/guides/rows/row-trimming/row-trimming.md)

**Default**: <code>undefined</code>  
**Category**: [TrimRows](@/api/trimRows.md)  
**Example**  
```js
// enable the `TrimRows` plugin
trimRows: true,

// enable the `TrimRows` plugin
// at Handsontable's initialization, trim rows 5, 10, and 15
trimRows: [5, 10, 15],
```


### trimWhitespace

::: ask-about-api trimWhitespace|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5723

:::

_options.trimWhitespace : boolean_

The `trimWhitespace` option configures automatic whitespace removal. This option
affects the cell renderer and the cell editor.

You can set the `trimWhitespace` option to one of the following:

| Setting          | Description                                                     |
| ---------------- | --------------------------------------------------------------- |
| `true` (default) | Remove whitespace at the beginning and at the end of each cell |
| `false`          | Don't remove whitespace                                         |

**Default**: <code>true</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api type|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5780

:::

_options.type : string_

The `type` option lets you set the [`renderer`](#renderer), [`editor`](#editor), and [`validator`](#validator)
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

Read more:
- [Cell type](@/guides/cell-types/cell-type/cell-type.md)
- [Cell renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md)
- [Cell editor](@/guides/cell-functions/cell-editor/cell-editor.md)
- [Cell validator](@/guides/cell-functions/cell-validator/cell-validator.md)
- [Configuration options: Cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration)
- [`renderer`](#renderer)
- [`editor`](#editor)
- [`validator`](#validator)
- [`valueParser`](#valueparser)
- [`valueFormatter`](#valueformatter)

**Default**: <code>"text"</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api uncheckedTemplate|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5830

:::

_options.uncheckedTemplate : boolean | string | number_

The `uncheckedTemplate` option lets you configure what value
an unchecked [`checkbox`](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md) cell has.

You can set the `uncheckedTemplate` option to one of the following:

| Setting           | Description                                                                                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `false` (default) | If a [`checkbox`](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md) cell is unchecked,<br>the [`getDataAtCell`](@/api/core.md#getdataatcell) method for this cell returns `false`                 |
| A string          | If a [`checkbox`](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md) cell is unchecked,<br>the [`getDataAtCell`](@/api/core.md#getdataatcell) method for this cell returns a string of your choice |

::: warning
When you set `uncheckedTemplate` to a custom string value (e.g. `'No'`), using `false` in your data source to
represent an unchecked state is no longer valid. Only the exact custom string value matches an unchecked checkbox.
Pair `uncheckedTemplate` with [`checkedTemplate`](#checkedtemplate) to define both states explicitly.
:::

This option can be set at any level of the [cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration):
the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options), the [`columns`](#columns) level, the [`cells`](#cells) level, and the [`cell`](#cell) level.

Read more:
- [Checkbox cell type: Checkbox template](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md#checkbox-template)
- [`getDataAtCell()`](@/api/core.md#getdataatcell)
- [`checkedTemplate`](#checkedtemplate)

**Default**: <code>false</code>  
**Category**: [Core](@/api/core.md)  
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


### undo

::: ask-about-api undo|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5858

:::

_options.undo : boolean_

The `undo` option configures the [`UndoRedo`](@/api/undoRedo.md) plugin.

You can set the `undo` option to one of the following:

| Setting | Description                                        |
| ------- | -------------------------------------------------- |
| `true`  | Enable the [`UndoRedo`](@/api/undoRedo.md) plugin  |
| `false` | Disable the [`UndoRedo`](@/api/undoRedo.md) plugin |

By default, the `undo` option is set to `true`,
To disable the [`UndoRedo`](@/api/undoRedo.md) plugin completely,
set the `undo` option to `false`.

Read more:
- [Undo and redo](@/guides/accessories-and-menus/undo-redo/undo-redo.md)

**Default**: <code>undefined</code>  
**Category**: [UndoRedo](@/api/undoRedo.md)  
**Example**  
```js
// enable the `UndoRedo` plugin
undo: true,
```


### validator

::: ask-about-api validator|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5921

:::

_options.validator : function | RegExp | string_

The `validator` option sets a [cell validator](@/guides/cell-functions/cell-validator/cell-validator.md) for a cell.

You can set the `validator` option to one of the following:

| Setting              | Description                                                                      |
| -------------------- | -------------------------------------------------------------------------------- |
| A string             | A [cell validator alias](@/guides/cell-functions/cell-validator/cell-validator.md)              |
| A function           | Your [custom cell validator function](@/guides/cell-functions/cell-validator/cell-validator.md) |
| A regular expression | A regular expression used for cell validation                                    |

This option can be set at any level of the [cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration):
the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options), the [`columns`](#columns) level, the [`cells`](#cells) level, and the [`cell`](#cell) level.

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

To set the [`editor`](#editor), [`renderer`](#renderer), and [`validator`](#validator)
options all at once, use the [`type`](#type) option.

Read more:
- [Cell validator](@/guides/cell-functions/cell-validator/cell-validator.md)
- [Cell type](@/guides/cell-types/cell-type/cell-type.md)
- [Configuration options: Cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration)
- [`type`](#type)

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
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
         ...
     }
   },
],
```


### valueFormatter

::: ask-about-api valueFormatter|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4723

:::

_options.valueFormatter : function_

The `valueFormatter` option sets a custom function for formatting cell values before display.

Unlike the [`renderer`](#renderer) option, which is responsible for the complete cell rendering process
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
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api valueGetter|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6000

:::

_options.valueGetter : function_

The `valueGetter` option configures a function that defines what value will be used when displaying the cell content.
It can be used to modify the value of a cell before it is displayed (for example, for object-based data).

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api valueParser|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4795

:::

_options.valueParser : function_

The `valueParser` option sets a custom function for converting editor output into the source data format.

Unlike [`valueFormatter`](#valueformatter), which formats values for display, `valueParser` runs only when a
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
- [`editor`](#editor)
- [`renderer`](#renderer)
- [`valueFormatter`](#valueformatter)
- [`sourceDataValidator`](#sourcedatavalidator)
- [Configuration options: Cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration)

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api valueSetter|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6023

:::

_options.valueSetter : function_

The `valueSetter` option configures a function that defines what value will be used when setting the cell content.
It can be used to modify the value of a cell before it is saved (for example, for object-based data).

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api viewportColumnRenderingOffset|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6051

:::

_options.viewportColumnRenderingOffset : number | 'auto'_

The `viewportColumnRenderingOffset` option configures the number of columns
to be rendered outside of the grid's viewport.

You can set the `viewportColumnRenderingOffset` option to one of the following:

| Setting            | Description                                             |
| ------------------ | ------------------------------------------------------- |
| `auto` (default)   | Use the offset calculated automatically by Handsontable |
| A number           | Set the offset manually                                 |

The `viewportColumnRenderingOffset` setting is ignored when [`renderAllColumns`](#renderallcolumns) is set to `true`.

Read more:
- [Performance: Define the number of pre-rendered rows and columns](@/guides/optimization/performance/performance.md#define-the-number-of-pre-rendered-rows-and-columns)

**Default**: <code>&#x27;auto&#x27;</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
// render 70 columns outside of the grid's viewport
viewportColumnRenderingOffset: 70,
```


### viewportColumnRenderingThreshold

::: ask-about-api viewportColumnRenderingThreshold|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6112

:::

_options.viewportColumnRenderingThreshold : number | 'auto'_

The `viewportColumnRenderingThreshold` option configures what column number starting from the left or right
(depends on the scroll direction) should trigger the rendering of columns outside of the grid's viewport.

You can set the `viewportColumnRenderingThreshold` option to one of the following:

| Setting            | Description                                             |
| ------------------ | ------------------------------------------------------- |
| `auto`             | Triggers rendering at half the offset defined by [`viewportColumnRenderingOffset`](#viewportcolumnrenderingoffset) option |
| A number           | Sets the offset manually (`0` is a default)             |

The `viewportColumnRenderingThreshold` setting is ignored when [`renderAllColumn`](#renderallcolumn) is set to `true`.

Read more:
- [Performance: Define the number of pre-rendered rows and columns](@/guides/optimization/performance/performance.md#define-the-number-of-pre-rendered-rows-and-columns)
- [Column virtualization](@/guides/columns/column-virtualization/column-virtualization.md)

**Default**: <code>0</code>  
**Category**: [Core](@/api/core.md)  
**Since**: 1.14.7  
**Example**  
```js
// render 12 columns outside of the grid's viewport
viewportColumnRenderingOffset: 12,
// the columns outside of the viewport will be rendered when the user scrolls to the 8th column from/to
viewportColumnRenderingThreshold: 8,
```


### viewportRowRenderingOffset

::: ask-about-api viewportRowRenderingOffset|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6080

:::

_options.viewportRowRenderingOffset : number | 'auto'_

The `viewportRowRenderingOffset` option configures the number of rows
to be rendered outside of the grid's viewport.

You can set the `viewportRowRenderingOffset` option to one of the following:

| Setting            | Description                                             |
| ------------------ | ------------------------------------------------------- |
| `auto` (default)   | Use the offset calculated automatically by Handsontable |
| A number           | Set the offset manually                                 |

The `viewportRowRenderingOffset` setting is ignored when [`renderAllRows`](#renderallrows) is set to `true`.

Read more:
- [Performance: Define the number of pre-rendered rows and columns](@/guides/optimization/performance/performance.md#define-the-number-of-pre-rendered-rows-and-columns)
- [Column virtualization](@/guides/columns/column-virtualization/column-virtualization.md)

**Default**: <code>&#x27;auto&#x27;</code>  
**Category**: [Core](@/api/core.md)  
**Example**  
```js
// render 70 rows outside of the grid's viewport
viewportRowRenderingOffset: 70,
```


### viewportRowRenderingThreshold

::: ask-about-api viewportRowRenderingThreshold|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6144

:::

_options.viewportRowRenderingThreshold : number | 'auto'_

The `viewportRowRenderingThreshold` option configures what row number starting from the top or bottom
(depends on the scroll direction) should trigger the rendering of rows outside of the grid's viewport.

You can set the `viewportRowRenderingThreshold` option to one of the following:

| Setting            | Description                                             |
| ------------------ | ------------------------------------------------------- |
| `auto`             | Triggers rendering at half the offset defined by [`viewportRowRenderingOffset`](#viewportrowrenderingoffset) option |
| A number           | Sets the offset manually (`0` is a default)             |

The `viewportRowRenderingThreshold` setting is ignored when [`renderAllRows`](#renderallrows) is set to `true`.

Read more:
- [Performance: Define the number of pre-rendered rows and columns](@/guides/optimization/performance/performance.md#define-the-number-of-pre-rendered-rows-and-columns)
- [Row virtualization](@/guides/rows/row-virtualization/row-virtualization.md)

**Default**: <code>0</code>  
**Category**: [Core](@/api/core.md)  
**Since**: 1.14.7  
**Example**  
```js
// render 12 rows outside of the grid's viewport
viewportRowRenderingOffset: 12,
// the rows outside of the viewport will be rendered when the user scrolls to the 8th row from/to
viewportRowRenderingThreshold: 8,
```


### visibleRows

::: ask-about-api visibleRows|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6192

:::

_options.visibleRows : number_

The `visibleRows` option sets the height of the [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
, [`dropdown`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md) and [`multiSelect`](@/guides/cell-types/multiselect-cell-type/multiselect-cell-type.md)-typed cells' lists.

When the number of list options exceeds the `visibleRows` number, a scrollbar appears.

::: tip
If the grid has a fixed [`height`](#height) set, the dropdown list may be visually constrained by the available
space and show fewer rows than the `visibleRows` value. In such cases, the list is clipped to fit within the grid.
:::

This option can be set at any level of the [cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration):
the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options), the [`columns`](#columns) level, the [`cells`](#cells) level, and the [`cell`](#cell) level.

Read more:
- [Autocomplete cell type](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
- [Dropdown cell type](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md)
- [MultiSelect cell type](@/guides/cell-types/multiselect-cell-type/multiselect-cell-type.md)

**Default**: <code>10</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api width|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6240

:::

_options.width : number | 'auto' | string | function_

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
[`height`](#height).

::: tip
For horizontal scrolling to work, you must also set the [`height`](#height) option in Handsontable's configuration.
Setting `width` alone (without `height`) does not activate the scrollable viewport.
Setting the height via inline CSS on the container element is not supported - use the `height` configuration option instead.
:::

Read more:
- [Grid size](@/guides/getting-started/grid-size/grid-size.md)

**Default**: <code>undefined</code>  
**Category**: [Core](@/api/core.md)  
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

::: ask-about-api wordWrap|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6286

:::

_options.wordWrap : boolean_

The `wordWrap` option configures whether content that exceeds a column's width is wrapped or not.

You can set the `wordWrap` option to one of the following:

| Setting          | Description                                             |
| ---------------- | ------------------------------------------------------- |
| `true` (default) | If content exceeds the column's width, wrap the content |
| `false`          | Don't wrap content                                      |

To style cells that don't wrap content, use the [`noWordWrapClassName`](#nowordwrapclassname) option.

::: tip
Word wrapping only applies to content that contains spaces or other soft-wrap opportunities.
A long unbroken string without spaces (e.g. a URL or a continuous number sequence) does not wrap
regardless of this setting.
:::

This option can be set at any level of the [cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration):
the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options), the [`columns`](#columns) level, the [`cells`](#cells) level, and the [`cell`](#cell) level.

Read more:
- [`noWordWrapClassName`](#nowordwrapclassname)

**Default**: <code>true</code>  
**Category**: [Core](@/api/core.md)  
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

## Methods

### isEmptyCol

::: ask-about-api isEmptyCol|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3155

:::

_options.isEmptyCol(col) ⇒ boolean_

The `isEmptyCol` option lets you define your own custom method
for checking if a column at a given visual index is empty.

The `isEmptyCol` setting overwrites the built-in [`isEmptyCol`](@/api/core.md#isemptycol) method.
The function receives a visual column index and must return a `boolean`.

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](#columns), [`cells`](#cells), or [`cell`](#cell) options.

**Category**: [Core](@/api/core.md)  
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

::: ask-about-api isEmptyRow|Options

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3203

:::

_options.isEmptyRow(row) ⇒ boolean_

The `isEmptyRow` option lets you define your own custom method
for checking if a row at a given visual index is empty.

The `isEmptyRow` setting overwrites the built-in [`isEmptyRow`](@/api/core.md#isemptyrow) method.
The function receives a visual row index and must return a `boolean`.

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](#columns), [`cells`](#cells), or [`cell`](#cell) options.

**Category**: [Core](@/api/core.md)  
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


