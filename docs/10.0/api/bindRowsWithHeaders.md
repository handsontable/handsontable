---
title: BindRowsWithHeaders
metaTitle: BindRowsWithHeaders - Plugin - Handsontable Documentation
permalink: /10.0/api/bind-rows-with-headers
canonicalUrl: /api/bind-rows-with-headers
hotPlugin: true
editLink: false
---

# BindRowsWithHeaders

[[toc]]

## Description

Plugin allows binding the table rows with their headers.

If the plugin is enabled, the table row headers will "stick" to the rows, when they are hidden/moved. Basically, if
at the initialization row 0 has a header titled "A", it will have it no matter what you do with the table.

**Example**  
```js
const container = document.getElementById('example');
const hot = new Handsontable(container, {
  data: getData(),
  // enable plugin
  bindRowsWithHeaders: true
});
```

## Options

### bindRowsWithHeaders
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/metaManager/metaSchema.js#L2671

:::

_bindRowsWithHeaders.bindRowsWithHeaders : boolean | string_

Enables the functionality of the [BindRowsWithHeaders](#bindrowswithheaders) plugin which allows binding the table rows with their headers.
If the plugin is enabled, the table row headers will "stick" to the rows, when they are hidden/moved. Basically,
if at the initialization row 0 has a header titled "A", it will have it no matter what you do with the table.

**Default**: <code>undefined</code>  
**Example**  
```js
// keep row data and row headers in sync
bindRowsWithHeaders: true
```

## Methods

### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/bindRowsWithHeaders/bindRowsWithHeaders.js#L111

:::

_bindRowsWithHeaders.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/bindRowsWithHeaders/bindRowsWithHeaders.js#L91

:::

_bindRowsWithHeaders.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/bindRowsWithHeaders/bindRowsWithHeaders.js#L68

:::

_bindRowsWithHeaders.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/bindRowsWithHeaders/bindRowsWithHeaders.js#L61

:::

_bindRowsWithHeaders.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` than the [BindRowsWithHeaders#enablePlugin](@/api/bindRowsWithHeaders.md#enableplugin) method is called.


