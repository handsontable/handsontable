---
id: kbk0pm8t
title: Integration with Redux
metaTitle: Integration with Redux - JavaScript Data Grid | Handsontable
description: Maintain the data and configuration options of your grid by using the Redux state container.
permalink: /redux
canonicalUrl: /redux
react:
  metaTitle: Integration with Redux - React Data Grid | Handsontable
  tags:
    - state manager
    - react redux
    - connect component
    - immutable data
    - redux
    - state management
searchCategory: Guides
onlyFor: react
category: Getting started
---

# Integration with Redux

Maintain the data and configuration options of your grid by using the Redux state container.

[[toc]]

## Integrate with Redux

::: tip

Before using any state management library, make sure you know how Handsontable handles data: see the [Binding to data](@/guides/getting-started/binding-to-data/binding-to-data.md#understand-binding-as-a-reference) page.

:::

The following example implements the `@handsontable/react-wrapper` component with a [`readOnly`](@/api/options.md#readonly) toggle switch and the Redux state manager.

## Simple example

::: example #example1 :react-redux --js 1 --ts 2

@[code](@/content/guides/getting-started/react-redux/react/example1.jsx)
@[code](@/content/guides/getting-started/react-redux/react/example1.tsx)

:::

## Advanced example

This example shows:
- A [custom editor](@/guides/cell-functions/cell-editor/cell-editor.md#component-based-editors) component (built with an external dependency, `HexColorPicker`). This component acts both as an editor and as a renderer.
- A [custom renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md#declare-a-custom-renderer-as-a-component) component, built with an external dependency (`StarRatingComponent`).

The editor component changes the behavior of the renderer component, by passing information through Redux (and the `connect()` method of `react-redux`).

::: example #example6 :react-advanced --js 1 --ts 2

@[code](@/content/guides/getting-started/react-redux/react/example6.jsx)
@[code](@/content/guides/getting-started/react-redux/react/example6.tsx)

:::
