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

## Step 1: Verifying your `updateSettings` calls that no longer reset the state

Starting from the version 12.0.0, calling the method [`updateSettings`](@/api/core.md#updateSettings) with the `data` property no longer resets the cell meta cache and index mapper configuration. If your application relied on resetting that information, you will need to make the following change in your app.

As the framework wrappers rely heavily on the [`updateSettings`](@/api/core.md#updateSettings) method to update their settings, this changes the way they react on property and state changes.

### Migrating to 12.0.0
If you need to reset the cell meta and/or index mapper information with the data update, instead of passing the `data` option to the [`updateSettings`](@/api/core.md#updateSettings) method, run [`loadData`](@/api/core.md#loadData) and provide the new dataset as an argument:
```js
// In 12.0.0 this will NOT reset the cell meta and index mapper configuration
hotInstance.updateSettings({
  data: newDataset
});

// In 12.0.0 this WILL reset the cell meta and index mapper configuration
hotInstance.loadData(newDataset);
```

When it comes to using the framework wrappers, updating the data through a component property will no longer reset the state of the index mappers and cell meta. To replace the data along with those, call the [`loadData`](@/api/core.md#loadData) method, analogously to the vanilla version, referencing the Handsontable instance from the component.

For more information on referencing the Handsontable instance, see these guides:
- [Referencing the Handsontable instance in Angular](@/guides/integrate-with-angular/angular-hot-reference.md)
- [Referencing the Handsontable instance in React](@/guides/integrate-with-react/react-hot-reference.md)
- [Referencing the Handsontable instance in Vue 2](@/guides/integrate-with-vue/vue-hot-reference.md)
- [Referencing the Handsontable instance in Vue 3](@/guides/integrate-with-vue3/vue3-hot-reference.md)

#### Summary of the changes:
| | 11.1.0 and earlier | 12.0.0 |
| -- | ---- | ------ |
| <span style="white-space: nowrap;">`updateSettings`</span> | <strong>Called with the `data` option defined:</strong><ul><li>Cell meta being reset after each call</li><li>Index Mappers being reset after each call</li><li>Utilizes the `loadData` method to replace data</li></ul> | <strong>Called with the `data` option defined:</strong><ul><li>Cell meta **NOT** being reset after each call</li><li>Index Mappers **NOT** being reset after each call</li><li>Utilizes the `loadData` method to replace data **only at initialization**</li><li>Utilizes the `updateData` method to replace data in every usage after initialization.</li></ul> |
| <span style="white-space: nowrap;">`loadData`</span> | <strong>Hooks triggered:</strong><ul><li>`beforeLoadData`</li><li>`afterLoadData`</li><li>`afterChange` with the `source` argument declared as `loadData`</li></ul> | No changes compared to `11.1.0`
| <span style="white-space: nowrap;">`updateData`</span> | n/a |  <strong>Hooks triggered:</strong><ul><li>`beforeUpdateData`</li><li>`afterUpdateData`</li><li>`afterChange` with the `source` argument declared as `updateData`</li></ul> | <strong>Hooks triggered:</strong><ul><li>`beforeUpdateData`</li><li>`afterUpdateData`</li><li>`afterChange` with the `source` argument declared as `updateData`</li></ul> -->



