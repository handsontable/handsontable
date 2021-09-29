---
title: CollapsibleColumns
metaTitle: CollapsibleColumns - Plugin - Handsontable Documentation
permalink: /10.0/api/collapsible-columns
canonicalUrl: /api/collapsible-columns
hotPlugin: true
editLink: false
---

# CollapsibleColumns

[[toc]]

## Description

The _CollapsibleColumns_ plugin allows collapsing of columns, covered by a header with the `colspan` property defined.

Clicking the "collapse/expand" button collapses (or expands) all "child" headers except the first one.

Setting the [Options#collapsiblecolumns](@/api/options.md#collapsiblecolumns) property to `true` will display a "collapse/expand" button in every header
with a defined `colspan` property.

To limit this functionality to a smaller group of headers, define the `collapsibleColumns` property as an array
of objects, as in the example below.

**Example**  
```js
const container = document.getElementById('example');
const hot = new Handsontable(container, {
  data: generateDataObj(),
  colHeaders: true,
  rowHeaders: true,
  nestedHeaders: true,
  // enable plugin
  collapsibleColumns: true,
});

// or
const hot = new Handsontable(container, {
  data: generateDataObj(),
  colHeaders: true,
  rowHeaders: true,
  nestedHeaders: true,
  // enable and configure which columns can be collapsed
  collapsibleColumns: [
    {row: -4, col: 1, collapsible: true},
    {row: -3, col: 5, collapsible: true}
  ],
});
```

## Options

### collapsibleColumns
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/metaManager/metaSchema.js#L2704

:::

_collapsibleColumns.collapsibleColumns : boolean | Array&lt;object&gt;_

The [CollapsibleColumns](#collapsiblecolumns) plugin allows collapsing of columns, covered by a header with the `colspan` property
defined.

Clicking the "collapse/expand" button collapses (or expands) all "child" headers except the first one.

Setting the `collapsibleColumns` property to `true` will display a "collapse/expand" button in every
header with a defined colspan` property.

To limit this functionality to a smaller group of headers, define the `collapsibleColumns` property
as an array of objects, as in the example below.

**Default**: <code>undefined</code>  
**Example**  
```js
// enable collapsing for all headers
collapsibleColumns: true,

// or
// enable collapsing for selected headers
collapsibleColumns: [
  {row: -4, col: 1, collapsible: true},
  {row: -3, col: 5, collapsible: true}
],
```

## Members

### headerStateManager
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/collapsibleColumns/collapsibleColumns.js#L104

:::

_collapsibleColumns.headerStateManager : [StateManager](@/api/stateManager.md)_

The NestedHeaders plugin StateManager instance.


## Methods

### collapseAll
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/collapsibleColumns/collapsibleColumns.js#L275

:::

_collapsibleColumns.collapseAll()_

Collapses all collapsible sections.



### collapseSection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/collapsibleColumns/collapsibleColumns.js#L250

:::

_collapsibleColumns.collapseSection(coords)_

Collapses section at the provided coords.


| Param | Type | Description |
| --- | --- | --- |
| coords | `object` | Contains coordinates information. (`coords.row`, `coords.col`). |



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/collapsibleColumns/collapsibleColumns.js#L490

:::

_collapsibleColumns.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/collapsibleColumns/collapsibleColumns.js#L180

:::

_collapsibleColumns.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/collapsibleColumns/collapsibleColumns.js#L126

:::

_collapsibleColumns.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### expandAll
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/collapsibleColumns/collapsibleColumns.js#L282

:::

_collapsibleColumns.expandAll()_

Expands all collapsible sections.



### expandSection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/collapsibleColumns/collapsibleColumns.js#L241

:::

_collapsibleColumns.expandSection(coords)_

Expands section at the provided coords.


| Param | Type | Description |
| --- | --- | --- |
| coords | `object` | Contains coordinates information. (`coords.row`, `coords.col`). |



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/collapsibleColumns/collapsibleColumns.js#L119

:::

_collapsibleColumns.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` than the [CollapsibleColumns#enablePlugin](@/api/collapsibleColumns.md#enableplugin) method is called.



### toggleAllCollapsibleSections
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/collapsibleColumns/collapsibleColumns.js#L259

:::

_collapsibleColumns.toggleAllCollapsibleSections(action)_

Collapses or expand all collapsible sections, depending on the action parameter.


| Param | Type | Description |
| --- | --- | --- |
| action | `string` | 'collapse' or 'expand'. |



### toggleCollapsibleSection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/collapsibleColumns/collapsibleColumns.js#L296

:::

_collapsibleColumns.toggleCollapsibleSection(coords, [action])_

Collapses/Expands a section.

**Emits**: [`Hooks#event:beforeColumnCollapse`](@/api/hooks.md#beforecolumncollapse), [`Hooks#event:beforeColumnExpand`](@/api/hooks.md#beforecolumnexpand), [`Hooks#event:afterColumnCollapse`](@/api/hooks.md#aftercolumncollapse), [`Hooks#event:afterColumnExpand`](@/api/hooks.md#aftercolumnexpand)  

| Param | Type | Description |
| --- | --- | --- |
| coords | `Array` | Array of coords - section coordinates. |
| [action] | `string` | `optional` Action definition ('collapse' or 'expand'). |



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/collapsibleColumns/collapsibleColumns.js#L154

:::

_collapsibleColumns.updatePlugin()_

Updates the plugin state. This method is executed when [Core#updateSettings](@/api/core.md#updatesettings) is invoked.


