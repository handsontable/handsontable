---
title: CollapsibleColumns
permalink: /next/api/collapsible-columns
canonicalUrl: /api/collapsible-columns
---

# {{ $frontmatter.title }}

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
`collapsibleColumns.headerStateManager : StateManager`

The NestedHeaders plugin StateManager instance.



### isEnabled
`collapsibleColumns.isEnabled() ⇒ boolean`

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](./Hooks/#beforeInit)
hook and if it returns `true` than the [enablePlugin](#CollapsibleColumns+enablePlugin) method is called.



### enablePlugin
`collapsibleColumns.enablePlugin()`

Enables the plugin functionality for this Handsontable instance.



### updatePlugin
`collapsibleColumns.updatePlugin()`

Updates the plugin state. This method is executed when [Core#updateSettings](./Core/#updateSettings) is invoked.



### disablePlugin
`collapsibleColumns.disablePlugin()`

Disables the plugin functionality for this Handsontable instance.



### expandSection
`collapsibleColumns.expandSection(coords)`

Expands section at the provided coords.


| Param | Type | Description |
| --- | --- | --- |
| coords | <code>object</code> | Contains coordinates information. (`coords.row`, `coords.col`). |



### collapseSection
`collapsibleColumns.collapseSection(coords)`

Collapses section at the provided coords.


| Param | Type | Description |
| --- | --- | --- |
| coords | <code>object</code> | Contains coordinates information. (`coords.row`, `coords.col`). |



### toggleAllCollapsibleSections
`collapsibleColumns.toggleAllCollapsibleSections(action)`

Collapses or expand all collapsible sections, depending on the action parameter.


| Param | Type | Description |
| --- | --- | --- |
| action | <code>string</code> | 'collapse' or 'expand'. |



### collapseAll
`collapsibleColumns.collapseAll()`

Collapses all collapsible sections.



### expandAll
`collapsibleColumns.expandAll()`

Expands all collapsible sections.



### toggleCollapsibleSection
`collapsibleColumns.toggleCollapsibleSection(coords, [action])`

Collapses/Expands a section.

**Emits**: <code>Hooks#event:beforeColumnCollapse</code>, <code>Hooks#event:beforeColumnExpand</code>, <code>Hooks#event:afterColumnCollapse</code>, <code>Hooks#event:afterColumnExpand</code>  

| Param | Type | Description |
| --- | --- | --- |
| coords | <code>Array</code> | Array of coords - section coordinates. |
| [action] | <code>string</code> | `optional` Action definition ('collapse' or 'expand'). |



### destroy
`collapsibleColumns.destroy()`

Destroys the plugin instance.



