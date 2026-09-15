---
title: MoveCells
metaTitle: MoveCells API reference – JavaScript Data Grid | Handsontable
permalink: /api/move-cells
canonicalUrl: /api/move-cells
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]
## Members

### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|MoveCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/moveCells/moveCells.ts#L155

:::

_MoveCells.PLUGIN\_KEY ⇒ string_

The plugin's registration key (the name of the setting that enables it).



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|MoveCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/moveCells/moveCells.ts#L162

:::

_MoveCells.PLUGIN\_PRIORITY ⇒ number_

The plugin's initialization priority within the plugin registry.



### SETTING_KEYS

::: ask-about-api SETTING_KEYS|MoveCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/moveCells/moveCells.ts#L169

:::

_MoveCells.SETTING\_KEYS ⇒ Array&lt;string&gt;_

The settings whose change through `updateSettings` triggers `updatePlugin`.


## Methods

### destroy

::: ask-about-api destroy|MoveCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/moveCells/moveCells.ts#L208

:::

_moveCells.destroy()_

Destroys the plugin and removes any active drag preview.



### disablePlugin

::: ask-about-api disablePlugin|MoveCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/moveCells/moveCells.ts#L201

:::

_moveCells.disablePlugin()_

Disables selection move interactions and cancels an active drag.



### enablePlugin

::: ask-about-api enablePlugin|MoveCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/moveCells/moveCells.ts#L183

:::

_moveCells.enablePlugin()_

Enables selection move interactions.



### isEnabled

::: ask-about-api isEnabled|MoveCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/moveCells/moveCells.ts#L178

:::

_moveCells.isEnabled() ⇒ boolean_

Checks whether the plugin is enabled in the Handsontable settings.



### moveCellRange

::: ask-about-api moveCellRange|MoveCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/moveCells/moveCells.ts#L231

:::

_moveCells.moveCellRange(sourceRange, targetTopLeft, [isCopy]) ⇒ boolean_

Moves or copies a visual cell range.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| sourceRange | `CellRange` |  | The source range. |
| targetTopLeft | `CellCoords` |  | The destination top-left cell. |
| [isCopy] | `boolean` | <code>false</code> | `optional` Whether to keep the source values. |


**Returns**: `boolean` - Whether the operation completed. Returns `false` when the target equals the
source top-left (a no-op — no hook fires and no undo entry is recorded), when the range spans
more than [CELLS_LIMIT](@/api/cELLS_LIMIT.md) cells, or when any other guard vetoes the operation.  

### updatePlugin

::: ask-about-api updatePlugin|MoveCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/moveCells/moveCells.ts#L194

:::

_moveCells.updatePlugin()_

Updates the plugin after its setting changes.


