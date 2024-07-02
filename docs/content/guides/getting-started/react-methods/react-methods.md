---
id: dceorl8m
title: Instance methods
metaTitle: Instance methods - JavaScript Data Grid | Handsontable
description: Reference a Handsontable instance from within a React component, to programmatically perform actions such as selecting cells.
permalink: /instance-methods
canonicalUrl: /instance-methods
tags:
  - referring
  - referencing
  - ref
  - instance
  - methods
react:
  metaTitle: Instance methods - React Data Grid | Handsontable
searchCategory: Guides
onlyFor: react
category: Getting started
---

# Instance methods

Reference a Handsontable instance from within a React component, to programmatically perform actions such as selecting cells.

[[toc]]

## Use Handsontable's API

You can programmatically change the internal state of Handsontable beyond what's possible with props. To do that, call API methods of the relevant Handsontable instance associated with your instance of the [`HotTable`](@/guides/getting-started/installation/installation.md#_4-use-the-hottable-component) component.

The following example implements the [`HotTable`](@/guides/getting-started/installation/installation.md#_4-use-the-hottable-component) component showing how to reference the Handsontable instance from the wrapper component.

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/getting-started/react-methods/react/example1.jsx)
@[code](@/content/guides/getting-started/react-methods/react/example1.tsx)

:::
