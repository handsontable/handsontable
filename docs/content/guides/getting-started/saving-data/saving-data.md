---
id: 7js3d370
title: Saving data
metaTitle: Saving data - JavaScript Data Grid | Handsontable
description: Saving data after each change to the data set, using Handsontable's API hooks. Preserve the table's state by saving data to the local storage.
permalink: /saving-data
canonicalUrl: /saving-data
tags:
  - load and save
  - server
  - ajax
react:
  id: rib1rhmf
  metaTitle: Saving data - React Data Grid | Handsontable
searchCategory: Guides
category: Getting started
---

# Saving data

Save data after each change to the data set, using Handsontable's API hooks. Preserve the table's state by saving data to the local storage.

[[toc]]

## Save changes using a callback

To track changes made in your data grid, use Handsontable's [`afterChange`](@/api/hooks.md#afterchange) hook.

The example below handles data by using `fetch`. Note that this is just a mockup, and nothing is actually saved. You need to implement the server-side part by yourself.

::: only-for javascript

::: example #example1 --html 1 --js 2 --ts 3

@[code](@/content/guides/getting-started/saving-data/javascript/example1.html)
@[code](@/content/guides/getting-started/saving-data/javascript/example1.js)
@[code](@/content/guides/getting-started/saving-data/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/getting-started/saving-data/react/example1.jsx)
@[code](@/content/guides/getting-started/saving-data/react/example1.tsx)

:::

:::

## Save data locally

You can save any type of data in local storage to preserve the table state after page reloads. The [`persistentState`](@/api/options.md#persistentstate) option must be set to `true` to enable the data storage mechanism. You can set it either during the Handsontable initialization or using the [`updateSettings()`](@/api/core.md#updatesettings) method.

Persistent state storage is particularly useful when running multiple instances of Handsontable on one page as it allows data separation per each instance.

When the [`persistentState`](@/api/options.md#persistentstate) option is enabled, the [`PersistentState`](@/api/persistentState.md) plugin exposes hooks listed below:

- [`persistentStateSave`](@/api/hooks.md#persistentstatesave)
- [`persistentStateLoad`](@/api/hooks.md#persistentstateload)
- [`persistentStateReset`](@/api/hooks.md#persistentstatereset)

## [`PersistentState`](@/api/persistentState.md) vs `localStorage`

The main benefit of using the [`PersistentState`](@/api/persistentState.md) plugin hooks rather than the regular `localStorage` API is that it ensures separation of data stored by multiple Handsontable instances. For example, if you have two or more instances of Handsontable on one page, data saved by one instance will be inaccessible to the second instance. Those two instances can store data under the same key, and no data would be overwritten.

For the data separation to work properly, make sure that each instance of Handsontable has a unique `id`.

## Related API reference

- Configuration options:
  - [`persistentState`](@/api/options.md#persistentstate)
- Core methods:
  - [`updateSettings()`](@/api/core.md#updatesettings)
- Hooks:
  - [`afterCellMetaReset`](@/api/hooks.md#aftercellmetareset)
  - [`afterChange`](@/api/hooks.md#afterchange)
  - [`persistentStateLoad`](@/api/hooks.md#persistentstateload)
  - [`persistentStateReset`](@/api/hooks.md#persistentstatereset)
  - [`persistentStateSave`](@/api/hooks.md#persistentstatesave)
- Plugins:
  - [`PersistentState`](@/api/persistentState.md)
