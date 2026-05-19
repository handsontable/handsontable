---
type: how-to
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
angular:
  id: uny2nvqk
  metaTitle: Saving data - Angular Data Grid | Handsontable
searchCategory: Guides
category: Getting started
---
Save data after each change to the data set, using Handsontable's API hooks. Preserve the table's state by saving data to the local storage.

[[toc]]

## Save changes using a callback

To track changes made in your data grid, use Handsontable's [`afterChange`](@/api/hooks.md#afterchange) hook.

The example below handles data by using `fetch`. Note that this is just a mockup, and nothing is actually saved. You need to implement the server-side part by yourself.

::: only-for javascript

::: example #example1 --html 1 --css 2 --js 3 --ts 4

@[code](@/content/guides/getting-started/saving-data/javascript/example1.html)
@[code](@/content/guides/getting-started/saving-data/javascript/example1.css)
@[code](@/content/guides/getting-started/saving-data/javascript/example1.js)
@[code](@/content/guides/getting-started/saving-data/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --css 1 --js 2 --ts 3

@[code](@/content/guides/getting-started/saving-data/react/example1.css)
@[code](@/content/guides/getting-started/saving-data/react/example1.jsx)
@[code](@/content/guides/getting-started/saving-data/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/getting-started/saving-data/angular/example1.ts)
@[code](@/content/guides/getting-started/saving-data/angular/example1.html)

:::

:::

## Save data locally

To persist table state (e.g. column order, column widths, row order) across page reloads, use the browser's [`localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) API or [`sessionStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage) in your application. Listen to the appropriate hooks (e.g. `afterColumnMove`, `afterColumnResize`) and save or restore state as needed.

## Related API reference

**Core methods**

<div class="boxes-list">

- [updateSettings()](@/api/core.md#updatesettings)

</div>

**Hooks**

<div class="boxes-list">

- [afterCellMetaReset](@/api/hooks.md#aftercellmetareset)
- [afterChange](@/api/hooks.md#afterchange)

</div>

## Result

Changes made in the grid are now persisted to your backend or local state on every edit.
