---
title: StretchColumns
metaTitle: StretchColumns - JavaScript Data Grid | Handsontable
permalink: /api/stretch-columns
canonicalUrl: /api/stretch-columns
searchCategory: API Reference
hotPlugin: true
editLink: false
id: 9a2z1j1i
description: Use the StretchColumns plugin with its API options and methods to stretch the columns.
react:
  id: a2b7ku2p
  metaTitle: StretchColumns - React Data Grid | Handsontable
---

# StretchColumns

[[toc]]

## Description

This plugin allows to set column widths based on their widest cells.

By default, the plugin is declared as `'none'`, which makes it disabled (same as if it was declared as `false`).

The plugin determines what happens when the declared grid width is different from the calculated sum of all column widths.

```js
// fit the grid to the container, by stretching only the last column
stretchH: 'last',

// fit the grid to the container, by stretching all columns evenly
stretchH: 'all',
```

To configure this plugin see [Options#stretchH](@/api/options.md#stretchh).

**Example**  
::: only-for javascript
```js
const hot = new Handsontable(document.getElementById('example'), {
  data: getData(),
  stretchH: 'all',
});
```
:::

::: only-for react
```jsx
const hotRef = useRef(null);

...

// First, let's construct Handsontable
<HotTable
  ref={hotRef}
  data={getData()}
  stretchH={'all'}
/>
```
:::

## Methods

### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e910d1b80af460f098c184c630a1c4108d0d00b3/handsontable/src/plugins/stretchColumns/stretchColumns.js#L196

:::

_stretchColumns.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e910d1b80af460f098c184c630a1c4108d0d00b3/handsontable/src/plugins/stretchColumns/stretchColumns.js#L143

:::

_stretchColumns.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e910d1b80af460f098c184c630a1c4108d0d00b3/handsontable/src/plugins/stretchColumns/stretchColumns.js#L118

:::

_stretchColumns.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getColumnWidth
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e910d1b80af460f098c184c630a1c4108d0d00b3/handsontable/src/plugins/stretchColumns/stretchColumns.js#L155

:::

_stretchColumns.getColumnWidth(columnVisualIndex) ⇒ number | null_

Gets the calculated column width based on the stretching
strategy defined by [Options#stretchH](@/api/options.md#stretchh) option.


| Param | Type | Description |
| --- | --- | --- |
| columnVisualIndex | `number` | The visual index of the column. |



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e910d1b80af460f098c184c630a1c4108d0d00b3/handsontable/src/plugins/stretchColumns/stretchColumns.js#L111

:::

_stretchColumns.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [#enablePlugin](#enableplugin) method is called.



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e910d1b80af460f098c184c630a1c4108d0d00b3/handsontable/src/plugins/stretchColumns/stretchColumns.js#L135

:::

_stretchColumns.updatePlugin()_

Updates the plugin's state. This method is executed when [Core#updateSettings](@/api/core.md#updatesettings) is invoked.


