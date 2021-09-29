---
title: NestedHeaders
metaTitle: NestedHeaders - Plugin - Handsontable Documentation
permalink: /10.0/api/nested-headers
canonicalUrl: /api/nested-headers
hotPlugin: true
editLink: false
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

## Options

### nestedHeaders
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/metaManager/metaSchema.js#L2921

:::

_nestedHeaders.nestedHeaders : Array&lt;Array&gt;_

Allows creating a nested header structure, using the HTML's colspan attribute.

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/nestedHeaders/nestedHeaders.js#L90

:::

_nestedHeaders.detectedOverlappedHeaders : boolean_

The flag which determines that the nested header settings contains overlapping headers
configuration.


## Methods

### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/nestedHeaders/nestedHeaders.js#L594

:::

_nestedHeaders.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/nestedHeaders/nestedHeaders.js#L189

:::

_nestedHeaders.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/nestedHeaders/nestedHeaders.js#L104

:::

_nestedHeaders.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/nestedHeaders/nestedHeaders.js#L97

:::

_nestedHeaders.isEnabled() ⇒ boolean_

Check if plugin is enabled.



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/nestedHeaders/nestedHeaders.js#L136

:::

_nestedHeaders.updatePlugin()_

Updates the plugin state. This method is executed when [Core#updateSettings](@/api/core.md#updatesettings) is invoked.


