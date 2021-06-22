---
title: BindRowsWithHeaders
metaTitle: BindRowsWithHeaders - Plugin - Handsontable Documentation
permalink: /next/api/bind-rows-with-headers
canonicalUrl: /api/bind-rows-with-headers
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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/cc0c2380ac56edcef53c26bf9dc35eadf81459f8/src/dataMap/metaManager/metaSchema.js#L2631

:::

_bindRowsWithHeaders.bindRowsWithHeaders : boolean | string_

Enables the functionality of the [BindRowsWithHeaders](./bind-rows-with-headers/) plugin which allows binding the table rows with their headers.
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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/cc0c2380ac56edcef53c26bf9dc35eadf81459f8/src/plugins/bindRowsWithHeaders/bindRowsWithHeaders.js#L111

:::

_bindRowsWithHeaders.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/cc0c2380ac56edcef53c26bf9dc35eadf81459f8/src/plugins/bindRowsWithHeaders/bindRowsWithHeaders.js#L91

:::

_bindRowsWithHeaders.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/cc0c2380ac56edcef53c26bf9dc35eadf81459f8/src/plugins/bindRowsWithHeaders/bindRowsWithHeaders.js#L68

:::

_bindRowsWithHeaders.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/cc0c2380ac56edcef53c26bf9dc35eadf81459f8/src/plugins/bindRowsWithHeaders/bindRowsWithHeaders.js#L61

:::

_bindRowsWithHeaders.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](./Hooks/#beforeInit)
hook and if it returns `true` than the [enablePlugin](#BindRowsWithHeaders+enablePlugin) method is called.


