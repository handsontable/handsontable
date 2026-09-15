---
title: NestedRows
metaTitle: NestedRows - JavaScript Data Grid | Handsontable
permalink: /api/nested-rows
canonicalUrl: /api/nested-rows
searchCategory: API Reference
hotPlugin: false
editLink: false
id: iadurw6z
description: Use the NestedRows plugin with its API options, members and methods to display data in nested structures (where data spans multiple columns).
react:
  id: fvo6cybt
  metaTitle: NestedRows - React Data Grid | Handsontable
angular:
  id: d0w9f7yz
  metaTitle: NestedRows - Angular Data Grid | Handsontable
---

[[toc]]
## Options

### nestedRows

::: ask-about-api nestedRows|NestedRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4484

:::

_nestedRows.nestedRows : boolean_

The `nestedRows` option configures the `NestedRows` plugin.

You can set the `nestedRows` option to one of the following:

| Setting           | Description                                            |
| ----------------- | ------------------------------------------------------ |
| `false` (default) | Disable the `NestedRows` plugin |
| `true`            | Enable the `NestedRows` plugin  |

Read more:
- [Plugins: `NestedRows`](@/guides/rows/row-parent-child/row-parent-child.md)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>false</code>  
**Example**  
```js
// enable the `NestedRows` plugin
nestedRows: true,
```

## Members

### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|NestedRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/nestedRows/nestedRows.ts#L228

:::

_NestedRows.PLUGIN\_KEY_

Returns the plugin key used to identify and access this plugin within Handsontable.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|NestedRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/nestedRows/nestedRows.ts#L233

:::

_NestedRows.PLUGIN\_PRIORITY_

Returns the priority value that determines the plugin's initialization order relative to other plugins.


## Methods

### collapseAll

::: ask-about-api collapseAll|NestedRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/nestedRows/nestedRows.ts#L358

:::

_nestedRows.collapseAll()_

Collapses every top-level parent row, which hides all of their descendants.

A parent that was already collapsed inside another one stays collapsed.

**Emits**: [`Hooks#event:beforeRowCollapse`](@/api/hooks.md#beforerowcollapse), [`Hooks#event:afterRowCollapse`](@/api/hooks.md#afterrowcollapse)  


### collapseParent

::: ask-about-api collapseParent|NestedRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/nestedRows/nestedRows.ts#L383

:::

_nestedRows.collapseParent(row) ⇒ boolean_

Collapses a parent row, which hides its children.

**Emits**: [`Hooks#event:beforeRowCollapse`](@/api/hooks.md#beforerowcollapse), [`Hooks#event:afterRowCollapse`](@/api/hooks.md#afterrowcollapse)  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index of the parent. |


**Returns**: `boolean` - `true` if the collapsed state changed. `false` when the row is not a parent,
when it is already collapsed, or when the [Hooks#beforeRowCollapse](@/api/hooks.md#beforerowcollapse) hook blocked the action.  

### countChildren

::: ask-about-api countChildren|NestedRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/nestedRows/nestedRows.ts#L497

:::

_nestedRows.countChildren(row, [recursive]) ⇒ number_

Counts the children of a row.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| row | `number` |  | Visual row index. |
| [recursive] | `boolean` | <code>false</code> | `optional` `true` counts every descendant, `false` counts only the direct children. |



### destroy

::: ask-about-api destroy|NestedRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/nestedRows/nestedRows.ts#L643

:::

_nestedRows.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|NestedRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/nestedRows/nestedRows.ts#L282

:::

_nestedRows.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|NestedRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/nestedRows/nestedRows.ts#L246

:::

_nestedRows.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### expandAll

::: ask-about-api expandAll|NestedRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/nestedRows/nestedRows.ts#L369

:::

_nestedRows.expandAll()_

Expands every collapsed parent row at every nesting level, so no row stays hidden.

**Emits**: [`Hooks#event:beforeRowExpand`](@/api/hooks.md#beforerowexpand), [`Hooks#event:afterRowExpand`](@/api/hooks.md#afterrowexpand)  


### expandParent

::: ask-about-api expandParent|NestedRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/nestedRows/nestedRows.ts#L394

:::

_nestedRows.expandParent(row) ⇒ boolean_

Expands a parent row, which shows its children again.

**Emits**: [`Hooks#event:beforeRowExpand`](@/api/hooks.md#beforerowexpand), [`Hooks#event:afterRowExpand`](@/api/hooks.md#afterrowexpand)  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index of the parent. |


**Returns**: `boolean` - `true` if the collapsed state changed. `false` when the row is not a parent,
when it is already expanded, or when the [Hooks#beforeRowExpand](@/api/hooks.md#beforerowexpand) hook blocked the action.  

### expandToLevel

::: ask-about-api expandToLevel|NestedRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/nestedRows/nestedRows.ts#L555

:::

_nestedRows.expandToLevel(level)_

Shows rows down to the given nesting level and collapses everything deeper.

Level `0` leaves only the top-level rows visible.

This runs as two steps - an expand and a collapse - so it fires both pairs of hooks. Returning
`false` from [Hooks#beforeRowExpand](@/api/hooks.md#beforerowexpand) cancels the whole call and leaves the grid as it was.
Returning `false` from [Hooks#beforeRowCollapse](@/api/hooks.md#beforerowcollapse) blocks only the collapse step, so the
expand step stays applied.

**Emits**: [`Hooks#event:beforeRowCollapse`](@/api/hooks.md#beforerowcollapse), [`Hooks#event:afterRowCollapse`](@/api/hooks.md#afterrowcollapse), [`Hooks#event:beforeRowExpand`](@/api/hooks.md#beforerowexpand), [`Hooks#event:afterRowExpand`](@/api/hooks.md#afterrowexpand)  

| Param | Type | Description |
| --- | --- | --- |
| level | `number` | The deepest nesting level that stays expanded. |



### expandToRow

::: ask-about-api expandToRow|NestedRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/nestedRows/nestedRows.ts#L518

:::

_nestedRows.expandToRow(row) ⇒ boolean_

Expands every ancestor of a row, so that a row hidden inside collapsed parents becomes visible.

Takes a physical row index, because the row you want to reveal is hidden and therefore has no
visual index.

**Emits**: [`Hooks#event:beforeRowExpand`](@/api/hooks.md#beforerowexpand), [`Hooks#event:afterRowExpand`](@/api/hooks.md#afterrowexpand)  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Physical row index of the row to reveal. |


**Returns**: `boolean` - `true` if anything was expanded.  

### getCollapsedParents

::: ask-about-api getCollapsedParents|NestedRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/nestedRows/nestedRows.ts#L425

:::

_nestedRows.getCollapsedParents() ⇒ Array&lt;number&gt;_

Returns the physical row indexes of every parent row that is collapsed.

The indexes are physical, not visual, because a parent collapsed inside another collapsed parent
is trimmed and therefore has no visual index at all. Physical indexes are also what you want to
store when saving the state. Convert one with [Core#toVisualRow](@/api/core.md#tovisualrow).


**Returns**: `Array<number>` - Physical row indexes, sorted ascending.  

### getRowLevel

::: ask-about-api getRowLevel|NestedRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/nestedRows/nestedRows.ts#L463

:::

_nestedRows.getRowLevel(row) ⇒ number | null_

Returns how deeply a row is nested. Top-level rows are at level `0`.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |


**Returns**: `number` | `null` - The nesting level, or `null` when the row does not exist.  

### getRowParent

::: ask-about-api getRowParent|NestedRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/nestedRows/nestedRows.ts#L477

:::

_nestedRows.getRowParent(row) ⇒ number | null_

Returns the parent of a row.

A visible row always has visible ancestors, so the returned index is visual like the argument.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |


**Returns**: `number` | `null` - Visual row index of the parent, or `null` for a top-level row.  

### isEnabled

::: ask-about-api isEnabled|NestedRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/nestedRows/nestedRows.ts#L241

:::

_nestedRows.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [NestedRows#enablePlugin](@/api/nestedRows.md#enableplugin) method is called.



### isParent

::: ask-about-api isParent|NestedRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/nestedRows/nestedRows.ts#L451

:::

_nestedRows.isParent(row) ⇒ boolean_

Checks whether a row has children.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |



### isParentCollapsed

::: ask-about-api isParentCollapsed|NestedRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/nestedRows/nestedRows.ts#L436

:::

_nestedRows.isParentCollapsed(row) ⇒ boolean_

Checks whether a parent row is collapsed.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index of the parent. |


**Returns**: `boolean` - `true` if the row is a parent and its children are hidden.  

### toggleParent

::: ask-about-api toggleParent|NestedRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/nestedRows/nestedRows.ts#L407

:::

_nestedRows.toggleParent(row) ⇒ boolean_

Collapses an expanded parent row, or expands a collapsed one. This is the same action as clicking
the button in the row header or pressing Enter on it.

**Emits**: [`Hooks#event:beforeRowCollapse`](@/api/hooks.md#beforerowcollapse), [`Hooks#event:afterRowCollapse`](@/api/hooks.md#afterrowcollapse), [`Hooks#event:beforeRowExpand`](@/api/hooks.md#beforerowexpand), [`Hooks#event:afterRowExpand`](@/api/hooks.md#afterrowexpand)  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index of the parent. |


**Returns**: `boolean` - `true` if the collapsed state changed.  

### updatePlugin

::: ask-about-api updatePlugin|NestedRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/nestedRows/nestedRows.ts#L292

:::

_nestedRows.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`nestedRows`](@/api/options.md#nestedrows)


