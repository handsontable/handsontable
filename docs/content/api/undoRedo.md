---
title: UndoRedo
metaTitle: UndoRedo - JavaScript Data Grid | Handsontable
permalink: /api/undo-redo
canonicalUrl: /api/undo-redo
searchCategory: API Reference
hotPlugin: false
editLink: false
id: coyq5h6m
description: Use the UndoRedo plugin with its API options and methods to revert and restore your changes.
react:
  id: t5lpzjly
  metaTitle: UndoRedo - React Data Grid | Handsontable
angular:
  id: i5b4k2ij
  metaTitle: UndoRedo - Angular Data Grid | Handsontable
---

[[toc]]

## Description

Initializes the plugin and registers all built-in undo/redo action handlers for the given Handsontable instance.


## Options

### undo

::: ask-about-api undo|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6500

:::

_undoRedo.undo : boolean_

The `undo` option configures the `UndoRedo` plugin.

You can set the `undo` option to one of the following:

| Setting | Description                                        |
| ------- | -------------------------------------------------- |
| `true`  | Enable the `UndoRedo` plugin  |
| `false` | Disable the `UndoRedo` plugin |

By default, the `undo` option is set to `true`,
To disable the `UndoRedo` plugin completely,
set the `undo` option to `false`.

Read more:
- [Undo and redo](@/guides/accessories-and-menus/undo-redo/undo-redo.md)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Example**  
```js
// enable the `UndoRedo` plugin
undo: true,
```

## Members

### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L82

:::

_UndoRedo.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L87

:::

_UndoRedo.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SETTING_KEYS

::: ask-about-api SETTING_KEYS|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L92

:::

_UndoRedo.SETTING\_KEYS_

Returns whether the plugin handles its own settings keys without a dedicated key list.


## Methods

### clear

::: ask-about-api clear|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L321

:::

_undoRedo.clear()_

Clears undo and redo history.



### destroy

::: ask-about-api destroy|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L327

:::

_undoRedo.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L115

:::

_undoRedo.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### done

::: ask-about-api done|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L210

:::

_undoRedo.done(wrappedAction, [source])_

Stash information about performed actions.

**Emits**: [`Hooks#event:beforeUndoStackChange`](@/api/hooks.md#beforeundostackchange), [`Hooks#event:afterUndoStackChange`](@/api/hooks.md#afterundostackchange), [`Hooks#event:beforeRedoStackChange`](@/api/hooks.md#beforeredostackchange), [`Hooks#event:afterRedoStackChange`](@/api/hooks.md#afterredostackchange)  
**Example**  
```js
// Register a custom action, for example when setting cell metadata directly
// (a change that UndoRedo doesn't track by default).
function setCellBackgroundColor(row, col, className) {
  const undoRedo = hot.getPlugin('undoRedo');
  const previousClassName = hot.getCellMeta(row, col).className;

  undoRedo.done(() => ({
    actionType: 'cellBackgroundColor',
    undo(instance, callback) {
      instance.setCellMeta(row, col, 'className', previousClassName);
      instance.render();
      callback();
    },
    redo(instance, callback) {
      instance.setCellMeta(row, col, 'className', className);
      instance.render();
      callback();
    },
  }), 'cellBackgroundColor');

  hot.setCellMeta(row, col, 'className', className);
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

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L105

:::

_undoRedo.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled

::: ask-about-api isEnabled|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L100

:::

_undoRedo.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [UndoRedo#enablePlugin](@/api/undoRedo.md#enableplugin) method is called.



### isRedoAvailable

::: ask-about-api isRedoAvailable|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L316

:::

_undoRedo.isRedoAvailable() ⇒ boolean_

Checks if redo action is available.


**Returns**: `boolean` - Return `true` if redo can be performed, `false` otherwise.  

### isUndoAvailable

::: ask-about-api isUndoAvailable|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L309

:::

_undoRedo.isUndoAvailable() ⇒ boolean_

Checks if undo action is available.


**Returns**: `boolean` - Return `true` if undo can be performed, `false` otherwise.  

### redo

::: ask-about-api redo|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L274

:::

_undoRedo.redo()_

Redo the previous action performed to the table (used to reverse an undo).

**Emits**: [`Hooks#event:beforeUndoStackChange`](@/api/hooks.md#beforeundostackchange), [`Hooks#event:afterUndoStackChange`](@/api/hooks.md#afterundostackchange), [`Hooks#event:beforeRedoStackChange`](@/api/hooks.md#beforeredostackchange), [`Hooks#event:afterRedoStackChange`](@/api/hooks.md#afterredostackchange), [`Hooks#event:beforeRedo`](@/api/hooks.md#beforeredo), [`Hooks#event:afterRedo`](@/api/hooks.md#afterredo)  


### undo

::: ask-about-api undo|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L242

:::

_undoRedo.undo()_

Undo the last action performed to the table.

**Emits**: [`Hooks#event:beforeUndoStackChange`](@/api/hooks.md#beforeundostackchange), [`Hooks#event:afterUndoStackChange`](@/api/hooks.md#afterundostackchange), [`Hooks#event:beforeRedoStackChange`](@/api/hooks.md#beforeredostackchange), [`Hooks#event:afterRedoStackChange`](@/api/hooks.md#afterredostackchange), [`Hooks#event:beforeUndo`](@/api/hooks.md#beforeundo), [`Hooks#event:afterUndo`](@/api/hooks.md#afterundo)  

