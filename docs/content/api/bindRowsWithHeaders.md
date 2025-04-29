---
title: BindRowsWithHeaders
metaTitle: BindRowsWithHeaders - JavaScript Data Grid | Handsontable
permalink: /api/bind-rows-with-headers
canonicalUrl: /api/bind-rows-with-headers
searchCategory: API Reference
hotPlugin: true
editLink: false
id: dxv2vk3l
description: Use the BindRowsWithHeaders plugin with its API options and methods to allow binding table rows to their headers.
react:
  id: 2mdpwy50
  metaTitle: BindRowsWithHeaders - React Data Grid | Handsontable
---

# BindRowsWithHeaders

[[toc]]

## Description

Plugin allows binding the table rows with their headers.

If the plugin is enabled, the table row headers will "stick" to the rows, when they are hidden/moved. Basically, if
at the initialization row 0 has a header titled "A", it will have it no matter what you do with the table.

**Example**  
::: only-for javascript
```js
const container = document.getElementById('example');
const hot = new Handsontable(container, {
  data: getData(),
  // enable plugin
  bindRowsWithHeaders: true
});
```
:::

::: only-for react
```jsx
<HotTable
  data={getData()}
  // enable plugin
  bindRowsWithHeaders={true}
/>
```
:::

## Options

### bindRowsWithHeaders
  
::: source-code-link https://github.com/handsontable/handsontable/blob/0a86920b402089cbe2ec202bfb25fed11ce94644/handsontable/src/dataMap/metaManager/metaSchema.js#L508

:::

_bindRowsWithHeaders.bindRowsWithHeaders : boolean | string_

The `bindRowsWithHeaders` option configures the [`BindRowsWithHeaders`](@/api/bindRowsWithHeaders.md) plugin.

You can set the `bindRowsWithHeaders` option to one of the following:

| Setting | Description                                                                  |
| ------- | ---------------------------------------------------------------------------- |
| `false` | Disable the the [`BindRowsWithHeaders`](@/api/bindRowsWithHeaders.md) plugin |
| `true`  | Enable the the [`BindRowsWithHeaders`](@/api/bindRowsWithHeaders.md) plugin  |

Read more:
- [Plugins: `BindRowsWithHeaders`](@/api/bindRowsWithHeaders.md)

**Default**: <code>undefined</code>  
**Example**  
```js
// enable the `BindRowsWithHeaders` plugin
bindRowsWithHeaders: true
```

## Methods

### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/0a86920b402089cbe2ec202bfb25fed11ce94644/handsontable/src/plugins/bindRowsWithHeaders/bindRowsWithHeaders.js#L113

:::

_bindRowsWithHeaders.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/0a86920b402089cbe2ec202bfb25fed11ce94644/handsontable/src/plugins/bindRowsWithHeaders/bindRowsWithHeaders.js#L94

:::

_bindRowsWithHeaders.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/0a86920b402089cbe2ec202bfb25fed11ce94644/handsontable/src/plugins/bindRowsWithHeaders/bindRowsWithHeaders.js#L77

:::

_bindRowsWithHeaders.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/0a86920b402089cbe2ec202bfb25fed11ce94644/handsontable/src/plugins/bindRowsWithHeaders/bindRowsWithHeaders.js#L70

:::

_bindRowsWithHeaders.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [BindRowsWithHeaders#enablePlugin](@/api/bindRowsWithHeaders.md#enableplugin) method is called.


