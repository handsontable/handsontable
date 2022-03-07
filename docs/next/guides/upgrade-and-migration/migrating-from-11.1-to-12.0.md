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

## Step 1: `updateSettings()` changes

Handsontable [12.0.0](https://github.com/handsontable/handsontable/releases/tag/12.0.0) changes the way the [`updateSettings()`](@/api/core.md#updatesettings) method handles your grid's [`data`](@/api/options.md#data).

#### Before

Every [`updateSettings()`](@/api/core.md#updatesettings) call that included [`data`](@/api/options.md#data), triggered the [`loadData()`](@/api/core.md#loaddata) method. This caused Handsontable's [indexes](@/api/indexmapper.md) and [configuration options](@/guides/getting-started/setting-options.md) to reset.

#### After

Instead of calling [`loadData()`](@/api/core.md#loaddata), [`updateSettings()`](@/api/core.md#updatesettings) now uses the [`updateData()`](@/api/core.md#updatedata) method (introduced in Handsontable [11.1.0](https://github.com/handsontable/handsontable/releases/tag/11.1.0)).

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
// Handsontable 11: the first column's cells are copyable again
// Handsontable 12: the first column's cells still aren't copyable
```

#### What to do

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

## Step 2: `updatePlugin()` changes

Handsontable [12.0.0](https://github.com/handsontable/handsontable/releases/tag/12.0.0) changes the way the [`updatePlugin()`](@/api/core.md#updateplugin) method reacts to [`updateSettings()`](@/api/core.md#updatesettings) calls.

#### Before

Every [`updateSettings()`](@/api/core.md#updatesettings) call (even with an empty object passed as new settings) triggered 
the [`updatePlugin()`](@/api/autocolumnsize.md#updateplugin) method of each enabled plugin.

As a result, whenever you called [`updateSettings()`](@/api/core.md#updatesettings), all enabled plugins got updated.

#### After

A plugin gets updated only if you update settings related to that plugin.

But, the following plugins still update on every [`updateSettings()`](@/api/core.md#updatesettings) call:
  - [`AutoColumnSize`](@/api/autocolumnsize.md)
  - [`AutoRowSize`](@/api/autorowsize.md)
  - [`TouchScroll`](@/api/touchscroll.md)
  - [`UndoRedo`](@/api/undoredo.md)

#### What to do

If you want an enabled plugin (e.g. [`ContextMenu`](@/api/contextmenu.md)) to update every time you call [`updateSettings()`](@/api/core.md#updatesettings), set the [`afterUpdateSettings`](@/api/hooks.md#afterupdatesettings) hook to call your plugin's [`updatePlugin()`](@/api/autocolumnsize.md#updateplugin) method:

```js
hot.addHook('afterUpdateSettings', contextMenu.updatePlugin())
```

## Step 3: shortcutmanager