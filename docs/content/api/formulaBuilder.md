---
title: FormulaBuilder
metaTitle: FormulaBuilder | Handsontable DataGrid for JavaScript
permalink: /api/formula-builder
canonicalUrl: /api/formula-builder
searchCategory: API Reference
hotPlugin: false
editLink: false
id: fb2c4d6e
description: Use the FormulaBuilder plugin with its API options, members, and methods to edit formulas with a formula bar, colored cell references, autocomplete, and reference picking.
react:
  id: 9fb31a7c
  metaTitle: FormulaBuilder | Handsontable DataGrid for React
angular:
  id: c3fb81d2
  metaTitle: FormulaBuilder | Handsontable DataGrid for Angular
---

[[toc]]

See the [Formula builder](@/guides/formulas/formula-builder/formula-builder.md) guide for examples and configuration details.


## Description


## Options

### formulaBuilder
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api formulaBuilder|FormulaBuilder

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4047

:::

_formulaBuilder.formulaBuilder : object | boolean_

The `formulaBuilder` option configures the `FormulaBuilder` plugin.

The `FormulaBuilder` plugin adds spreadsheet-style formula
editing (a formula bar, an inline formula editor with colored references, reference
picking, and formula error indicators) on top of the [`Formulas`](@/api/formulas.md) plugin,
which must be enabled with a configured engine.

You can set the `formulaBuilder` option to `false` (the plugin is off) or to an object with the
following properties. There is no `true`: the plugin needs the `builder` module to run. The plugin
logs a warning and stays disabled for `true`, for `{}`, and for an object without `builder`,
although `validateSettings()` accepts all three.

| Property         | Possible values                                                 |
| ---------------- | --------------------------------------------------------------- |
| `builder`        | The `hyperformula-ui` module namespace (`import * as FormulaBuilderModule from 'hyperformula-ui'`). Required. |
| `showFormulaBar` | A boolean. Renders the formula bar above the grid when `true`. Default: `false`. |
| `popups`         | An object with the popup options: `showClose`, `suggestions`, `fnHelp`, and `error`. |
| `direction`      | `'ltr'` or `'rtl'`. The layout direction of the editor and its popups. Default: the grid's layout direction. |

Formula editing is opt-in per cell: set [`editor`](@/api/options.md#editor) to `'formula'` on the cells,
columns, or grid that use the formula editor.

Read more:
- [Formula builder](@/guides/formulas/formula-builder/formula-builder.md)
- [Plugins: `Formulas`](@/api/formulas.md)

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Since**: 19.0.0  
**Example**  
```js
import * as FormulaBuilderModule from 'hyperformula-ui';
import { HyperFormula } from 'hyperformula';

// the formula editor on every cell
editor: 'formula',
formulas: {
  engine: HyperFormula,
},
formulaBuilder: {
  builder: FormulaBuilderModule,
  showFormulaBar: true,
},
```

## Members

### EDITORS

::: ask-about-api EDITORS|FormulaBuilder

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/formulaBuilder.ts#L814

:::

_FormulaBuilder.EDITORS_

The editor aliases the plugin provides. `validateSettings()` accepts them for a registered
plugin before any grid exists, while the editor registry learns them from the first instance.



### LICENSE

::: ask-about-api LICENSE|FormulaBuilder

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/formulaBuilder.ts#L840

:::

_FormulaBuilder.LICENSE_

Returns the license token of the plugin, its display name, where it is checked, and the tokens it
requires.



### PLUGIN_DEPS

::: ask-about-api PLUGIN_DEPS|FormulaBuilder

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/formulaBuilder.ts#L832

:::

_FormulaBuilder.PLUGIN\_DEPS_

Returns the list of plugin dependencies required before this plugin can be initialized.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|FormulaBuilder

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/formulaBuilder.ts#L803

:::

_FormulaBuilder.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|FormulaBuilder

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/formulaBuilder.ts#L808

:::

_FormulaBuilder.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SETTING_KEYS

::: ask-about-api SETTING_KEYS|FormulaBuilder

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/formulaBuilder.ts#L824

:::

_FormulaBuilder.SETTING\_KEYS_

Returns the setting keys that, when present in an `updateSettings` config object, trigger
the plugin update. `formulas` is included because the plugin borrows the engine from the
Formulas plugin at enable time - a Formulas reconfiguration must re-run the enable cycle
so the plugin never keeps a stale engine reference.


## Methods

### attachFnHelpHost

::: ask-about-api attachFnHelpHost|FormulaBuilder

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/formulaBuilder.ts#L938

:::

_formulaBuilder.attachFnHelpHost(container)_

Re-parents the function help popup into a custom host element.


| Param | Type | Description |
| --- | --- | --- |
| container | `HTMLElement` <br/> `string` | The host element or a CSS selector. |



### attachSuggestionsHost

::: ask-about-api attachSuggestionsHost|FormulaBuilder

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/formulaBuilder.ts#L920

:::

_formulaBuilder.attachSuggestionsHost(container)_

Re-parents the suggestions popup into a custom host element.


| Param | Type | Description |
| --- | --- | --- |
| container | `HTMLElement` <br/> `string` | The host element or a CSS selector. |



### destroy

::: ask-about-api destroy|FormulaBuilder

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/formulaBuilder.ts#L904

:::

_formulaBuilder.destroy()_

Destroy plugin instance.



### detachFnHelpHost

::: ask-about-api detachFnHelpHost|FormulaBuilder

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/formulaBuilder.ts#L948

:::

_formulaBuilder.detachFnHelpHost()_

Restores the function help popup to its default anchored placement.



### detachSuggestionsHost

::: ask-about-api detachSuggestionsHost|FormulaBuilder

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/formulaBuilder.ts#L930

:::

_formulaBuilder.detachSuggestionsHost()_

Restores the suggestions popup to its default anchored placement.



### disablePlugin

::: ask-about-api disablePlugin|FormulaBuilder

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/formulaBuilder.ts#L879

:::

_formulaBuilder.disablePlugin()_

Disable plugin for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|FormulaBuilder

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/formulaBuilder.ts#L852

:::

_formulaBuilder.enablePlugin()_

Enable plugin for this Handsontable instance.



### getRawCellText

::: ask-about-api getRawCellText|FormulaBuilder

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/formulaBuilder.ts#L1221

:::

_formulaBuilder.getRawCellText(row, col) ⇒ string_

Returns the raw cell text: the formula source of a formula cell, or the stringified value.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | The visual row index. |
| col | `number` | The visual column index. |



### isEnabled

::: ask-about-api isEnabled|FormulaBuilder

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/formulaBuilder.ts#L847

:::

_formulaBuilder.isEnabled() ⇒ boolean_

Check if the plugin is enabled in the handsontable settings.



### updatePlugin

::: ask-about-api updatePlugin|FormulaBuilder

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/formulaBuilder.ts#L886

:::

_formulaBuilder.updatePlugin()_

Update plugin state after Handsontable settings update. A settings update that changes
nothing the plugin was built from keeps the built plugin (see `AppliedConfig` in the source).


