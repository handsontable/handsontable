---
title: Migrating from 11.1 to 12.0
metaTitle: Migrating from 11.1 to 12.0 - Guide - Handsontable Documentation
permalink: /next/migration-from-11.1-to-12.0
canonicalUrl: /migration-from-11.1-to-12.0
pageClass: migration-guide
---

# Migrating from 11.1 to 12.0

[[toc]]

To upgrade your Handsontable version from 11.x.x to 12.x.x, follow this guide.

## Step 1: Verify your `updateSettings()` calls

Handsontable 12.0.0 changes how the [`updateSettings()`](@/api/core.md#updatesettings) method handles your grid's [`data`](@/api/options.md#data).

Each [`updateSettings()`](@/api/core.md#updatesettings) call with the [`data`](@/api/options.md#data) option defined:

| Before                                                            | After                                                                 |
| ----------------------------------------------------------------- | --------------------------------------------------------------------- |
| Replaces [`data`](@/api/options.md#data)                          | Replaces [`data`](@/api/options.md#data)                              |
| Triggers the same hooks as [`loadData()`](@/api/core.md#loaddata) | Triggers the same hooks as [`updateData()`](@/api/core.md#updatedata) |
| Resets configuration options (`CellMeta`)                         | Doesn't reset configuration options (`CellMeta`)                      |
| Resets index mappings                                             | Doesn't reset index mappings                                          |

#### Migrating to Handsontable 12.0

If you need to reset your index mappings and configuration options (`CellMeta`) along with updating your [`data`](@/api/options.md#data):

- Instead of passing the [`data`](@/api/options.md#data) option to the [`updateSettings()`](@/api/core.md#updatesettings) method, run [`loadData()`](@/api/core.md#loadData) and provide the new dataset as its argument:
```js
// Handsontable 12.0: this doesn't reset your cell meta and index mapper configuration
hotInstance.updateSettings({
  data: newDataset
});

// Handsontable 12.0: this does reset your cell meta and index mapper configuration
hotInstance.loadData(newDataset);
```

#### Framework wrappers

Updating your [`data`](@/api/options.md#data) through a component property no longer resets your index mappings and configuration options (`CellMeta`).

To replace [`data`](@/api/options.md#data) and reset the states, call the [`loadData()`](@/api/core.md#loadData) method (the same way as above), referencing the Handsontable instance from the component.

Read more on referencing the Handsontable instance:
- [Referencing the Handsontable instance in Angular](@/guides/integrate-with-angular/angular-hot-reference.md)
- [Referencing the Handsontable instance in React](@/guides/integrate-with-react/react-hot-reference.md)
- [Referencing the Handsontable instance in Vue 2](@/guides/integrate-with-vue/vue-hot-reference.md)
- [Referencing the Handsontable instance in Vue 3](@/guides/integrate-with-vue3/vue3-hot-reference.md)

## Step 2: Adjust to the `updatePlugin()` changes

Handsontable 12.0.0 changes how the [`updatePlugin()`](@/api/autocolumnsize.md#updateplugin) method reacts to [`updateSettings()`](@/api/core.md#updatesettings) calls.

#### Before

Every [`updateSettings()`](@/api/core.md#updatesettings) call (even with an empty object passed as new settings) triggered 
the [`updatePlugin()`](@/api/autocolumnsize.md#updateplugin) method for each enabled plugin.

As a result, whenever you called [`updateSettings()`](@/api/core.md#updatesettings), all enabled plugins got updated.

#### After

A plugin's [`updatePlugin()`](@/api/autocolumnsize.md#updateplugin) method gets triggered only when the object passed to [`updateSettings()`](@/api/core.md#updatesettings) contains at least one of the following:
- The plugin's [`PLUGIN_KEY`](@/guides/building-and-testing/plugins.md#_2-extend-the-baseplugin) (the plugin's main alias)
- An entry from the plugin's [`SETTING_KEYS`](@/api/baseplugin.md#setting-keys) (a property that stores all additional settings relevant to the plugin)

As a result, a plugin gets updated only if you update settings related to that particular plugin.

##### Built-in plugins

The change above affects most of Handsontable's [built-in plugins](@/api/plugins.md) as well.

Starting with Handsontable 12.0.0, a built-in plugin gets updated on a call to [`updateSettings()`](@/api/core.md#updatesettings) only if the passed configuration object contains an option relevant to that particular plugin. For example, the [`Autofill`](@/api/autofill.md) plugin gets updated if your call to [`updateSettings()`](@/api/core.md#updatesettings) updates the [`fillHandle`](@/api/options.md#fillhandle) option.

To find out which options a given plugin observes, see that plugin's [`updatePlugin()` API reference](@/api/autofill.md#updateplugin).

::: tip
The following built-in plugins still get updated on every [`updateSettings()`](@/api/core.md#updatesettings) call:
  - [`AutoColumnSize`](@/api/autocolumnsize.md)
  - [`AutoRowSize`](@/api/autorowsize.md)
  - `TouchScroll`
  - [`UndoRedo`](@/api/undoredo.md)
:::

#### Migrating to Handsontable 12.0

If you want your [custom plugin](@/guides/building-and-testing/plugins.md) to still get updated on every [`updateSettings()`](@/api/core.md#updatesettings) call, set your plugin's [`SETTING_KEYS`](@/api/baseplugin.md#setting-keys) to `true`:

```js
static get SETTING_KEYS() {
  return true;
}
```

However, in most cases, it's better to provide an explicit list of configuration options that your custom plugin observes. For details, see the [Plugins](@/guides/building-and-testing/plugins.md) guide.

## Step 3: Adjust to the `afterDocumentKeyDown` changes

Handsontable 12.0.0 changes how the [`afterDocumentKeyDown`](@/api/hooks.md#afterdocumentkeydown) hook works.

#### Before

When you used a keyboard to navigate an internal Handsontable instance (e.g., a context menu), the [`afterDocumentKeyDown`](@/api/hooks.md#afterdocumentkeydown) hook got fired on every key press.

```js
afterDocumentKeyDown() {
  // when you navigate the grid, the console message gets logged on every key press
  // when you navigate the context menu, the console message also gets logged on every key press
  console.log('key pressed');
}
```

#### After

When you use a keyboard to navigate some internal instances of Handsontable (e.g., a context menu) hook may not get fired anymore.

```js
afterDocumentKeyDown() {
  // when you navigate the grid, the console message gets logged on every key press
  // when you navigate the context menu, the console message doesn't get logged at all
  console.log('key pressed');
}
```

This change may affect the following areas of Handsontable:
- [Context menu](@/api/contextmenu.md)
- [Dropdown menu](@/api/dropdownmenu.md)

#### Migrating to Handsontable 12.0

You can't change this behavior by using any of Handsontable's APIs.

## Step 4: Adjust to the default keyboard shortcuts changes

::: tip
These changes don't affect your custom keyboard shortcuts.
:::

Handsontable 12.0 introduces a new keyboard shortcuts API, [`ShortcutManager`](@/api/shortcutmanager.md).

[`ShortcutManager`](@/api/shortcutmanager.md) lets you easily manage your custom keyboard shortcuts,
but also changes how Handsontable defines its default keyboard shortcuts.
Now, nearly all default keyboard shortcuts are defined explicitly.

We took this opportunity to improve the behavior of Handsontable's default keyboard shortcuts, so they:
- Better match their counterparts in popular spreadsheet software
- Improve the consistency of keyboard navigation
- Create a more intuitive user experience

#### The Meta key (<kbd>Ctrl</kbd> vs <kbd>Cmd</kbd>)

Handsontable 12.0 splits the cross-platform Meta key (<kbd>Ctrl</kbd>/<kbd>Cmd</kbd>) into two separate keys.
Now, in most cases, the <kbd>Cmd</kbd> key works only on macOS, and the <kbd>Ctrl</kbd> key works only on Windows.

For example, the table below shows how this change affects the <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>A</kbd> shortcut:

|         | Before                                                                      | After                                     |
| ------- | --------------------------------------------------------------------------- | ----------------------------------------- |
| Windows | <kbd>Ctrl</kbd> + <kbd>A</kbd> works<br><kbd>Cmd</kbd> + <kbd>A</kbd> works | Only <kbd>Ctrl</kbd> + <kbd>A</kbd> works |
| macOS   | <kbd>Ctrl</kbd> + <kbd>A</kbd> works<br><kbd>Cmd</kbd> + <kbd>A</kbd> works | Only <kbd>Cmd</kbd> + <kbd>A</kbd> works  |

::: tip
The default keyboard shortcut for [merging cells](#keyboard-shortcuts-changes-cell-merging) is an exception: <kbd>Cmd</kbd> + <kbd>M</kbd> doesn't work anymore, as it conflicted with macOS's shortcut for window minimizing.
:::

#### Keyboard shortcuts changes: Navigation

The table below summarizes default keyboard shortcuts changes related to navigation:

| Windows                                   | macOS                                    | Before                                        | After                                                            |
| ----------------------------------------- | ---------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------- |
| <kbd>**Ctrl**</kbd> + <kbd>**↑**</kbd>    | <kbd>**Cmd**</kbd> + <kbd>**↑**</kbd>    | Extend the selection by one cell up           | Move to the first cell of the current column                     |
| <kbd>**Ctrl**</kbd> + <kbd>**↓**</kbd>    | <kbd>**Cmd**</kbd> + <kbd>**↓**</kbd>    | Extend the selection by one cell down         | Move to the last cell of the current column                      |
| <kbd>**Ctrl**</kbd> + <kbd>**←**</kbd>    | <kbd>**Cmd**</kbd> + <kbd>**←**</kbd>    | Extend the selection by one cell to the left  | Move to the leftmost cell of the current row                     |
| <kbd>**Ctrl**</kbd> + <kbd>**→**</kbd>    | <kbd>**Cmd**</kbd> + <kbd>**→**</kbd>    | Extend the selection by one cell to the right | Move to the rightmost cell of the current row                    |
| <kbd>**Home**</kbd>                       | <kbd>**Home**</kbd>                      | Move to the first cell of the current row     | Move to the first non-frozen cell of the current row<sup>*</sup> |
| <kbd>**Ctrl**</kbd> + <kbd>**Home**</kbd> | <kbd>**Cmd**</kbd> + <kbd>**Home**</kbd> | Move to the first cell of the current column  | Move to the first non-frozen cell of the grid<sup>*</sup>        |
| <kbd>**End**</kbd>                        | <kbd>**End**</kbd>                       | Move to the last cell of the current row      | Move to the last non-frozen cell of the current row<sup>*</sup>  |
| <kbd>**Ctrl**</kbd> + <kbd>**End**</kbd>  | <kbd>**Cmd**</kbd> + <kbd>**End**</kbd>  | Move to the last cell of the current column   | Move to the last non-frozen cell of the grid<sup>*</sup>         |

<sup>*</sup> This action depends on your [layout direction](@/guides/internationalization/layout-direction.md).

#### Keyboard shortcuts changes: Selection

The table below summarizes default keyboard shortcuts changes related to selection:

| Windows                                                          | macOS                                                           | Before                                                       | After                                                                                                               |
| ---------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| <kbd>**Ctrl**</kbd> + <kbd>**Shift**</kbd> + <kbd>**↑**</kbd>    | <kbd>**Cmd**</kbd> + <kbd>**Shift**</kbd> + <kbd>**↑**</kbd>    | Extend the selection by one cell up                          | Extend the selection to the first cell of the current column<sup>**</sup>                                           |
| <kbd>**Ctrl**</kbd> + <kbd>**Shift**</kbd> + <kbd>**↓**</kbd>    | <kbd>**Cmd**</kbd> + <kbd>**Shift**</kbd> + <kbd>**↓**</kbd>    | Extend the selection by one cell down                        | Extend the selection to the last cell of the current column<sup>**</sup>                                            |
| <kbd>**Ctrl**</kbd> + <kbd>**Shift**</kbd> + <kbd>**←**</kbd>    | <kbd>**Cmd**</kbd> + <kbd>**Shift**</kbd> + <kbd>**←**</kbd>    | Extend the selection by one cell to the left                 | Extend the selection to the leftmost cell of the current row<sup>**</sup>                                           |
| <kbd>**Ctrl**</kbd> + <kbd>**Shift**</kbd> + <kbd>**→**</kbd>    | <kbd>**Cmd**</kbd> + <kbd>**Shift**</kbd> + <kbd>**→**</kbd>    | Extend the selection by one cell to the right                | Extend the selection to the rightmost cell of the current row<sup>**</sup>                                          |
| <kbd>**Ctrl**</kbd> + <kbd>**Shift**</kbd> + <kbd>**Home**</kbd> | <kbd>**Cmd**</kbd> + <kbd>**Shift**</kbd> + <kbd>**Home**</kbd> | Extend the selection to the first cell of the current column | Doesn't work anymore (replaced by <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd> + <kbd>**Shift**</kbd> + <kbd>**↑**</kbd>) |
| <kbd>**Ctrl**</kbd> + <kbd>**Shift**</kbd> + <kbd>**End**</kbd>  | <kbd>**Cmd**</kbd> + <kbd>**Shift**</kbd> + <kbd>**End**</kbd>  | Extend the selection to the last cell of the current column  | Doesn't work anymore (replaced by <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd> + <kbd>**Shift**</kbd> + <kbd>**↓**</kbd>) |
| <kbd>**Shift**</kbd> + <kbd>**Page Up**</kbd>                    | <kbd>**Shift**</kbd> + <kbd>**Page Up**</kbd>                   | Move one screen up                                           | Extend the selection by one screen up                                                                               |
| <kbd>**Shift**</kbd> + <kbd>**Page Down**</kbd>                  | <kbd>**Shift**</kbd> + <kbd>**Page Down**</kbd>                 | Move one screen down                                         | Extend the selection by one screen down                                                                             |
| <kbd>**Ctrl**</kbd> + <kbd>**Enter**</kbd>                       | <kbd>**Cmd**</kbd> + <kbd>**Enter**</kbd>                       | Enter the editing mode of the active cell                    | Fill the selected range of cells with the value of the active cell                                                  |

<sup>**</sup> In case of multiple selection layers, only the last selection layer gets extended.

#### Keyboard shortcuts changes: Edition

The table below summarizes default keyboard shortcuts changes related to edition:

| Windows                                                       | macOS                                                        | Before                                        | After                                                    |
| ------------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------- | -------------------------------------------------------- |
| <kbd>**Home**</kbd>                                           | <kbd>**Home**</kbd>                                          | Native browser behavior for the entire window | Move the cursor to the beginning of the text<sup>*</sup> |
| <kbd>**End**</kbd>                                            | <kbd>**End**</kbd>                                           | Native browser behavior for the entire window | Move the cursor to the end of the text<sup>*</sup>       |
| <kbd>**Ctrl**</kbd> + <kbd>**Z**</kbd>                        | <kbd>**Cmd**</kbd> + <kbd>**Z**</kbd>                        | Undo the last action                          | Undo the last action in the cell editor                  |
| <kbd>**Ctrl**</kbd> + <kbd>**Shift**</kbd> + <kbd>**Z**</kbd> | <kbd>**Cmd**</kbd> + <kbd>**Shift**</kbd> + <kbd>**Z**</kbd> | Redo the last action                          | Redo the last action in the cell editor                  |
| <kbd>**Shift**</kbd> + <kbd>**Page Up**</kbd>                 | <kbd>**Shift**</kbd> + <kbd>**Page Up**</kbd>                | Move one screen up                            | Doesn't work when editing a cell                         |
| <kbd>**Shift**</kbd> + <kbd>**Page Down**</kbd>               | <kbd>**Shift**</kbd> + <kbd>**Page Down**</kbd>              | Move one screen down                          | Doesn't work when editing a cell                         |

<sup>*</sup> This action depends on your layout direction.

#### Keyboard shortcuts changes: Cell merging

The table below summarizes default keyboard shortcuts changes related to cell merging:

|         | Before                                                                   | After                                                                                                                            |
| ------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Windows | <kbd>Ctrl</kbd> + <kbd>M</kbd> works <kbd>Cmd</kbd> + <kbd>M</kbd> works | Only <kbd>Ctrl</kbd> + <kbd>M</kbd> works                                                                                        |
| macOS   | <kbd>Ctrl</kbd> + <kbd>M</kbd> works <kbd>Cmd</kbd> + <kbd>M</kbd> works | Only <kbd>Ctrl</kbd> + <kbd>M</kbd> works<br>(<kbd>Cmd</kbd> + <kbd>M</kbd> conflicted with macOS's shortcut for window minimizing) |

#### Migrating to Handsontable 12.0

To keep the previous (pre-12.0) behavior of a default keyboard shortcut, use the new [`ShortcutManager`](@/api/shortcutmanager.md) API to:
- [Add a custom keyboard shortcut](@/guides/accessories-and-menus/keyboard-shortcuts.md#adding-a-custom-keyboard-shortcut)
- [Remove a default keyboard shortcut](@/guides/accessories-and-menus/keyboard-shortcuts.md#removing-a-keyboard-shortcut)
- [Replace a default keyboard shortcut](@/guides/accessories-and-menus/keyboard-shortcuts.md#replacing-a-keyboard-shortcut)
- [Block a default keyboard shortcut's action](@/guides/accessories-and-menus/keyboard-shortcuts.md#blocking-a-keyboard-shortcut-s-actions)