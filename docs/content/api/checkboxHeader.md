---
title: CheckboxHeader
metaTitle: CheckboxHeader API reference | Handsontable DataGrid for JavaScript
permalink: /api/checkbox-header
canonicalUrl: /api/checkbox-header
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]

See the [Checkbox cell type](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md) guide for examples and configuration details.

## Options

### headerCheckbox
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span></p>

::: ask-about-api headerCheckbox|CheckboxHeader

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4375

:::

_checkboxHeader.headerCheckbox : boolean | object_

The `headerCheckbox` option adds a "check all" checkbox to the header of a
[checkbox](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md) column. A click on it checks every
checkbox in the column, or unchecks them when all of them are checked, and writes the values into
the data in one undo step. When only some cells are checked, the header checkbox shows the mixed
state. Read-only cells are skipped.

You can set the `headerCheckbox` option to one of the following:

| Setting                  | Description                                                                    |
| ------------------------ | ------------------------------------------------------------------------------ |
| `false` or unset (default) | No header checkbox                                                           |
| `true`                   | A header checkbox that writes to the rows that pass the filters (all pages)    |
| `{ scope: 'filtered' }`  | The same as `true`                                                             |
| `{ scope: 'all' }`       | Also writes to the rows the filters hide                                       |
| `{ scope: 'currentPage' }` | Writes only to the rows on the current page of the [`Pagination`](@/api/pagination.md) plugin |

The option works only on columns whose [`type`](@/api/options.md#type) is `'checkbox'`. Rows hidden with the
[`HiddenRows`](@/api/hiddenRows.md) plugin and rows trimmed with the [`TrimRows`](@/api/trimRows.md)
plugin are never written.

Read more:
- [Checkbox cell type: Check all in the column header](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md#check-all-in-the-column-header)

**Default**: <code>undefined</code>  
**Since**: 19.0.0  
**Example**  
```js
columns: [
  { data: 'name' },
  // a "check all" checkbox in the header of the `active` column
  { data: 'active', type: 'checkbox', headerCheckbox: true },
],
```

## Members

### LICENSE

::: ask-about-api LICENSE|CheckboxHeader

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/checkboxHeader/checkboxHeader.ts#L248

:::

_CheckboxHeader.LICENSE_

Returns the license token of the plugin, its display name, where it is checked, and the tokens it
requires.



### PLUGIN_DEPS

::: ask-about-api PLUGIN_DEPS|CheckboxHeader

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/checkboxHeader/checkboxHeader.ts#L240

:::

_CheckboxHeader.PLUGIN\_DEPS_

Returns the list of plugin dependencies required before this plugin can be initialized.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|CheckboxHeader

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/checkboxHeader/checkboxHeader.ts#L224

:::

_CheckboxHeader.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|CheckboxHeader

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/checkboxHeader/checkboxHeader.ts#L229

:::

_CheckboxHeader.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SETTING_KEYS

::: ask-about-api SETTING_KEYS|CheckboxHeader

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/checkboxHeader/checkboxHeader.ts#L235

:::

_CheckboxHeader.SETTING\_KEYS_

The plugin reacts to the column-level `headerCheckbox` option, which no grid-level key carries,
so no settings update needs to reach `updatePlugin()`.


## Methods

### destroy

::: ask-about-api destroy|CheckboxHeader

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/checkboxHeader/checkboxHeader.ts#L377

:::

_checkboxHeader.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|CheckboxHeader

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/checkboxHeader/checkboxHeader.ts#L300

:::

_checkboxHeader.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|CheckboxHeader

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/checkboxHeader/checkboxHeader.ts#L261

:::

_checkboxHeader.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getHeaderCheckboxState

::: ask-about-api getHeaderCheckboxState|CheckboxHeader

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/checkboxHeader/checkboxHeader.ts#L333

:::

_checkboxHeader.getHeaderCheckboxState(column) ⇒ Object_

Returns the state of a column's "check all" checkbox: `'checked'`, `'unchecked'`, `'mixed'`, or
`'disabled'` (no editable checkbox in the scope), with the number of checked and editable cells.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |



### hasHeaderCheckbox

::: ask-about-api hasHeaderCheckbox|CheckboxHeader

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/checkboxHeader/checkboxHeader.ts#L316

:::

_checkboxHeader.hasHeaderCheckbox(column) ⇒ boolean_

Tells whether the column shows a "check all" checkbox: it is a checkbox column with the
`headerCheckbox` option, and the [`RowSelection`](@/api/rowSelection.md) plugin does not render
its checkboxes in it (its bound column, or the first column with `checkboxLocation: 'firstColumn'`;
then that plugin owns the header).


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |



### isEnabled

::: ask-about-api isEnabled|CheckboxHeader

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/checkboxHeader/checkboxHeader.ts#L256

:::

_checkboxHeader.isEnabled() ⇒ boolean_

Checks if the plugin is enabled. It always is: a column opts in through its own
`headerCheckbox` option.



### onGridReady

::: ask-about-api onGridReady|CheckboxHeader

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/checkboxHeader/checkboxHeader.ts#L295

:::

_checkboxHeader.onGridReady()_

Reports the header checkboxes the license key does not cover before the grid's first render, so the
license message the grid writes then names them.



### setColumnChecked

::: ask-about-api setColumnChecked|CheckboxHeader

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/checkboxHeader/checkboxHeader.ts#L364

:::

_checkboxHeader.setColumnChecked(column, checked) ⇒ boolean_

Checks or unchecks every editable checkbox in the column's scope. It is one undo step.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |
| checked | `boolean` | `true` to check, `false` to uncheck. |


**Returns**: `boolean` - `true` if any value changed.  

### toggleColumn

::: ask-about-api toggleColumn|CheckboxHeader

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/checkboxHeader/checkboxHeader.ts#L348

:::

_checkboxHeader.toggleColumn(column) ⇒ boolean_

Checks every editable checkbox in the column's scope, or unchecks them when all are checked,
the way a click on the "check all" checkbox does. It is one undo step.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |


**Returns**: `boolean` - `true` if any value changed.  
