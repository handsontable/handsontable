---
title: CollapsibleColumns
permalink: /next/api/collapsible-columns
canonicalUrl: /api/collapsible-columns
editLink: false
---

# CollapsibleColumns

[[toc]]

## Description

The [CollapsibleColumns](#CollapsibleColumns) plugin allows collapsing of columns, covered by a header with the `colspan` property defined.

Clicking the "collapse/expand" button collapses (or expands) all "child" headers except the first one.

Setting the [Options#collapsibleColumns](./Options/#collapsibleColumns) property to `true` will display a "collapse/expand" button in every header
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

## Members

### headerStateManager
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/collapsibleColumns/collapsibleColumns.js#L104

:::

`collapsibleColumns.headerStateManager : StateManager`

The NestedHeaders plugin StateManager instance.


## Methods

### collapseAll
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/collapsibleColumns/collapsibleColumns.js#L277

:::

`collapsibleColumns.collapseAll()`

Collapses all collapsible sections.



### collapseSection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/collapsibleColumns/collapsibleColumns.js#L252

:::

`collapsibleColumns.collapseSection(coords)`

Collapses section at the provided coords.


| Param | Type | Description |
| --- | --- | --- |
| coords | `object` | Contains coordinates information. (`coords.row`, `coords.col`). |



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/collapsibleColumns/collapsibleColumns.js#L492

:::

`collapsibleColumns.destroy()`

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/collapsibleColumns/collapsibleColumns.js#L182

:::

`collapsibleColumns.disablePlugin()`

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/collapsibleColumns/collapsibleColumns.js#L126

:::

`collapsibleColumns.enablePlugin()`

Enables the plugin functionality for this Handsontable instance.



### expandAll
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/collapsibleColumns/collapsibleColumns.js#L284

:::

`collapsibleColumns.expandAll()`

Expands all collapsible sections.



### expandSection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/collapsibleColumns/collapsibleColumns.js#L243

:::

`collapsibleColumns.expandSection(coords)`

Expands section at the provided coords.


| Param | Type | Description |
| --- | --- | --- |
| coords | `object` | Contains coordinates information. (`coords.row`, `coords.col`). |



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/collapsibleColumns/collapsibleColumns.js#L119

:::

`collapsibleColumns.isEnabled() ⇒ boolean`

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](./Hooks/#beforeInit)
hook and if it returns `true` than the [enablePlugin](#CollapsibleColumns+enablePlugin) method is called.



### toggleAllCollapsibleSections
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/collapsibleColumns/collapsibleColumns.js#L261

:::

`collapsibleColumns.toggleAllCollapsibleSections(action)`

Collapses or expand all collapsible sections, depending on the action parameter.


| Param | Type | Description |
| --- | --- | --- |
| action | `string` | 'collapse' or 'expand'. |



### toggleCollapsibleSection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/collapsibleColumns/collapsibleColumns.js#L298

:::

`collapsibleColumns.toggleCollapsibleSection(coords, [action])`

Collapses/Expands a section.

**Emits**: [`Hooks#event:beforeColumnCollapse`](./hooks/#beforeColumnCollapse), [`Hooks#event:beforeColumnExpand`](./hooks/#beforeColumnExpand), [`Hooks#event:afterColumnCollapse`](./hooks/#afterColumnCollapse), [`Hooks#event:afterColumnExpand`](./hooks/#afterColumnExpand)  

| Param | Type | Description |
| --- | --- | --- |
| coords | `Array` | Array of coords - section coordinates. |
| [action] | `string` | `optional` Action definition ('collapse' or 'expand'). |



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/collapsibleColumns/collapsibleColumns.js#L156

:::

`collapsibleColumns.updatePlugin()`

Updates the plugin state. This method is executed when [Core#updateSettings](./Core/#updateSettings) is invoked.


