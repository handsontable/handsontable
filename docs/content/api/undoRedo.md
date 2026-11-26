---
title: UndoRedo
metaTitle: UndoRedo | Handsontable DataGrid for JavaScript
permalink: /api/undo-redo
canonicalUrl: /api/undo-redo
searchCategory: API Reference
hotPlugin: false
editLink: false
id: coyq5h6m
description: Use the UndoRedo plugin with its API options and methods to revert and restore your changes.
react:
  id: t5lpzjly
  metaTitle: UndoRedo | Handsontable DataGrid for React
angular:
  id: i5b4k2ij
  metaTitle: UndoRedo | Handsontable DataGrid for Angular
---

[[toc]]

See the [Undo and redo](@/guides/accessories-and-menus/undo-redo/undo-redo.md) guide for examples and configuration details.

## Options

### undo
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api undo|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L8657

:::

_undoRedo.undo : boolean | object_

The `undo` option configures the `UndoRedo` plugin.

You can set the `undo` option to one of the following:

| Setting                    | Description                                                                 |
| -------------------------- | --------------------------------------------------------------------------- |
| `true`                     | Enable the `UndoRedo` plugin                           |
| `false`                    | Disable the `UndoRedo` plugin                          |
| `{ maxHistory: <number> }` | Enable the plugin, and keep at most `maxHistory` steps on the undo stack    |

By default, the `undo` option is set to `true`, and the undo stack has no size limit.
To disable the `UndoRedo` plugin completely,
set the `undo` option to `false`. With `false`, nothing is recorded, so calling `undo()` through the
API undoes nothing either.

With `maxHistory`, the oldest step is dropped once the stack grows past the limit. `maxHistory` takes
a whole number from `0` up, or `Infinity` (no limit, the default); `0` keeps no steps. Lowering it
with `updateSettings()` drops the oldest steps at once. Any other value is ignored with a warning,
and the previous limit stays. The object form is available since 19.0.0.

Read more:
- [Undo and redo](@/guides/accessories-and-menus/undo-redo/undo-redo.md)

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>true</code>  
**Example**  
```js
// enable the `UndoRedo` plugin
undo: true,

// enable the `UndoRedo` plugin, and keep the last 100 steps
undo: {
  maxHistory: 100,
},
```

## Members

### LICENSE

::: ask-about-api LICENSE|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L401

:::

_UndoRedo.LICENSE_

Returns the license token of the plugin, its display name, where it is checked, and the tokens it
requires.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L390

:::

_UndoRedo.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L395

:::

_UndoRedo.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SETTING_KEYS

::: ask-about-api SETTING_KEYS|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L406

:::

_UndoRedo.SETTING\_KEYS_

Returns whether the plugin handles its own settings keys without a dedicated key list.


## Methods

### clear

::: ask-about-api clear|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L704

:::

_undoRedo.clear()_

Clears undo and redo history.



### destroy

::: ask-about-api destroy|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L711

:::

_undoRedo.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L468

:::

_undoRedo.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### done

::: ask-about-api done|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L567

:::

_undoRedo.done(wrappedAction, [source])_

Stash information about performed actions.

Every change made through the grid's API is recorded automatically. Use this method for a change
the grid cannot see – for example, state your own code keeps outside the grid – by registering an
action that knows how to reverse and replay itself.

**Emits**: [`Hooks#event:beforeUndoStackChange`](@/api/hooks.md#beforeundostackchange), [`Hooks#event:afterUndoStackChange`](@/api/hooks.md#afterundostackchange), [`Hooks#event:beforeRedoStackChange`](@/api/hooks.md#beforeredostackchange), [`Hooks#event:afterRedoStackChange`](@/api/hooks.md#afterredostackchange)  
**Example**  
```js
// Register a custom action for state kept outside the grid.
function setUnits(units) {
  const undoRedo = hot.getPlugin('undoRedo');
  const previousUnits = currentUnits;

  undoRedo.done(() => ({
    actionType: 'units',
    undo(instance, callback) {
      currentUnits = previousUnits;
      instance.render();
      callback();
    },
    redo(instance, callback) {
      currentUnits = units;
      instance.render();
      callback();
    },
  }), 'units');

  currentUnits = units;
  hot.render();
}
```

| Param | Type | Description |
| --- | --- | --- |
| wrappedAction | `function` | The action descriptor wrapped in a closure. |
| [source] | `string` | `optional` Source of the action. It is defined just for more general actions (not related to plugins). |



### enablePlugin

::: ask-about-api enablePlugin|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L434

:::

_undoRedo.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled

::: ask-about-api isEnabled|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L429

:::

_undoRedo.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [UndoRedo#enablePlugin](@/api/undoRedo.md#enableplugin) method is called.



### isRedoAvailable

::: ask-about-api isRedoAvailable|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L699

:::

_undoRedo.isRedoAvailable() ⇒ boolean_

Checks if redo action is available. It is not while an action that already changed the grid
waits for an asynchronous validator: the grid then holds half of a step no recorded state
describes.


**Returns**: `boolean` - Return `true` if redo can be performed, `false` otherwise.  

### isUndoAvailable

::: ask-about-api isUndoAvailable|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L690

:::

_undoRedo.isUndoAvailable() ⇒ boolean_

Checks if undo action is available. It is not while an action that already changed the grid
waits for an asynchronous validator: the grid then holds half of a step no recorded state
describes.


**Returns**: `boolean` - Return `true` if undo can be performed, `false` otherwise.  

### redo

::: ask-about-api redo|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L641

:::

_undoRedo.redo()_

Redo the previous action performed to the table (used to reverse an undo).

**Emits**: [`Hooks#event:beforeUndoStackChange`](@/api/hooks.md#beforeundostackchange), [`Hooks#event:afterUndoStackChange`](@/api/hooks.md#afterundostackchange), [`Hooks#event:beforeRedoStackChange`](@/api/hooks.md#beforeredostackchange), [`Hooks#event:afterRedoStackChange`](@/api/hooks.md#afterredostackchange), [`Hooks#event:beforeRedo`](@/api/hooks.md#beforeredo), [`Hooks#event:afterRedo`](@/api/hooks.md#afterredo)  


### undo

::: ask-about-api undo|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L588

:::

_undoRedo.undo()_

Undo the last action performed to the table.

**Emits**: [`Hooks#event:beforeUndoStackChange`](@/api/hooks.md#beforeundostackchange), [`Hooks#event:afterUndoStackChange`](@/api/hooks.md#afterundostackchange), [`Hooks#event:beforeRedoStackChange`](@/api/hooks.md#beforeredostackchange), [`Hooks#event:afterRedoStackChange`](@/api/hooks.md#afterredostackchange), [`Hooks#event:beforeUndo`](@/api/hooks.md#beforeundo), [`Hooks#event:afterUndo`](@/api/hooks.md#afterundo)  


### updatePlugin

::: ask-about-api updatePlugin|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L457

:::

_undoRedo.updatePlugin([newSettings])_

Applies a settings update. Runs for every `updateSettings()` call (`SETTING_KEYS` is `true`), so it
must not disable and enable the plugin: `disablePlugin()` clears the history.


| Param | Type | Description |
| --- | --- | --- |
| [newSettings] | `object` | `optional` The settings passed to `updateSettings()`. |


