---
title: NestedHeaders
metaTitle: NestedHeaders - JavaScript Data Grid | Handsontable
permalink: /api/nested-headers
canonicalUrl: /api/nested-headers
searchCategory: API Reference
hotPlugin: false
editLink: false
id: inirtbkb
description: Use the NestedHeaders plugin with its API options and methods to group your columns, using multiple levels of nested column headers.
react:
  id: 8qwzxi9i
  metaTitle: NestedHeaders - React Data Grid | Handsontable
angular:
  id: c1v8e6wx
  metaTitle: NestedHeaders - Angular Data Grid | Handsontable
---

[[toc]]
## Members

### detectedOverlappedHeaders

::: ask-about-api detectedOverlappedHeaders|NestedHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/nestedHeaders/nestedHeaders.ts#L581

:::

_nestedHeaders.detectedOverlappedHeaders_

The flag which determines that the nested header settings contains overlapping headers
configuration.



### ghostTable

::: ask-about-api ghostTable|NestedHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/nestedHeaders/nestedHeaders.ts#L575

:::

_nestedHeaders.ghostTable_

Custom helper for getting widths of the nested headers.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|NestedHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/nestedHeaders/nestedHeaders.ts#L229

:::

_NestedHeaders.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|NestedHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/nestedHeaders/nestedHeaders.ts#L234

:::

_NestedHeaders.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.


## Methods

### _getHeaderTreeNodeDataByCoords

::: ask-about-api _getHeaderTreeNodeDataByCoords|NestedHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/nestedHeaders/nestedHeaders.ts#L456

:::

_nestedHeaders.\_getHeaderTreeNodeDataByCoords()_

Returns the header tree node data for the given coordinates, or undefined if the coordinates do not point to a header cell.



### clearColspans

::: ask-about-api clearColspans|NestedHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/nestedHeaders/nestedHeaders.ts#L347

:::

_nestedHeaders.clearColspans()_

Removes all colspan and rowspan attributes from the rendered header cells in all overlays.



### destroy

::: ask-about-api destroy|NestedHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/nestedHeaders/nestedHeaders.ts#L449

:::

_nestedHeaders.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|NestedHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/nestedHeaders/nestedHeaders.ts#L318

:::

_nestedHeaders.disablePlugin()_

Disables the plugin by removing all registered hooks, clearing header state, and resetting visual indicators.



### enablePlugin

::: ask-about-api enablePlugin|NestedHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/nestedHeaders/nestedHeaders.ts#L244

:::

_nestedHeaders.enablePlugin()_

Enables the plugin by registering all required hooks and initializing the header state.



### getColumnHeaderValue

::: ask-about-api getColumnHeaderValue|NestedHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/nestedHeaders/nestedHeaders.ts#L440

:::

_nestedHeaders.getColumnHeaderValue()_

Returns the display value for a nested header cell at the given visual column index and header level.



### getHeaderSettings

::: ask-about-api getHeaderSettings|NestedHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/nestedHeaders/nestedHeaders.ts#L342

:::

_nestedHeaders.getHeaderSettings()_

Returns the header settings node for the specified header level and column index.



### getLayersCount

::: ask-about-api getLayersCount|NestedHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/nestedHeaders/nestedHeaders.ts#L337

:::

_nestedHeaders.getLayersCount()_

Returns the number of nested header rows currently configured in the plugin.



### getStateManager

::: ask-about-api getStateManager|NestedHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/nestedHeaders/nestedHeaders.ts#L332

:::

_nestedHeaders.getStateManager()_

Returns the internal state manager that tracks the nested header spans and their layout configuration.



### headerRendererFactory

::: ask-about-api headerRendererFactory|NestedHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/nestedHeaders/nestedHeaders.ts#L391

:::

_nestedHeaders.headerRendererFactory()_

Creates and returns a header renderer function for the specified header layer level.



### isEnabled

::: ask-about-api isEnabled|NestedHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/nestedHeaders/nestedHeaders.ts#L239

:::

_nestedHeaders.isEnabled()_

Returns whether the plugin is enabled based on the presence of the `nestedHeaders` settings key.



### updatePlugin

::: ask-about-api updatePlugin|NestedHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/nestedHeaders/nestedHeaders.ts#L286

:::

_nestedHeaders.updatePlugin()_

Updates the plugin state when Handsontable settings change, rebuilding the header tree and refreshing column widths.


