---
title: CollapsibleColumns
metaTitle: CollapsibleColumns - JavaScript Data Grid | Handsontable
permalink: /api/collapsible-columns
canonicalUrl: /api/collapsible-columns
searchCategory: API Reference
hotPlugin: true
editLink: false
id: edkch5e6
description: Use the CollapsibleColumns plugin with its API options and methods to allow collapsing columns that have colspan defined in their header.
react:
  id: 6f5n1j47
  metaTitle: CollapsibleColumns - React Data Grid | Handsontable
angular:
  id: h4a0j7gh
  metaTitle: CollapsibleColumns - Angular Data Grid | Handsontable
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
::: only-for javascript
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
:::

::: only-for react
```jsx
<HotTable
  data={generateDataObj()}
  colHeaders={true}
  rowHeaders={true}
  nestedHeaders={true}
  // enable plugin
  collapsibleColumns={true}
/>

// or
<HotTable
  data={generateDataObj()}
  colHeaders={true}
  rowHeaders={true}
  nestedHeaders={true}
  // enable and configure which columns can be collapsed
  collapsibleColumns={[
    {row: -4, col: 1, collapsible: true},
    {row: -3, col: 5, collapsible: true}
  ]}
/>
```
:::

::: only-for angular
```ts
// Enable the collapsibleColumns plugin
settings = {
  data: generateDataObj(),
  colHeaders: true,
  rowHeaders: true,
  nestedHeaders: true,
  // enable plugin
  collapsibleColumns: true,
};

// Or enable and configure specific collapsible columns
settings = {
  data: generateDataObj(),
  colHeaders: true,
  rowHeaders: true,
  nestedHeaders: true,
  // enable and configure which columns can be collapsed
  collapsibleColumns: [
    { row: -4, col: 1, collapsible: true },
    { row: -3, col: 5, collapsible: true },
  ],
};
```

```html
<hot-table [settings]="settings"></hot-table>
```
:::

## Options

### collapsibleColumns
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/dataMap/metaManager/metaSchema.js#L769

:::

_collapsibleColumns.collapsibleColumns : boolean | Array&lt;object&gt;_

The `collapsibleColumns` option configures the [`CollapsibleColumns`](@/api/collapsibleColumns.md) plugin.

You can set the `collapsibleColumns` option to one of the following:

| Setting              | Description                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| `false`              | Disable the [`CollapsibleColumns`](@/api/collapsibleColumns.md) plugin                            |
| `true`               | Enable the [`CollapsibleColumns`](@/api/collapsibleColumns.md) plugin                             |
| An array of objects  | Enable the [`CollapsibleColumns`](@/api/collapsibleColumns.md) plugin for selected column headers |

Read more:
- [Plugins: `CollapsibleColumns`](@/api/collapsibleColumns.md)

**Default**: <code>undefined</code>  
**Example**  
```js
// enable column collapsing for all headers
collapsibleColumns: true,

// enable column collapsing for selected headers
collapsibleColumns: [
  {row: -4, col: 1, collapsible: true},
  {row: -3, col: 5, collapsible: true}
],
```

## Methods

### collapseAll
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/plugins/collapsibleColumns/collapsibleColumns.js#L417

:::

_collapsibleColumns.collapseAll()_

Collapses all collapsible sections.



### collapseSection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/plugins/collapsibleColumns/collapsibleColumns.js#L383

:::

_collapsibleColumns.collapseSection(coords)_

Collapses section at the provided coords.


| Param | Type | Description |
| --- | --- | --- |
| coords | `object` | Contains coordinates information. (`coords.row`, `coords.col`). |



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/plugins/collapsibleColumns/collapsibleColumns.js#L659

:::

_collapsibleColumns.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/plugins/collapsibleColumns/collapsibleColumns.js#L262

:::

_collapsibleColumns.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/plugins/collapsibleColumns/collapsibleColumns.js#L198

:::

_collapsibleColumns.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### expandAll
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/plugins/collapsibleColumns/collapsibleColumns.js#L424

:::

_collapsibleColumns.expandAll()_

Expands all collapsible sections.



### expandSection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/plugins/collapsibleColumns/collapsibleColumns.js#L374

:::

_collapsibleColumns.expandSection(coords)_

Expands section at the provided coords.


| Param | Type | Description |
| --- | --- | --- |
| coords | `object` | Contains coordinates information. (`coords.row`, `coords.col`). |



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/plugins/collapsibleColumns/collapsibleColumns.js#L191

:::

_collapsibleColumns.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [CollapsibleColumns#enablePlugin](@/api/collapsibleColumns.md#enableplugin) method is called.



### toggleAllCollapsibleSections
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/plugins/collapsibleColumns/collapsibleColumns.js#L392

:::

_collapsibleColumns.toggleAllCollapsibleSections(action)_

Collapses or expand all collapsible sections, depending on the action parameter.


| Param | Type | Description |
| --- | --- | --- |
| action | `string` | 'collapse' or 'expand'. |



### toggleCollapsibleSection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/plugins/collapsibleColumns/collapsibleColumns.js#L438

:::

_collapsibleColumns.toggleCollapsibleSection(coords, [action])_

Collapses/Expands a section.

**Emits**: [`Hooks#event:beforeColumnCollapse`](@/api/hooks.md#beforecolumncollapse), [`Hooks#event:beforeColumnExpand`](@/api/hooks.md#beforecolumnexpand), [`Hooks#event:afterColumnCollapse`](@/api/hooks.md#aftercolumncollapse), [`Hooks#event:afterColumnExpand`](@/api/hooks.md#aftercolumnexpand)  

| Param | Type | Description |
| --- | --- | --- |
| coords | `Array` | Array of coords - section coordinates. |
| [action] | `string` | `optional` Action definition ('collapse' or 'expand'). |



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/plugins/collapsibleColumns/collapsibleColumns.js#L231

:::

_collapsibleColumns.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
  - [`collapsibleColumns`](@/api/options.md#collapsiblecolumns)
  - [`nestedHeaders`](@/api/options.md#nestedheaders)


