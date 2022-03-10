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

Handsontable [12.0.0](https://github.com/handsontable/handsontable/releases/tag/12.0.0) changes the way the [`updateSettings()`](@/api/core.md#updatesettings) method handles your grid's [`data`](@/api/options.md#data).

#### Before

[`updateSettings()`](@/api/core.md#updatesettings) calls that included the [`data`](@/api/options.md#data) option automatically reset Handsontable's [index mappings](@/api/indexmapper.md) and [configuration options](@/guides/getting-started/setting-options.md) (`CellMeta`).

#### After

[`updateSettings()`](@/api/core.md#updatesettings) calls that include the [`data`](@/api/options.md#data) option don't automatically reset Handsontable's [index mappings](@/api/indexmapper.md) and [configuration options](@/guides/getting-started/setting-options.md) (`CellMeta`).

This table summarizes the changes:

| Type of call                                                                                                                                  | Before                                                                                                                                                                                                                                               | After                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <span style="white-space: nowrap;">[`updateSettings()`](@/api/core.md#updatesettings)</span><br> with [`data`](@/api/options.md#data) defined | <ul><li>Always replaces [`data`](@/api/options.md#data) using [`loadData()`](@/api/core.md#loaddata)</li><li>[Options](@/guides/getting-started/setting-options.md) are reset</li><li>Index mappings are reset</li></ul>                             | <ul><li>At initialization, replaces [`data`](@/api/options.md#data) using [`loadData()`](@/api/core.md#loaddata)</li><li>After initialization, replaces [`data`](@/api/options.md#data) using [`updateData()`](@/api/core.md#updatedata)</li><li>[Options](@/guides/getting-started/setting-options.md) are not reset</li><li>Index mappings are not reset</li></ul> |
| <span style="white-space: nowrap;">[`loadData()`](@/api/core.md#loaddata)</span>                                                              | Hooks triggered:<ul><li>[`beforeLoadData`](@/api/hooks.md#beforeloaddata)</li><li>[`afterLoadData`](@/api/hooks.md#afterloaddata)</li><li>[`afterChange`](@/api/hooks.md#afterchange), with the `source` argument declared as `loadData`</li></ul> | Same as before                                                                                                                                                                                                                                                                                                                                                       |
| <span style="white-space: nowrap;">[`updateData()`](@/api/core.md#updatedata)</span>                                                          | N/A                                                                                                                                                                                                                                                  | Hooks triggered:<ul><li>[`beforeLoadData`](@/api/hooks.md#beforeloaddata)</li><li>[`afterLoadData`](@/api/hooks.md#afterloaddata)</li><li>[`afterChange`](@/api/hooks.md#afterchange), with the `source` argument declared as `updateData`</li></ul>                                                                                                               |

#### Migrating to Handsontable 12.0

If you need to reset your [index mappings](@/api/indexmapper.md) and [configuration options](@/guides/getting-started/setting-options.md) (`CellMeta`) along with updating your [`data`](@/api/options.md#data):

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

Updating your [`data`](@/api/options.md#data) through a component property no longer resets your [index mappings](@/api/indexmapper.md) and [configuration options](@/guides/getting-started/setting-options.md) (`CellMeta`).

To replace [`data`](@/api/options.md#data) and reset the states, call the [`loadData()`](@/api/core.md#loadData) method (the same way as above), referencing the Handsontable instance from the component.

Read more on referencing the Handsontable instance:
- [Referencing the Handsontable instance in Angular](@/guides/integrate-with-angular/angular-hot-reference.md)
- [Referencing the Handsontable instance in React](@/guides/integrate-with-react/react-hot-reference.md)
- [Referencing the Handsontable instance in Vue 2](@/guides/integrate-with-vue/vue-hot-reference.md)
- [Referencing the Handsontable instance in Vue 3](@/guides/integrate-with-vue3/vue3-hot-reference.md)

## Step 2: Adjust to the `updatePlugin()` changes

Handsontable [12.0.0](https://github.com/handsontable/handsontable/releases/tag/12.0.0) changes the way the [`updatePlugin()`](@/api/autocolumnsize.md#updateplugin) method reacts to [`updateSettings()`](@/api/core.md#updatesettings) calls.

#### Before

Every [`updateSettings()`](@/api/core.md#updatesettings) call (even with an empty object passed as new settings) triggered 
the [`updatePlugin()`](@/api/autocolumnsize.md#updateplugin) method for each enabled plugin.

As a result, whenever you called [`updateSettings()`](@/api/core.md#updatesettings), all enabled plugins got updated.

#### After

A plugin gets updated only if you update settings related to that particular plugin.

Only the following plugins still get updated on every [`updateSettings()`](@/api/core.md#updatesettings) call:
  - [`AutoColumnSize`](@/api/autocolumnsize.md)
  - [`AutoRowSize`](@/api/autorowsize.md)
  - `TouchScroll`
  - [`UndoRedo`](@/api/undoredo.md)

#### Migrating to Handsontable 12.0

If you want a plugin (e.g. [`ContextMenu`](@/api/contextmenu.md)) to still get updated every time you call [`updateSettings()`](@/api/core.md#updatesettings), use the [`afterUpdateSettings`](@/api/hooks.md#afterupdatesettings) hook to call your plugin's [`updatePlugin()`](@/api/autocolumnsize.md#updateplugin) method:

```js
afterUpdateSettings() {
  contextMenu.updatePlugin();
}
```

## Step 3: Adjust to the `afterDocumentKeyDown` changes

Handsontable [12.0.0](https://github.com/handsontable/handsontable/releases/tag/12.0.0) changes the way the [`afterDocumentKeyDown`](@/api/hooks.md#afterdocumentkeydown) hook works.

#### Before

When you used a keyboard to navigate an internal Handsontable instance (e.g. a [context menu](@/guides/accessories-and-menus/context-menu.md)), the [`afterDocumentKeyDown`](@/api/hooks.md#afterdocumentkeydown) hook got fired on every key press.

```js
afterDocumentKeyDown() {
  // when you navigate the grid, the console message gets logged on every key press
  // when you navigate the context menu, the console message also gets logged on every key press
  console.log('key pressed');
}
```

#### After

When you use a keyboard to navigate some internal instances of Handsontable (e.g. a [context menu](@/guides/accessories-and-menus/context-menu.md)), the [`afterDocumentKeyDown`](@/api/hooks.md#afterdocumentkeydown) hook may not get fired anymore.

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
