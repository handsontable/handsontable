---
title: SheetsBar
metaTitle: SheetsBar API reference | Handsontable DataGrid for JavaScript
permalink: /api/sheets-bar
canonicalUrl: /api/sheets-bar
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]

See the [Sheets bar](@/guides/accessories-and-menus/sheets-bar/sheets-bar.md) guide for examples and configuration details.

## Options

### sheetsBar
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api sheetsBar|SheetsBar

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L7499

:::

_sheetsBar.sheetsBar : boolean | object_

The `sheetsBar` option configures the `SheetsBar` plugin, which renders a tab bar
below the grid — or above it, with the `position` option — and lets the user
switch between the sheets of a multi-sheet workbook.

You can set the `sheetsBar` option to one of the following:

| Setting                          | Description                                                       |
| -------------------------------- | ------------------------------------------------------------------|
| `undefined` (default)            | Disable the `SheetsBar` plugin                                    |
| `false`                          | Disable the `SheetsBar` plugin                                    |
| `true`                           | Enable the `SheetsBar` plugin                |

##### sheetsBar: Additional options

If you set the `sheetsBar` option to an object, you can set the following `SheetsBar` plugin options:

| Option        | Possible settings                                  | Description                                                                                 |
| ------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `sheets`      | An array of `{ name, data, settings }` objects, or `null` | Defines the workbook. When omitted, the grid's own data becomes a single `Sheet1`. When omitted and the [`formulas`](@/api/options.md#formulas) option's `engine` is a HyperFormula instance that holds sheets, the bar shows one tab per engine sheet instead, plus one tab for the grid's `data` when it is set. Like the [`data`](@/api/options.md#data) option, the plugin writes into the array: renames, added and duplicated sheets, and removals. Tab order and `updateSheetSettings()` changes aren't written. Keep the array, its entries, and their `data` mutable and stable: the same array passed again keeps the workbook, while an array that describes other sheets rebuilds it. On a frozen array or entry, those changes are refused with a console warning |
| `activeSheet` | A number (default: `0`)                              | The position, within `sheets` (not in the tab order), of the sheet to activate on initialization. To switch sheets later, call `setActiveSheet()`. With `sheetsBar: true`, which declares no `sheets`, it counts in the tab order |
| `controls`    | Boolean (default: `true`)                            | Controls visibility of the add-sheet and all-sheets menu controls                             |
| `paging`      | Boolean (default: `true`)                            | Controls visibility of the tab-scrolling controls, shown when tabs overflow the bar's width    |
| `position`    | `'top'` \| `'bottom'` (default: `'bottom'`)          | The edge of the grid the bar renders on                                                        |
| `uiContainer` | An HTML element (default: `null`)                    | An element of your page to render the bar in, instead of the grid's edge. `position` and the [`layout`](@/api/options.md#layout) option then don't apply to the bar. If not provided, the bar renders on the edge of the grid that `position` names |
| `animation`   | Boolean, or an object of booleans (default: `true`) | Turns the tab animations on or off. `false` makes every tab change instant. An object turns single animations off: `switch` (the active tab marker's slide), `add` (a new or duplicated tab's entrance), `remove` (a removed tab's exit and the tabs closing the gap), and `move` (the tabs sliding to new places after a move, and the tabs a drag pushes aside). A key you leave out stays on. Reduced motion and a theme with `--ht-table-transition: 0s` make every tab change instant whatever this option says. The hover color fade is CSS only and is not affected. An invalid value is ignored with a console warning, and the previous value stays in force |

Read more:

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Since**: 19.0.0  
**Example**  
```js
// enable the `SheetsBar` plugin
sheetsBar: true,

// or, with a predefined workbook
sheetsBar: {
  sheets: [
    { name: 'Budget', data: [['Item', 'Cost'], ['Rent', 1200]] },
    { name: 'Notes', data: [['Draft']] },
  ],
  activeSheet: 0,
},

// animate every tab change (the default)
sheetsBar: {
  animation: true,
},

// make every tab change instant
sheetsBar: {
  animation: false,
},

// keep the tab animations, except the slide after a move
sheetsBar: {
  animation: { switch: true, add: true, remove: true, move: false },
},
```

## Members

### DEFAULT_SETTINGS

::: ask-about-api DEFAULT_SETTINGS|SheetsBar

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/sheetsBar/sheetsBar.ts#L2364

:::

_SheetsBar.DEFAULT\_SETTINGS_

Returns the default settings applied when the plugin is enabled without explicit configuration.



### LICENSE

::: ask-about-api LICENSE|SheetsBar

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/sheetsBar/sheetsBar.ts#L2359

:::

_SheetsBar.LICENSE_

Returns the license token of the plugin, its display name, where it is checked, and the tokens it
requires.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|SheetsBar

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/sheetsBar/sheetsBar.ts#L2348

:::

_SheetsBar.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|SheetsBar

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/sheetsBar/sheetsBar.ts#L2353

:::

_SheetsBar.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SETTINGS_VALIDATORS

::: ask-about-api SETTINGS_VALIDATORS|SheetsBar

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/sheetsBar/sheetsBar.ts#L2377

:::

_SheetsBar.SETTINGS\_VALIDATORS_

Returns an object of validator functions used to type-check each settings property at runtime.


## Methods

### addSheet

::: ask-about-api addSheet|SheetsBar

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/sheetsBar/sheetsBar.ts#L2954

:::

_sheetsBar.addSheet([name], [data], [settings], [source]) ⇒ object | null_

Appends a sheet and returns its descriptor, or `null` when the bar is off, `data` is not an array,
`settings` is not an object, a `beforeSheetTabAdd` listener cancels it, your `sheets` array is frozen
(with a console warning), or it is called from a listener of a workbook change's before-hook.

Without `settings`, the new sheet joins the workbook's shared formula engine, if there is
one, under its own name. Formulas and cross-sheet references then work on it right away.

The name is trimmed and cut to 50 characters. A name another sheet already has, in any letter
case, gets a number: `Budget` becomes `Budget (2)`. Without a name, the sheet gets a default name
in the grid's language, `Sheet{n}` in English. `n` counts the sheets the workbook has added or duplicated, so the
fourth sheet is `Sheet4`, and a name freed by a removed sheet is not reused. A number another sheet
already uses is skipped. Without `data`, the sheet has 1000 empty rows and 26 empty columns, or
1000 empty object rows while it shows with NestedRows on.

**Emits**: [`Hooks#event:beforeSheetTabAdd`](@/api/hooks.md#beforesheettabadd), [`Hooks#event:afterSheetTabAdd`](@/api/hooks.md#aftersheettabadd)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [name] | `string` |  | `optional` The sheet's name. Omitted, the sheet gets the default `Sheet{n}` name. |
| [data] | `Array` |  | `optional` The sheet's data: rows as arrays, or as objects. Omitted, the sheet starts blank, with empty object rows while the sheet shows with NestedRows on. |
| [settings] | `object` |  | `optional` The sheet's settings. Omitted, the sheet inherits the workbook's shared formula engine when one is configured. |
| [source] | `string` | <code>"SheetsBar.api"</code> | `optional` Operation source tag, passed on to the hooks. |


**Returns**: `object` | `null` - The new sheet's `{ id, name, isActive }` descriptor, or `null`.  

### destroy

::: ask-about-api destroy|SheetsBar

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/sheetsBar/sheetsBar.ts#L2657

:::

_sheetsBar.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|SheetsBar

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/sheetsBar/sheetsBar.ts#L2637

:::

_sheetsBar.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.

A genuine teardown discards the workbook: it drops the model first and releases every
sheet's DataProvider context, so whatever the settings restore below starts (a restored
grid-level `dataProvider` fetches) already sees a grid without sheets. Then it puts the
grid-level settings back before the baseline is dropped: the active sheet's own settings are
applied to the grid at this point, and leaving them there would make the next enable read a
polluted grid as its neutral state — a sheet's `fixedColumnsStart` or `columns` would follow
the user into the rebuilt workbook. A preserved re-enable keeps the workbook and the active
sheet applied, so it does neither. The restore re-enters this method on a `sheetsBar: false`
teardown; the model is gone by then, which is what keeps the second pass from releasing and
restoring again.



### duplicateSheet

::: ask-about-api duplicateSheet|SheetsBar

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/sheetsBar/sheetsBar.ts#L2748

:::

_sheetsBar.duplicateSheet(id, [source]) ⇒ object | null_

Duplicates a sheet, placing the copy directly after the original.

The copy gets a deep clone of the sheet's data and settings, and a name based on the
original's. An instance of your own class stored in a cell is shared with the original. The
`formulas` setting is not cloned: the copy shares the original's engine, under a sheet name of its
own. Returns `null` when the bar is off, the id is unknown, a `beforeSheetTabAdd` listener cancels the
copy, your `sheets` array is frozen (with a console warning), or it is called from a listener of a
workbook change's before-hook.

A copy of a server sheet (one with its own `dataProvider`) starts with a copy of the original's rows.
When the original has already loaded rows, the copy doesn't fetch on its first visit.

**Emits**: [`Hooks#event:beforeSheetTabAdd`](@/api/hooks.md#beforesheettabadd), [`Hooks#event:afterSheetTabAdd`](@/api/hooks.md#aftersheettabadd)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| id | `number` |  | The sheet to copy. |
| [source] | `string` | <code>"SheetsBar.api"</code> | `optional` Operation source tag, passed on to the hooks. |


**Returns**: `object` | `null` - The copy's `{ id, name, isActive }` descriptor, or `null`.  

### enablePlugin

::: ask-about-api enablePlugin|SheetsBar

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/sheetsBar/sheetsBar.ts#L2397

:::

_sheetsBar.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getSheetData

::: ask-about-api getSheetData|SheetsBar

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/sheetsBar/sheetsBar.ts#L2693

:::

_sheetsBar.getSheetData(idOrName) ⇒ Array | null_

Returns a sheet's source data, without switching to it. With `sheetsBar: true`, the sheets added
after the first one exist only in the plugin, and this is how you read them. With a declared
workbook, it returns the same array as the sheet's `data` in your `sheets` array.

It returns the sheet's current array: no copy is made. For the active sheet, it is the array the grid works
on. Rows come in the sheet's source order, not in the sorted view order. The plugin can replace a sheet's
array later (for example, with a server response or a new top-level `data`), so call this method again each
time instead of keeping the array. A sheet that loads its rows through its own `dataProvider` returns only
the page it has loaded. While the sheet is active, change its data through [Core#setDataAtCell](@/api/core.md#setdataatcell) or
[Core#loadData](@/api/core.md#loaddata), not in place, and do not add or remove rows of a hidden sheet's array in place either.

Returns `null` when the bar is off or the sheet does not exist.

**Example**  
```js
const sheetsBar = hot.getPlugin('sheetsBar');
const workbook = sheetsBar.getSheets().map(({ id, name }) => ({ name, data: sheetsBar.getSheetData(id) }));
```

| Param | Type | Description |
| --- | --- | --- |
| idOrName | `number` <br/> `string` | The sheet's id, or its name. |


**Returns**: `Array` | `null` - The sheet's source data, or `null`.  

### getSheets

::: ask-about-api getSheets|SheetsBar

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/sheetsBar/sheetsBar.ts#L2668

:::

_sheetsBar.getSheets() ⇒ Array&lt;object&gt;_

Returns descriptors of all sheets in tab order.


**Returns**: `Array<object>` - One `{ id, name, isActive }` descriptor per sheet.  

### isEnabled

::: ask-about-api isEnabled|SheetsBar

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/sheetsBar/sheetsBar.ts#L2392

:::

_sheetsBar.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings.



### moveSheetToIndex

::: ask-about-api moveSheetToIndex|SheetsBar

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/sheetsBar/sheetsBar.ts#L2927

:::

_sheetsBar.moveSheetToIndex(id, to, [source]) ⇒ boolean_

Moves a sheet to a position in the tab order.

The index counts sheets in tab order, not on screen, so it is the same under RTL.
Returns `false` when the bar is off, the id is unknown, the index is not an integer, is out of range
or is the sheet's current one, a `beforeSheetTabMove` listener cancels the move, or it is called from
a listener of a workbook change's before-hook.

**Emits**: [`Hooks#event:beforeSheetTabMove`](@/api/hooks.md#beforesheettabmove), [`Hooks#event:afterSheetTabMove`](@/api/hooks.md#aftersheettabmove)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| id | `number` |  | The sheet id. |
| to | `number` |  | The target index. |
| [source] | `string` | <code>"SheetsBar.api"</code> | `optional` The operation source reported to the hooks. |


**Returns**: `boolean` - `true` when the sheet moved.  

### removeSheet

::: ask-about-api removeSheet|SheetsBar

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/sheetsBar/sheetsBar.ts#L2765

:::

_sheetsBar.removeSheet(id, [source]) ⇒ boolean_

Removes a sheet.

Removing the active sheet first switches to its nearest neighbor, which fires the switch hooks.
Returns `false` when the bar is off, the id is unknown, the sheet is the last one, a
`beforeSheetTabRemove` listener cancels the removal, the switch to the neighbor is rejected, your
`sheets` array is frozen (with a console warning), or it is called from a listener of a workbook
change's before-hook, such as `beforeSheetTabChange`.

**Emits**: [`Hooks#event:beforeSheetTabRemove`](@/api/hooks.md#beforesheettabremove), [`Hooks#event:afterSheetTabRemove`](@/api/hooks.md#aftersheettabremove)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| id | `number` |  | The sheet to remove. |
| [source] | `string` | <code>"SheetsBar.api"</code> | `optional` Operation source tag, passed on to the hooks. |


**Returns**: `boolean` - `true` when the sheet was removed.  

### renameSheet

::: ask-about-api renameSheet|SheetsBar

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/sheetsBar/sheetsBar.ts#L2727

:::

_sheetsBar.renameSheet(id, name, [source]) ⇒ boolean_

Renames a sheet.

Returns `false` when the bar is off, the id is unknown, the name has no visible character or is
unchanged, another sheet already uses the name (in the bar or in the sheet's formula engine), a
`beforeSheetTabRename` listener cancels the rename, the sheet's entry in your `sheets` array is frozen
(with a console warning), or it is called from a listener of a workbook change's before-hook. A name
that changes only the case of the letters is a rename.

With the `Formulas` plugin, the references to the sheet are rewritten in the data of every sheet
that shares its formula engine, and the rename is one undo step.

**Emits**: [`Hooks#event:beforeSheetTabRename`](@/api/hooks.md#beforesheettabrename), [`Hooks#event:afterSheetTabRename`](@/api/hooks.md#aftersheettabrename)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| id | `number` |  | The sheet's id. |
| name | `string` |  | The new name. Trimmed, and cut to 50 characters. |
| [source] | `string` | <code>"SheetsBar.api"</code> | `optional` Operation source tag, passed on to the hooks. |


**Returns**: `boolean` - `true` when the sheet was renamed.  

### setActiveSheet

::: ask-about-api setActiveSheet|SheetsBar

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/sheetsBar/sheetsBar.ts#L2836

:::

_sheetsBar.setActiveSheet(idOrName, [source]) ⇒ boolean_

Activates a sheet by id or name. Returns `false` when the bar is off, the sheet doesn't exist, is
already active, another switch is in progress, or a `beforeSheetTabChange` listener cancels the switch.

The switch first saves the cell editor and the comment editor on the sheet you leave. It
returns `false`, and switches nothing, while a cell value waits for its validator, or while
the editor holds a value its validator rejected (`allowInvalid: false`). Validators answer
after the edit, so a call made while the editor of a cell with a validator is open returns
`false` even for a valid value: close the editor first and switch once `afterValidate` has
fired. It also returns `false` when it is called from a listener of a workbook change's
before-hook, such as `beforeSheetTabChange`, or of `afterSheetTabStateCapture`.

**Emits**: [`Hooks#event:beforeSheetTabChange`](@/api/hooks.md#beforesheettabchange), [`Hooks#event:afterSheetTabStateCapture`](@/api/hooks.md#aftersheettabstatecapture), [`Hooks#event:afterSheetTabStateRestore`](@/api/hooks.md#aftersheettabstaterestore), [`Hooks#event:afterSheetTabChange`](@/api/hooks.md#aftersheettabchange)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| idOrName | `number` <br/> `string` |  | The sheet's id, or its name. |
| [source] | `string` | <code>"SheetsBar.api"</code> | `optional` Operation source tag, passed on to the hooks. |


**Returns**: `boolean` - `true` when the sheet was activated.  

### updatePlugin

::: ask-about-api updatePlugin|SheetsBar

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/sheetsBar/sheetsBar.ts#L2574

:::

_sheetsBar.updatePlugin()_

Updates the plugin state. This method is executed when [Core#updateSettings](@/api/core.md#updatesettings) is invoked.

A framework wrapper sends its whole configuration on every render. When neither the workbook nor
anything the bar's elements were built from changed (`#readUiSettings`), the bar is left as it is and
only an `activeSheet` request is acted on: a teardown cancels an open rename and a drag, and the rest
of the name the user was typing landed in the selected cell.



### updateSheetSettings

::: ask-about-api updateSheetSettings|SheetsBar

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/sheetsBar/sheetsBar.ts#L2788

:::

_sheetsBar.updateSheetSettings(idOrName, settings) ⇒ boolean_

Updates a sheet's own settings, the way [Core#updateSettings](@/api/core.md#updatesettings) updates the grid's: the keys you
pass are merged into the settings the sheet already has, and an options object such as `columnSorting`
is merged into the one the sheet sets, as [Core#updateSettings](@/api/core.md#updatesettings) merges it. A key passed as
`undefined` is left out, as [Core#updateSettings](@/api/core.md#updatesettings) leaves it out, so a key a sheet declares cannot
be removed from it, only given another value. On the visible sheet the change applies at once; on any other sheet it applies
when the sheet is shown next, in place of what the sheet kept from your last visit for that key, such
as its sort, filters, or hidden columns. The rest of what it kept, such as the selection and the scroll
position, comes back as usual. The entry in your `sheets` array keeps the `settings` you declared.

While the plugin is enabled, use this method, not [Core#updateSettings](@/api/core.md#updatesettings), to change a sheet's settings.

Returns `false` when the bar is off, the sheet does not exist, `settings` is not an object or changes
nothing, a sheet switch is in progress, or it is called from a listener of a workbook change's
before-hook. A `sheetsBar` key is ignored, because a sheet cannot reconfigure the bar, and so is `data`,
because a sheet's rows are its `data` in your `sheets` array.


| Param | Type | Description |
| --- | --- | --- |
| idOrName | `number` <br/> `string` | The sheet's id, or its name. |
| settings | `object` | The settings to merge into the sheet's own. |


**Returns**: `boolean` - `true` when the settings were updated.  
