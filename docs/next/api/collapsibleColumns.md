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

## Members:

### headerStateManager

_collapsibleColumns.headerStateManager : StateManager_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/collapsibleColumns/collapsibleColumns.js#L104)

The NestedHeaders plugin StateManager instance.


## Methods:

### collapseAll

_collapsibleColumns.collapseAll()_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/collapsibleColumns/collapsibleColumns.js#L277)

Collapses all collapsible sections.



### collapseSection

_collapsibleColumns.collapseSection(coords)_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/collapsibleColumns/collapsibleColumns.js#L252)

Collapses section at the provided coords.


| Param | Type | Description |
| --- | --- | --- |
| coords | `object` | Contains coordinates information. (`coords.row`, `coords.col`). |



### destroy

_collapsibleColumns.destroy()_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/collapsibleColumns/collapsibleColumns.js#L492)

Destroys the plugin instance.



### disablePlugin

_collapsibleColumns.disablePlugin()_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/collapsibleColumns/collapsibleColumns.js#L182)

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

_collapsibleColumns.enablePlugin()_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/collapsibleColumns/collapsibleColumns.js#L126)

Enables the plugin functionality for this Handsontable instance.



### expandAll

_collapsibleColumns.expandAll()_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/collapsibleColumns/collapsibleColumns.js#L284)

Expands all collapsible sections.



### expandSection

_collapsibleColumns.expandSection(coords)_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/collapsibleColumns/collapsibleColumns.js#L243)

Expands section at the provided coords.


| Param | Type | Description |
| --- | --- | --- |
| coords | `object` | Contains coordinates information. (`coords.row`, `coords.col`). |



### isEnabled

_collapsibleColumns.isEnabled() ⇒ boolean_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/collapsibleColumns/collapsibleColumns.js#L119)

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](./Hooks/#beforeInit)
hook and if it returns `true` than the [enablePlugin](#CollapsibleColumns+enablePlugin) method is called.



### toggleAllCollapsibleSections

_collapsibleColumns.toggleAllCollapsibleSections(action)_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/collapsibleColumns/collapsibleColumns.js#L261)

Collapses or expand all collapsible sections, depending on the action parameter.


| Param | Type | Description |
| --- | --- | --- |
| action | `string` | 'collapse' or 'expand'. |



### toggleCollapsibleSection

_collapsibleColumns.toggleCollapsibleSection(coords, [action])_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/collapsibleColumns/collapsibleColumns.js#L298)

Collapses/Expands a section.

**Emits**: <code>Hooks#event:beforeColumnCollapse</code>, <code>Hooks#event:beforeColumnExpand</code>, <code>Hooks#event:afterColumnCollapse</code>, <code>Hooks#event:afterColumnExpand</code>  

| Param | Type | Description |
| --- | --- | --- |
| coords | `Array` | Array of coords - section coordinates. |
| [action] | `string` | `optional` Action definition ('collapse' or 'expand'). |



### updatePlugin

_collapsibleColumns.updatePlugin()_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/collapsibleColumns/collapsibleColumns.js#L156)

Updates the plugin state. This method is executed when [Core#updateSettings](./Core/#updateSettings) is invoked.


