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
## Options

### nestedHeaders

::: ask-about-api nestedHeaders|NestedHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4456

:::

_nestedHeaders.nestedHeaders : boolean | Array&lt;Array&gt;_

The `nestedHeaders` option configures the `NestedHeaders` plugin.

You can set the `nestedHeaders` option to one of the following:

| Setting           | Description                                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `false` (default) | Disable the `NestedHeaders` plugin                                                                          |
| `true`            | - Enable the `NestedHeaders` plugin<br>- Don't configure any nested headers                                 |
| Array of arrays   | - Enable the `NestedHeaders` plugin<br>- Configure headers that are nested on Handsontable's initialization |

If you set the `nestedHeaders` option to an array of arrays, each array configures one row of
nested headers (top row first). Within a row, headers are listed left to right.

Each array element configures one header, and can be one of the following:

| Array element | Description                                               |
| ------------- | --------------------------------------------------------- |
| A string      | The header's label                                        |
| An object     | A header configuration object (see the properties below) |

A header configuration object accepts the following properties:

| Property          | Type      | Description                                                                                                                                                                                                                                                                                          |
| ----------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`           | `string`  | The header's label.                                                                                                                                                                                                                                                                                  |
| `colspan`         | `number`  | The number of data columns the header spans (an integer greater than `1`). Groups the columns it covers.                                                                                                                                                                                             |
| `rowspan`         | `number`  | The number of header rows the header spans (an integer greater than `1`).                                                                                                                                                                                                                            |
| `headerClassName` | `string`  | One or more space-separated CSS class names added to the header element (for example, `'htRight'`).                                                                                                                                                                                                  |
| `visibleWhen`     | `string`  | For a header inside a collapsible group, sets in which collapse state the header (and its columns) stays visible: `'collapsed'` (visible only while the group is collapsed), `'expanded'` (visible only while the group is expanded), or `'always'` (visible in both states). When omitted, a header in such a group defaults to `'expanded'` - it is hidden when the group collapses. At least one column of a group always stays visible. |
| `columnDropMode`  | `string`  | Controls what a group does when a column move (with the [`ManualColumnMove`](@/api/options.md#manualcolumnmove) plugin) drops a foreign column (one belonging to another group) into its span. With `'adopt'` (default), the group adopts that column as a child and stays one banner. With `'split'`, the group keeps its identity and renders as several same-label banners around the foreign column (it splits). A group always reclaims its own columns when they move back into its span, regardless of this setting. Meaningful only on a header that spans columns. |

::: tip
A header group is made collapsible through the [`collapsibleColumns`](@/api/options.md#collapsiblecolumns) option, not through
`nestedHeaders`. Once a group is collapsible, mark the column(s) you want to keep visible when it collapses
with `visibleWhen: 'always'` (or `'collapsed'`); the remaining columns are hidden on collapse by default.
:::

::: tip
When `nestedHeaders` is configured, the `label` defined in the [`columns`](@/api/options.md#columns) option for the same
column is replaced by the `label` from `nestedHeaders`. The `nestedHeaders` label takes precedence.
:::

::: warning
A `label` is written to the DOM as HTML, so a label built from user input or an external system can
inject markup. Handsontable does not sanitize it by default. Set the [`sanitizer`](@/api/options.md#sanitizer) option,
which receives nested header labels under the `'header'` source. The `sanitizer` option is grid-level,
so it cannot be narrowed to one header or one column.
:::

Read more:
- [Security: Content sanitizing](@/guides/security/security/security.md#content-sanitizing)
- [Column groups: Nested headers](@/guides/columns/column-groups/column-groups.md#nested-headers)
- [Column groups: Choose which columns stay visible when collapsed](@/guides/columns/column-groups/column-groups.md#choose-which-columns-stay-visible-when-collapsed)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Example**  
```js
// group headers with `label` and `colspan`
nestedHeaders: [
  ['A', {label: 'B', colspan: 8}, 'C'],
  ['D', {label: 'E', colspan: 4}, {label: 'F', colspan: 4}, 'G'],
  ['H', 'I', 'J', 'K', 'L', 'M', 'N', 'R', 'S', 'T']
],

// choose which columns stay visible when a collapsible group is collapsed:
// unmarked headers (Jan, Feb, Mar) are hidden on collapse; `Total` appears only when collapsed
nestedHeaders: [
  ['Region', {label: 'Q1 2025', colspan: 4}],
  ['Region', 'Jan', 'Feb', 'Mar', {label: 'Total', visibleWhen: 'collapsed'}]
],
collapsibleColumns: true,
```

## Members

### detectedOverlappedHeaders

::: ask-about-api detectedOverlappedHeaders|NestedHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/nestedHeaders/nestedHeaders.ts#L708

:::

_nestedHeaders.detectedOverlappedHeaders_

The flag which determines that the nested header settings contains overlapping headers
configuration.



### ghostTable

::: ask-about-api ghostTable|NestedHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/nestedHeaders/nestedHeaders.ts#L702

:::

_nestedHeaders.ghostTable_

Custom helper for getting widths of the nested headers.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|NestedHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/nestedHeaders/nestedHeaders.ts#L298

:::

_NestedHeaders.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|NestedHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/nestedHeaders/nestedHeaders.ts#L303

:::

_NestedHeaders.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.


## Methods

### _getHeaderTreeNodeDataByCoords

::: ask-about-api _getHeaderTreeNodeDataByCoords|NestedHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/nestedHeaders/nestedHeaders.ts#L530

:::

_nestedHeaders.\_getHeaderTreeNodeDataByCoords()_

Returns the header tree node data for the given coordinates, or undefined if the coordinates do not point to a header cell.



### clearColspans

::: ask-about-api clearColspans|NestedHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/nestedHeaders/nestedHeaders.ts#L421

:::

_nestedHeaders.clearColspans()_

Removes all colspan and rowspan attributes from the rendered header cells in all overlays.



### destroy

::: ask-about-api destroy|NestedHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/nestedHeaders/nestedHeaders.ts#L523

:::

_nestedHeaders.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|NestedHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/nestedHeaders/nestedHeaders.ts#L392

:::

_nestedHeaders.disablePlugin()_

Disables the plugin by removing all registered hooks, clearing header state, and resetting visual indicators.



### enablePlugin

::: ask-about-api enablePlugin|NestedHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/nestedHeaders/nestedHeaders.ts#L313

:::

_nestedHeaders.enablePlugin()_

Enables the plugin by registering all required hooks and initializing the header state.



### getColumnHeaderValue

::: ask-about-api getColumnHeaderValue|NestedHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/nestedHeaders/nestedHeaders.ts#L514

:::

_nestedHeaders.getColumnHeaderValue()_

Returns the display value for a nested header cell at the given visual column index and header level.



### getHeaderSettings

::: ask-about-api getHeaderSettings|NestedHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/nestedHeaders/nestedHeaders.ts#L416

:::

_nestedHeaders.getHeaderSettings()_

Returns the header settings node for the specified header level and column index.



### getLayersCount

::: ask-about-api getLayersCount|NestedHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/nestedHeaders/nestedHeaders.ts#L411

:::

_nestedHeaders.getLayersCount()_

Returns the number of nested header rows currently configured in the plugin.



### getStateManager

::: ask-about-api getStateManager|NestedHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/nestedHeaders/nestedHeaders.ts#L406

:::

_nestedHeaders.getStateManager()_

Returns the internal state manager that tracks the nested header spans and their layout configuration.



### headerRendererFactory

::: ask-about-api headerRendererFactory|NestedHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/nestedHeaders/nestedHeaders.ts#L465

:::

_nestedHeaders.headerRendererFactory()_

Creates and returns a header renderer function for the specified header layer level.



### isEnabled

::: ask-about-api isEnabled|NestedHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/nestedHeaders/nestedHeaders.ts#L308

:::

_nestedHeaders.isEnabled()_

Returns whether the plugin is enabled based on the presence of the `nestedHeaders` settings key.



### updatePlugin

::: ask-about-api updatePlugin|NestedHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/nestedHeaders/nestedHeaders.ts#L358

:::

_nestedHeaders.updatePlugin()_

Updates the plugin state when Handsontable settings change, rebuilding the header tree and refreshing column widths.


