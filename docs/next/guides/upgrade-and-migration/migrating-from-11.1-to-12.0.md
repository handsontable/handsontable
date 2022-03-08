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

## Step 1: `updateSettings()`

Handsontable [12.0.0](https://github.com/handsontable/handsontable/releases/tag/12.0.0) changes the way the [`updateSettings()`](@/api/core.md#updatesettings) method handles your grid's [`data`](@/api/options.md#data).

#### Before

Every [`updateSettings()`](@/api/core.md#updatesettings) call that includes [`data`](@/api/options.md#data), triggers the [`loadData()`](@/api/core.md#loaddata) method. This causes Handsontable's [indexes](@/api/indexmapper.md) and [configuration options](@/guides/getting-started/setting-options.md) to reset.

#### After

Instead of calling [`loadData()`](@/api/core.md#loaddata), [`updateSettings()`](@/api/core.md#updatesettings) uses [`updateData()`](@/api/core.md#updatedata) (a method added in Handsontable [11.1.0](https://github.com/handsontable/handsontable/releases/tag/11.1.0)).

This means that when you change your [`data`](@/api/options.md#data) with [`updateSettings()`](@/api/core.md#updatesettings), your [indexes](@/api/indexmapper.md) and [configuration options](@/guides/getting-started/setting-options.md) stay the same.

For example:

```js
const hot = new Handsontable(container, {
  data: [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
  ],
  columns: [
      {
        // disable copying for every cell of the first column
        copyable: false,
      },
  ],
});

// update `data` and other configuration options
hot.updateSettings({
  width: 400,
  height: 300,
  data: [
    ['A', 'B', 'C'],
    ['D', 'E', 'F'],
    ['G', 'H', 'J']
  ]
});
// Handsontable 11: the first column's cells become copyable again
// Handsontable 12: the first column's cells still aren't copyable
```

#### How to upgrade

If you want to stick to the previous behavior, call [`loadData()`](@/api/core.md#loaddata) separately from updating your other options:

```js
const hot = new Handsontable(container, {
  data: [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
  ],
  columns: [
      {
        // disable copying for every cell of the first column
        copyable: false,
      },
  ],
});

hot.loadData([
    ['A', 'B', 'C'],
    ['D', 'E', 'F'],
    ['G', 'H', 'J']
]);
// the first column's cells are copyable again

// update your other options separately
hot.updateSettings({
  width: 400,
  height: 300,
});
```

## Step 2: `updatePlugin()`

Handsontable [12.0.0](https://github.com/handsontable/handsontable/releases/tag/12.0.0) changes the way the [`updatePlugin()`](@/api/autocolumnsize.md#updateplugin) method reacts to [`updateSettings()`](@/api/core.md#updatesettings) calls.

#### Before

Every [`updateSettings()`](@/api/core.md#updatesettings) call (even with an empty object passed as new settings) triggers 
the [`updatePlugin()`](@/api/autocolumnsize.md#updateplugin) method for each enabled plugin.

As a result, whenever you call [`updateSettings()`](@/api/core.md#updatesettings), all enabled plugins get updated.

#### After

A plugin gets updated only if you update settings related to that particular plugin.

Only the following plugins still get updated on every [`updateSettings()`](@/api/core.md#updatesettings) call:
  - [`AutoColumnSize`](@/api/autocolumnsize.md)
  - [`AutoRowSize`](@/api/autorowsize.md)
  - `TouchScroll`
  - [`UndoRedo`](@/api/undoredo.md)

#### How to upgrade

If you want a plugin (e.g. [`ContextMenu`](@/api/contextmenu.md)) to still get updated every time you call [`updateSettings()`](@/api/core.md#updatesettings), use the [`afterUpdateSettings`](@/api/hooks.md#afterupdatesettings) hook to call your plugin's [`updatePlugin()`](@/api/autocolumnsize.md#updateplugin) method:

```js
afterUpdateSettings() {
  contextMenu.updatePlugin();
}
```

## Step 3: `afterDocumentKeyDown`

Handsontable [12.0.0](https://github.com/handsontable/handsontable/releases/tag/12.0.0) changes the way the [`afterDocumentKeyDown`](@/api/hooks.md#afterdocumentkeydown) hook works.

#### Before

When you use a keyboard to navigate an internal Handsontable instance (e.g. a [context menu](@/guides/accessories-and-menus/context-menu.md)), the [`afterDocumentKeyDown`](@/api/hooks.md#afterdocumentkeydown) hook gets fired on every key press.

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

#### How to upgrade

You can't change this behavior by using any of Handsontable's APIs.
