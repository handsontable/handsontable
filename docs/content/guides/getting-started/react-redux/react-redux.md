---
type: tutorial
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
In this tutorial, you will connect a Handsontable grid to a Redux store. You will learn to dispatch actions on cell changes and sync grid data with global state.

[[toc]]

## Integrate with Redux

::: tip

Before using any state management library, make sure you know how Handsontable handles data: see the [Binding to data](@/guides/getting-started/binding-to-data/binding-to-data.md#understand-binding-as-a-reference) page.

:::

The following example implements the `@handsontable/react-wrapper` component with a [`readOnly`](@/api/options.md#readonly) toggle switch and the Redux state manager.

## Simple example

::: example #example1 :react-redux --js 1 --ts 2 --deps redux@4 react-redux@7.2.4

@[code](@/content/guides/getting-started/react-redux/react/example1.jsx)
@[code](@/content/guides/getting-started/react-redux/react/example1.tsx)

:::

::: tip

The reducer above returns the previous state object when no value actually changed. Keep that guard in your own reducer.

Not every change comes from the user. Plugins write to the grid as well: [`mergeCells`](@/api/options.md#mergecells) clears the cells that a merge area covers. Those writes reach [`beforeChange`](@/api/hooks.md#beforechange) too, and the hook's second argument tells you where a change came from -- `'edit'` for a user edit, and the plugin's registered name for a plugin write. That name is capitalized, so the merge plugin's writes arrive as `'MergeCells'`, not `'mergeCells'`:

```js
const onBeforeHotChange = (changes, source) => {
  if (source === 'MergeCells') {
    // decide here whether these belong in your store
  }
  // ...
};
```

See [Definition for `source` argument](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument) for the full list.

A reducer that returns a new state object on every action re-renders the component, which resends the settings to the grid. Without the guard, a plugin write and a re-render can keep triggering each other.

:::

## Advanced example

This example shows:
- A [custom editor](@/guides/cell-functions/cell-editor/cell-editor.md#component-based-editors) component (built with an external dependency, `HexColorPicker`). This component acts both as an editor and as a renderer.
- A [custom renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md#declare-a-custom-renderer-as-a-component) component, built with a local `StarRating` component.

The editor component changes the behavior of the renderer component, by passing information through Redux (and the `connect()` method of `react-redux`).

::: example #example6 :react-advanced --js 1 --ts 2 --deps redux@4 react-redux@7.2.4 react-colorful@5.5.1

@[code](@/content/guides/getting-started/react-redux/react/example6.jsx)
@[code](@/content/guides/getting-started/react-redux/react/example6.tsx)

:::

## What you learned

- You can connect a `HotTable` component to a Redux store using `react-redux`'s `connect()` method.
- The `beforeChange` hook dispatches Redux actions whenever a cell changes, keeping global state in sync.
- A reducer that returns the previous state when nothing changed keeps plugin writes from looping with re-renders.
- Custom editor and renderer components can read from and write to the Redux store, enabling grid cells to reflect shared application state.

## Next steps

- [Binding to data](@/guides/getting-started/binding-to-data/binding-to-data.md) -- understand how Handsontable binds to different data structures.
- [Saving data](@/guides/getting-started/saving-data/saving-data.md) -- learn additional patterns for persisting grid changes.
