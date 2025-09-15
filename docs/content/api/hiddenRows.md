---
title: HiddenRows
metaTitle: HiddenRows - JavaScript Data Grid | Handsontable
permalink: /api/hidden-rows
canonicalUrl: /api/hidden-rows
searchCategory: API Reference
hotPlugin: true
editLink: false
id: linbgjey
description: Use the HiddenRows plugin with its API options and methods to hide specified rows, without modifying your source data.
react:
  id: ztxn1ekz
  metaTitle: HiddenRows - React Data Grid | Handsontable
angular:
  id: t0m9v7ef
  metaTitle: HiddenRows - Angular Data Grid | Handsontable
---

# Plugin: HiddenRows

[[toc]]

## Description

The `HiddenRows` plugin lets you [hide specified rows](@/guides/rows/row-hiding/row-hiding.md).

"Hiding a row" means that the hidden row doesn't get rendered as a DOM element.

The `HiddenRows` plugin doesn't modify the source data,
and doesn't participate in data transformation
(the shape of the data returned by the [`getData*()` methods](@/api/core.md#getdata) stays intact).

You can set the following configuration options:

| Option | Required | Type | Default | Description |
|---|---|---|---|---|
| `rows` | No | Array | - | [Hides specified rows by default](@/guides/rows/row-hiding/row-hiding.md#step-1-specify-rows-hidden-by-default) |
| `indicators` | No | Boolean | `false` | [Shows UI indicators](@/guides/rows/row-hiding/row-hiding.md#step-2-show-ui-indicators) |
| `copyPasteEnabled` | No | Boolean | `true` | [Sets up copy/paste behavior](@/guides/rows/row-hiding/row-hiding.md#step-4-set-up-copy-and-paste-behavior) |

**Example**  
::: only-for javascript
```js
const container = document.getElementById('example');
const hot = new Handsontable(container, {
  data: getData(),
  hiddenRows: {
    copyPasteEnabled: true,
    indicators: true,
    rows: [1, 2, 5]
  }
});

// access the `HiddenRows` plugin's instance
const hiddenRowsPlugin = hot.getPlugin('hiddenRows');

// hide a single row
hiddenRowsPlugin.hideRow(1);

// hide multiple rows
hiddenRowsPlugin.hideRow(1, 2, 9);

// hide multiple rows as an array
hiddenRowsPlugin.hideRows([1, 2, 9]);

// unhide a single row
hiddenRowsPlugin.showRow(1);

// unhide multiple rows
hiddenRowsPlugin.showRow(1, 2, 9);

// unhide multiple rows as an array
hiddenRowsPlugin.showRows([1, 2, 9]);

// to see your changes, re-render your Handsontable instance
hot.render();
```
:::

::: only-for react
```jsx
const hotRef = useRef(null);

...

<HotTable
  ref={hotRef}
  data={getData()}
  hiddenRows={{
    copyPasteEnabled: true,
    indicators: true,
    rows: [1, 2, 5]
  }}
/>

// access the `HiddenRows` plugin's instance
const hot = hotRef.current.hotInstance;
const hiddenRowsPlugin = hot.getPlugin('hiddenRows');

// hide a single row
hiddenRowsPlugin.hideRow(1);

// hide multiple rows
hiddenRowsPlugin.hideRow(1, 2, 9);

// hide multiple rows as an array
hiddenRowsPlugin.hideRows([1, 2, 9]);

// unhide a single row
hiddenRowsPlugin.showRow(1);

// unhide multiple rows
hiddenRowsPlugin.showRow(1, 2, 9);

// unhide multiple rows as an array
hiddenRowsPlugin.showRows([1, 2, 9]);

// to see your changes, re-render your Handsontable instance
hot.render();
```
:::

::: only-for angular
```ts
import { AfterViewInit, Component, ViewChild } from "@angular/core";
import {
  GridSettings,
  HotTableModule,
  HotTableComponent,
} from "@handsontable/angular-wrapper";

`@Component`({
  selector: "app-example",
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table themeName="ht-theme-main" [settings]="gridSettings" />
  </div>`,
})
export class ExampleComponent implements AfterViewInit {
  `@ViewChild`(HotTableComponent, { static: false })
  readonly hotTable!: HotTableComponent;

  readonly gridSettings = <GridSettings>{
    data: this.getData(),
    hiddenRows: {
      copyPasteEnabled: true,
      indicators: true,
      rows: [1, 2, 5],
    },
  };

  ngAfterViewInit(): void {
    // Access the `HiddenRows` plugin's instance
    const hot = this.hotTable.hotInstance;
    const hiddenRowsPlugin = hot.getPlugin("hiddenRows");

    // Hide a single row
    hiddenRowsPlugin.hideRow(1);

    // Hide multiple rows
    hiddenRowsPlugin.hideRow(1, 2, 9);

    // Hide multiple rows as an array
    hiddenRowsPlugin.hideRows([1, 2, 9]);

    // Unhide a single row
    hiddenRowsPlugin.showRow(1);

    // Unhide multiple rows
    hiddenRowsPlugin.showRow(1, 2, 9);

    // Unhide multiple rows as an array
    hiddenRowsPlugin.showRows([1, 2, 9]);

    // To see your changes, re-render your Handsontable instance
    hot.render();
  }

  private getData(): any[] {
    // Get some data
  }
}
```
:::

## Options

### hiddenRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/dataMap/metaManager/metaSchema.js#L2692

:::

_hiddenRows.hiddenRows : boolean | object_

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

## Methods

### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/hiddenRows/hiddenRows.js#L562

:::

_hiddenRows.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/hiddenRows/hiddenRows.js#L261

:::

_hiddenRows.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/hiddenRows/hiddenRows.js#L227

:::

_hiddenRows.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getHiddenRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/hiddenRows/hiddenRows.js#L368

:::

_hiddenRows.getHiddenRows() ⇒ Array&lt;number&gt;_

Returns an array of visual indexes of hidden rows.



### hideRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/hiddenRows/hiddenRows.js#L359

:::

_hiddenRows.hideRow(...row)_

Hides the row provided as row index (counting from 0).


| Param | Type | Description |
| --- | --- | --- |
| ...row | `number` | Visual row index. |



### hideRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/hiddenRows/hiddenRows.js#L327

:::

_hiddenRows.hideRows(rows)_

Hides the rows provided in the array.


| Param | Type | Description |
| --- | --- | --- |
| rows | `Array<number>` | Array of visual row indexes. |



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/hiddenRows/hiddenRows.js#L220

:::

_hiddenRows.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [HiddenRows#enablePlugin](@/api/hiddenRows.md#enableplugin) method is called.



### isHidden
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/hiddenRows/hiddenRows.js#L380

:::

_hiddenRows.isHidden(row) ⇒ boolean_

Checks if the provided row is hidden.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |



### isValidConfig
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/hiddenRows/hiddenRows.js#L390

:::

_hiddenRows.isValidConfig(hiddenRows) ⇒ boolean_

Checks whether all of the provided row indexes are within the bounds of the table.


| Param | Type | Description |
| --- | --- | --- |
| hiddenRows | `Array` | List of hidden visual row indexes. |



### showRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/hiddenRows/hiddenRows.js#L318

:::

_hiddenRows.showRow(...row)_

Shows the row provided as row index (counting from 0).


| Param | Type | Description |
| --- | --- | --- |
| ...row | `number` | Visual row index. |



### showRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/hiddenRows/hiddenRows.js#L273

:::

_hiddenRows.showRows(rows)_

Shows the rows provided in the array.


| Param | Type | Description |
| --- | --- | --- |
| rows | `Array<number>` | Array of visual row indexes. |



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/hiddenRows/hiddenRows.js#L251

:::

_hiddenRows.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`hiddenRows`](@/api/options.md#hiddenrows)


