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

Handsontable 12.0.0 changes the way the [`updateSettings()`](@/api/core.md#updatesettings) method handles your grid's [`data`](@/api/options.md#data).

Each [`updateSettings()`](@/api/core.md#updatesettings) call with the [`data`](@/api/options.md#data) option defined:

| Before                                                             | After                                                                 |
| ------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Replaced [`data`](@/api/options.md#data)                           | Replaces [`data`](@/api/options.md#data)                              |
| Triggered the same hooks as [`loadData()`](@/api/core.md#loaddata) | Triggers the same hooks as [`updateData()`](@/api/core.md#updatedata) |
| Reset configuration options (`CellMeta`)                           | Doesn't reset configuration options (`CellMeta`)                      |
| Reset index mappings                                               | Doesn't reset index mappings                                          |

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

Handsontable 12.0.0 changes the way the [`updatePlugin()`](@/api/autocolumnsize.md#updateplugin) method reacts to [`updateSettings()`](@/api/core.md#updatesettings) calls.

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

Starting with Handsontable 12.0.0, a built-in plugin gets updated on a call to [`updateSettings()`](@/api/core.md#updatesettings) only if the passed configuration object contains an [option](@/api/options.md) relevant to that particular plugin. For example, the [`Autofill`](@/api/autofill.md) plugin gets updated if your call to [`updateSettings()`](@/api/core.md#updatesettings) updates the [`fillHandle`](@/api/options.md#fillhandle) option.

To find out which [options](@/api/options.md) a given plugin observes, see that plugin's [`updatePlugin()` API reference](@/api/autofill.md#updateplugin).

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

Handsontable 12.0.0 changes the way the [`afterDocumentKeyDown`](@/api/hooks.md#afterdocumentkeydown) hook works.

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

When you use a keyboard to navigate some internal instances of Handsontable (e.g. a context menu), the [`afterDocumentKeyDown`](@/api/hooks.md#afterdocumentkeydown) hook may not get fired anymore.

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
