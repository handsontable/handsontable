---
title: BindRowsWithHeaders
metaTitle: BindRowsWithHeaders - Plugin - Handsontable Documentation
permalink: /12.0/api/bind-rows-with-headers
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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/b12f53bf59ffd1b5d8daad41f560076366c49a0d/handsontable/src/dataMap/metaManager/metaSchema.js#L433

:::

_bindRowsWithHeaders.bindRowsWithHeaders : boolean | string_

The `bindRowsWithHeaders` option configures the [`BindRowsWithHeaders`](@/api/bindRowsWithHeaders.md) plugin.

You can set the `bindRowsWithHeaders` option to one of the following:

| Setting | Description                                                                  |
| ------- | ---------------------------------------------------------------------------- |
| `false` | Disable the the [`BindRowsWithHeaders`](@/api/bindRowsWithHeaders.md) plugin |
| `true`  | Enable the the [`BindRowsWithHeaders`](@/api/bindRowsWithHeaders.md) plugin  |

Read more:
- [Plugins: `BindRowsWithHeaders` &#8594;](@/api/bindRowsWithHeaders.md)

**Default**: <code>undefined</code>  
**Example**  
```js
// enable the `BindRowsWithHeaders` plugin
bindRowsWithHeaders: true
```

## Methods

### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/b12f53bf59ffd1b5d8daad41f560076366c49a0d/handsontable/src/plugins/bindRowsWithHeaders/bindRowsWithHeaders.js#L111

:::

_bindRowsWithHeaders.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/b12f53bf59ffd1b5d8daad41f560076366c49a0d/handsontable/src/plugins/bindRowsWithHeaders/bindRowsWithHeaders.js#L91

:::

_bindRowsWithHeaders.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/b12f53bf59ffd1b5d8daad41f560076366c49a0d/handsontable/src/plugins/bindRowsWithHeaders/bindRowsWithHeaders.js#L68

:::

_bindRowsWithHeaders.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/b12f53bf59ffd1b5d8daad41f560076366c49a0d/handsontable/src/plugins/bindRowsWithHeaders/bindRowsWithHeaders.js#L61

:::

_bindRowsWithHeaders.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` than the [BindRowsWithHeaders#enablePlugin](@/api/bindRowsWithHeaders.md#enableplugin) method is called.


