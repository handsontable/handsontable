---
type: tutorial
id: jnwpo47i
title: Demo
metaTitle: Demo - JavaScript Data Grid | Handsontable
description: Play around with a demo of Handsontable, in your favorite framework.
permalink: /demo
canonicalUrl: /demo
tags:
  - demo
  - hello world
react:
  id: ccqbm8hn
  metaTitle: Demo - React Data Grid | Handsontable
  description: Play around with a demo of Handsontable in React.
angular:
  id: i2n378hh
  metaTitle: Demo - Angular Data Grid | Handsontable
  description: Play around with a demo of Handsontable in Angular.
vue:
  id: c104k1nn
  metaTitle: Demo - Vue Data Grid | Handsontable
searchCategory: Guides
category: Getting started
---
Explore Handsontable core features in this interactive demo. Click cells, sort columns, and use the context menu to see what the grid can do.

[[toc]]

::: only-for javascript
::: example-without-tabs #example
@[code collapse={9-108}](@/content/guides/getting-started/demo/javascript/example.js)
:::
:::

::: only-for react
::: example-without-tabs #example2 :react
@[code](@/content/guides/getting-started/demo/react/example2.html)
@[code](@/content/guides/getting-started/demo/react/example2.css)
@[code](@/content/guides/getting-started/demo/react/example2.jsx)
:::
:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/getting-started/demo/angular/example1.ts)
@[code](@/content/guides/getting-started/demo/angular/example1.html)

:::

:::

::: only-for vue

::: example-without-tabs #example3 :vue

@[code](@/content/guides/getting-started/demo/vue/example3.vue)

:::

:::

## Find the code on GitHub

<div class="boxes-list gray">

- [JavaScript demo app](https://github.com/handsontable/handsontable/tree/prod-docs/{{$currentVersion}}/examples/next/docs/js/demo/)
- [TypeScript demo app](https://github.com/handsontable/handsontable/tree/prod-docs/{{$currentVersion}}/examples/next/docs/ts/demo/)
- [Angular demo app](https://github.com/handsontable/handsontable/tree/prod-docs/{{$currentVersion}}/examples/next/docs/angular-wrapper/demo/)
- [React demo app](https://github.com/handsontable/handsontable/tree/prod-docs/{{$currentVersion}}/examples/next/docs/react-wrapper/demo/)
- [Vue demo app](https://github.com/handsontable/handsontable/tree/prod-docs/{{$currentVersion}}/examples/next/docs/vue3/demo/)

</div>

## Try out the demo's features

Explore the demo and discover Handsontable's most popular features:

<div class="boxes-list">

- [Context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)
- [Dropdown cell type](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md)
- [Column groups](@/guides/columns/column-groups/column-groups.md)
- [Column menu](@/guides/columns/column-menu/column-menu.md)
- [Column filter](@/guides/columns/column-filter/column-filter.md)
- [Column hiding](@/guides/columns/column-hiding/column-hiding.md)
- [Rows sorting](@/guides/rows/rows-sorting/rows-sorting.md)

</div>

## Edit the demo's source code

You can:

- View the complete source code behind your framework's demo
- Run your framework's demo on your local machine
- Fork the directory with your framework's demo, and add changes of your own

Just select your framework from the demo above.

## What you learned

- Handsontable renders an interactive spreadsheet-like grid directly in the browser.
- Built-in features include the context menu, dropdown cell types, column groups, column filtering, column hiding, and row sorting.
- The grid is available for JavaScript, TypeScript, React, Angular, and Vue 3.

## Next steps

- [Installation](@/guides/getting-started/installation/installation.md) -- add Handsontable to your own project.
- [Binding to data](@/guides/getting-started/binding-to-data/binding-to-data.md) -- connect the grid to your data source.
