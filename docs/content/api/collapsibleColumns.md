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
## Members

### PLUGIN_DEPS

::: ask-about-api PLUGIN_DEPS|CollapsibleColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/collapsibleColumns/collapsibleColumns.ts#L173

:::

_CollapsibleColumns.PLUGIN\_DEPS_

Returns the list of plugin dependencies required before this plugin can be initialized.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|CollapsibleColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/collapsibleColumns/collapsibleColumns.ts#L163

:::

_CollapsibleColumns.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|CollapsibleColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/collapsibleColumns/collapsibleColumns.ts#L168

:::

_CollapsibleColumns.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SETTING_KEYS

::: ask-about-api SETTING_KEYS|CollapsibleColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/collapsibleColumns/collapsibleColumns.ts#L180

:::

_CollapsibleColumns.SETTING\_KEYS_

Returns the setting keys that trigger a plugin update when changed via `updateSettings`.


## Methods

### collapseAll

::: ask-about-api collapseAll|CollapsibleColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/collapsibleColumns/collapsibleColumns.ts#L410

:::

_collapsibleColumns.collapseAll()_

Collapses all collapsible sections.



### collapseSection

::: ask-about-api collapseSection|CollapsibleColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/collapsibleColumns/collapsibleColumns.ts#L387

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

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/collapsibleColumns/collapsibleColumns.ts#L531

:::

_collapsibleColumns.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|CollapsibleColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/collapsibleColumns/collapsibleColumns.ts#L265

:::

_collapsibleColumns.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|CollapsibleColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/collapsibleColumns/collapsibleColumns.ts#L196

:::

_collapsibleColumns.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### expandAll

::: ask-about-api expandAll|CollapsibleColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/collapsibleColumns/collapsibleColumns.ts#L415

:::

_collapsibleColumns.expandAll()_

Expands all collapsible sections.



### expandSection

::: ask-about-api expandSection|CollapsibleColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/collapsibleColumns/collapsibleColumns.ts#L377

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

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/collapsibleColumns/collapsibleColumns.ts#L191

:::

_collapsibleColumns.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [CollapsibleColumns#enablePlugin](@/api/collapsibleColumns.md#enableplugin) method is called.



### toggleAllCollapsibleSections

::: ask-about-api toggleAllCollapsibleSections|CollapsibleColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/collapsibleColumns/collapsibleColumns.ts#L396

:::

_collapsibleColumns.toggleAllCollapsibleSections(action)_

Collapses or expand all collapsible sections, depending on the action parameter.


| Param | Type | Description |
| --- | --- | --- |
| action | `string` | 'collapse' or 'expand'. |



### toggleCollapsibleSection

::: ask-about-api toggleCollapsibleSection|CollapsibleColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/collapsibleColumns/collapsibleColumns.ts#L427

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

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/collapsibleColumns/collapsibleColumns.ts#L235

:::

_collapsibleColumns.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
  - [`collapsibleColumns`](@/api/options.md#collapsiblecolumns)
  - [`nestedHeaders`](@/api/options.md#nestedheaders)


