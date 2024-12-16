---
id: h5waqmlx
title: Column component
metaTitle: Column component - React Data Grid | Handsontable
description: Configure the React data grid's columns, using the props of the "HotColumn" component. Pass your component as a custom cell editor or a custom cell renderer.
permalink: /hot-column
canonicalUrl: /hot-column
tags:
  - hotcolumn
searchCategory: Guides
onlyFor: react
category: Columns
---

# Column component

Configure your grid's columns, using the props of the `HotColumn` component. Pass your component as a custom cell editor or a custom cell renderer.

[[toc]]

## Declare column settings

To declare column-specific settings, pass the settings as `HotColumn` props, exactly as you would with `HotTable`.

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/columns/react-hot-column/react/example1.jsx)
@[code](@/content/guides/columns/react-hot-column/react/example1.tsx)

:::

## Object data source

When you use object data binding for `<HotColumn/>`, you need to provide precise information about the data structure for columns. To do so, refer to your object-based data property in `HotColumn`'s `data` prop, for example, `<HotColumn data='id' />`:

::: example #example3 :react --js 1 --ts 2

@[code](@/content/guides/columns/react-hot-column/react/example3.jsx)
@[code](@/content/guides/columns/react-hot-column/react/example3.tsx)

:::
