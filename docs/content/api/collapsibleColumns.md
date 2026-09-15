---
title: CollapsibleColumns
metaTitle: CollapsibleColumns - JavaScript Data Grid | Handsontable
permalink: /api/collapsible-columns
canonicalUrl: /api/collapsible-columns
searchCategory: API Reference
hotPlugin: false
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

[[toc]]
## Options

### collapsibleColumns

::: ask-about-api collapsibleColumns|CollapsibleColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L846

:::

_collapsibleColumns.collapsibleColumns : boolean | Array&lt;object&gt;_

The `collapsibleColumns` option configures the `CollapsibleColumns` plugin.

You can set the `collapsibleColumns` option to one of the following:

| Setting              | Description                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| `false`              | Disable the `CollapsibleColumns` plugin                            |
| `true`               | Enable the `CollapsibleColumns` plugin                             |
| An array of objects  | Enable the `CollapsibleColumns` plugin for selected column headers |

When using an array of objects, specify the header to make collapsible using `row` and `col`.
The `row` value is a negative integer that counts header levels from the bottom of the header area:
`-1` is the header row closest to the data, `-2` is one level above, and so on.
This option requires the [`nestedHeaders`](@/api/options.md#nestedheaders) plugin to be configured.

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

Read more:
- [Column groups: Collapsible headers](@/guides/columns/column-groups/column-groups.md#collapsible-headers)
- [`nestedHeaders`](@/api/options.md#nestedheaders)

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

## Members

### PLUGIN_DEPS

::: ask-about-api PLUGIN_DEPS|CollapsibleColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/collapsibleColumns/collapsibleColumns.ts#L201

:::

_CollapsibleColumns.PLUGIN\_DEPS_

Returns the list of plugin dependencies required before this plugin can be initialized.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|CollapsibleColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/collapsibleColumns/collapsibleColumns.ts#L191

:::

_CollapsibleColumns.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|CollapsibleColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/collapsibleColumns/collapsibleColumns.ts#L196

:::

_CollapsibleColumns.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SETTING_KEYS

::: ask-about-api SETTING_KEYS|CollapsibleColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/collapsibleColumns/collapsibleColumns.ts#L208

:::

_CollapsibleColumns.SETTING\_KEYS_

Returns the setting keys that trigger a plugin update when changed via `updateSettings`.


## Methods

### collapseAll

::: ask-about-api collapseAll|CollapsibleColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/collapsibleColumns/collapsibleColumns.ts#L437

:::

_collapsibleColumns.collapseAll()_

Collapses all collapsible sections.



### collapseSection

::: ask-about-api collapseSection|CollapsibleColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/collapsibleColumns/collapsibleColumns.ts#L414

:::

_collapsibleColumns.collapseSection(coords)_

Collapses section at the provided coords. `coords.col` may be any column the group's header spans,
not only its first (anchor) column - it resolves to the owning collapsible group.


| Param | Type | Description |
| --- | --- | --- |
| coords | `object` | Contains coordinates information. (`coords.row`, `coords.col`). |



### destroy

::: ask-about-api destroy|CollapsibleColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/collapsibleColumns/collapsibleColumns.ts#L558

:::

_collapsibleColumns.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|CollapsibleColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/collapsibleColumns/collapsibleColumns.ts#L292

:::

_collapsibleColumns.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|CollapsibleColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/collapsibleColumns/collapsibleColumns.ts#L224

:::

_collapsibleColumns.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### expandAll

::: ask-about-api expandAll|CollapsibleColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/collapsibleColumns/collapsibleColumns.ts#L442

:::

_collapsibleColumns.expandAll()_

Expands all collapsible sections.



### expandSection

::: ask-about-api expandSection|CollapsibleColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/collapsibleColumns/collapsibleColumns.ts#L404

:::

_collapsibleColumns.expandSection(coords)_

Expands section at the provided coords. `coords.col` may be any column the group's header spans,
not only its first (anchor) column - it resolves to the owning collapsible group.


| Param | Type | Description |
| --- | --- | --- |
| coords | `object` | Contains coordinates information. (`coords.row`, `coords.col`). |



### isEnabled

::: ask-about-api isEnabled|CollapsibleColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/collapsibleColumns/collapsibleColumns.ts#L219

:::

_collapsibleColumns.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [CollapsibleColumns#enablePlugin](@/api/collapsibleColumns.md#enableplugin) method is called.



### toggleAllCollapsibleSections

::: ask-about-api toggleAllCollapsibleSections|CollapsibleColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/collapsibleColumns/collapsibleColumns.ts#L423

:::

_collapsibleColumns.toggleAllCollapsibleSections(action)_

Collapses or expand all collapsible sections, depending on the action parameter.


| Param | Type | Description |
| --- | --- | --- |
| action | `string` | 'collapse' or 'expand'. |



### toggleCollapsibleSection

::: ask-about-api toggleCollapsibleSection|CollapsibleColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/collapsibleColumns/collapsibleColumns.ts#L454

:::

_collapsibleColumns.toggleCollapsibleSection(coords, [action])_

Collapses/Expands a section.

**Emits**: [`Hooks#event:beforeColumnCollapse`](@/api/hooks.md#beforecolumncollapse), [`Hooks#event:beforeColumnExpand`](@/api/hooks.md#beforecolumnexpand), [`Hooks#event:afterColumnCollapse`](@/api/hooks.md#aftercolumncollapse), [`Hooks#event:afterColumnExpand`](@/api/hooks.md#aftercolumnexpand)  

| Param | Type | Description |
| --- | --- | --- |
| coords | `Array` | Array of coords - section coordinates. |
| [action] | `string` | `optional` Action definition ('collapse' or 'expand'). |



### updatePlugin

::: ask-about-api updatePlugin|CollapsibleColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/collapsibleColumns/collapsibleColumns.ts#L262

:::

_collapsibleColumns.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
  - [`collapsibleColumns`](@/api/options.md#collapsiblecolumns)
  - [`nestedHeaders`](@/api/options.md#nestedheaders)


