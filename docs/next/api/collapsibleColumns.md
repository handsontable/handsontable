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


_collapsibleColumns.headerStateManager : StateManager_

The NestedHeaders plugin StateManager instance.


## Methods

### collapseAll
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/collapsibleColumns/collapsibleColumns.js#L277


_collapsibleColumns.collapseAll()_

Collapses all collapsible sections.



### collapseSection
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/collapsibleColumns/collapsibleColumns.js#L252


_collapsibleColumns.collapseSection(coords)_

Collapses section at the provided coords.


| Param | Type | Description |
| --- | --- | --- |
| coords | `objectN` | Contains coordinates information. (`coords.row`, `coords.col`). |



### destroy
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/collapsibleColumns/collapsibleColumns.js#L492


_collapsibleColumns.destroy()_

Destroys the plugin instance.



### disablePlugin
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/collapsibleColumns/collapsibleColumns.js#L182


_collapsibleColumns.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/collapsibleColumns/collapsibleColumns.js#L126


_collapsibleColumns.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### expandAll
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/collapsibleColumns/collapsibleColumns.js#L284


_collapsibleColumns.expandAll()_

Expands all collapsible sections.



### expandSection
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/collapsibleColumns/collapsibleColumns.js#L243


_collapsibleColumns.expandSection(coords)_

Expands section at the provided coords.


| Param | Type | Description |
| --- | --- | --- |
| coords | `objectN` | Contains coordinates information. (`coords.row`, `coords.col`). |



### isEnabled
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/collapsibleColumns/collapsibleColumns.js#L119


_collapsibleColumns.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](./Hooks/#beforeInit)
hook and if it returns `true` than the [enablePlugin](#CollapsibleColumns+enablePlugin) method is called.



### toggleAllCollapsibleSections
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/collapsibleColumns/collapsibleColumns.js#L261


_collapsibleColumns.toggleAllCollapsibleSections(action)_

Collapses or expand all collapsible sections, depending on the action parameter.


| Param | Type | Description |
| --- | --- | --- |
| action | `stringN` | 'collapse' or 'expand'. |



### toggleCollapsibleSection
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/collapsibleColumns/collapsibleColumns.js#L298


_collapsibleColumns.toggleCollapsibleSection(coords, [action])_

Collapses/Expands a section.

**Emits**: <code>Hooks#event:beforeColumnCollapse</code>, <code>Hooks#event:beforeColumnExpand</code>, <code>Hooks#event:afterColumnCollapse</code>, <code>Hooks#event:afterColumnExpand</code>  

| Param | Type | Description |
| --- | --- | --- |
| coords | `ArrayN` | Array of coords - section coordinates. |
| [action] | `stringN` | `optional` Action definition ('collapse' or 'expand'). |



### updatePlugin
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/collapsibleColumns/collapsibleColumns.js#L156


_collapsibleColumns.updatePlugin()_

Updates the plugin state. This method is executed when [Core#updateSettings](./Core/#updateSettings) is invoked.


