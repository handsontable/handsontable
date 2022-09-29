---
title: NestedHeaders
metaTitle: NestedHeaders - JavaScript Data Grid | Handsontable
permalink: /api/nested-headers
canonicalUrl: /api/nested-headers
searchCategory: API Reference
hotPlugin: true
editLink: false
description: Use the NestedHeaders plugin with its API options and methods to group your columns, using multiple levels of nested column headers.
react:
  metaTitle: NestedHeaders - React Data Grid | Handsontable
---

# NestedHeaders

[[toc]]

## Description

The plugin allows to create a nested header structure, using the HTML's colspan attribute.

To make any header wider (covering multiple table columns), it's corresponding configuration array element should be
provided as an object with `label` and `colspan` properties. The `label` property defines the header's label,
while the `colspan` property defines a number of columns that the header should cover.

__Note__ that the plugin supports a *nested* structure, which means, any header cannot be wider than it's "parent". In
other words, headers cannot overlap each other.

**Example**  
::: only-for javascript
```js
const container = document.getElementById('example');
const hot = new Handsontable(container, {
  data: getData(),
  nestedHeaders: [
    ['A', {label: 'B', colspan: 8}, 'C'],
    ['D', {label: 'E', colspan: 4}, {label: 'F', colspan: 4}, 'G'],
    ['H', {label: 'I', colspan: 2}, {label: 'J', colspan: 2}, {label: 'K', colspan: 2}, {label: 'L', colspan: 2}, 'M'],
    ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
 ],
```
:::

::: only-for react
```jsx
<HotTable
  data={getData()}
  nestedHeaders={[
    ['A', {label: 'B', colspan: 8}, 'C'],
    ['D', {label: 'E', colspan: 4}, {label: 'F', colspan: 4}, 'G'],
    ['H', {label: 'I', colspan: 2}, {label: 'J', colspan: 2}, {label: 'K', colspan: 2}, {label: 'L', colspan: 2}, 'M'],
    ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
 ]}
/>
```
:::

## Options

### nestedHeaders
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/dataMap/metaManager/metaSchema.js#L3153

:::

_nestedHeaders.nestedHeaders : boolean | Array&lt;Array&gt;_

The `nestedHeaders` option configures the [`NestedHeaders`](@/api/nestedHeaders.md) plugin.

You can set the `nestedHeaders` option to one of the following:

| Setting           | Description                                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `false` (default) | Disable the [`NestedHeaders`](@/api/nestedHeaders.md) plugin                                                                          |
| `true`            | - Enable the [`NestedHeaders`](@/api/nestedHeaders.md) plugin<br>- Don't configure any nested headers                                 |
| Array of arrays   | - Enable the [`NestedHeaders`](@/api/nestedHeaders.md) plugin<br>- Configure headers that are nested on Handsontable's initialization |

If you set the `nestedHeaders` option to an array of arrays, each array configures one set of nested headers.

Each array element configures one header, and can be one of the following:

| Array element | Description                                                                                  |
| ------------- | -------------------------------------------------------------------------------------------- |
| A string      | The header's label                                                                           |
| An object     | Properties:<br>`label` (string): the header's label<br>`colspan` (integer): the column width |

Read more:
- [Plugins: `NestedHeaders`](@/api/nestedHeaders.md)
- [Column groups: Nested headers](@/guides/columns/column-groups.md#nested-headers)

**Default**: <code>undefined</code>  
**Example**  
```js
nestedHeaders: [
  ['A', {label: 'B', colspan: 8}, 'C'],
  ['D', {label: 'E', colspan: 4}, {label: 'F', colspan: 4}, 'G'],
  ['H', 'I', 'J', 'K', 'L', 'M', 'N', 'R', 'S', 'T']
],
```

## Members

### detectedOverlappedHeaders
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/nestedHeaders/nestedHeaders.js#L108

:::

_nestedHeaders.detectedOverlappedHeaders : boolean_

The flag which determines that the nested header settings contains overlapping headers
configuration.


## Methods

### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/nestedHeaders/nestedHeaders.js#L621

:::

_nestedHeaders.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/nestedHeaders/nestedHeaders.js#L215

:::

_nestedHeaders.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/nestedHeaders/nestedHeaders.js#L122

:::

_nestedHeaders.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/nestedHeaders/nestedHeaders.js#L115

:::

_nestedHeaders.isEnabled() ⇒ boolean_

Check if plugin is enabled.



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/nestedHeaders/nestedHeaders.js#L157

:::

_nestedHeaders.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`nestedHeaders`](@/api/options.md#nestedheaders)


