---
type: tutorial
title: Integration with Redux
metaTitle: Integration with Redux | Handsontable DataGrid for JavaScript
description: Maintain the data and configuration options of your grid by using the Redux state container.
permalink: /redux
canonicalUrl: /redux
react:
  metaTitle: Integration with Redux | Handsontable DataGrid for React
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
menuTag: updated
---
In this tutorial, you will connect Handsontable DataGrid to a Redux store. You will learn to dispatch actions on cell changes and sync grid data with global state.

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

Not every change comes from the user. Plugins write to the grid as well: [`mergeCells`](@/api/options.md#mergecells) clears the cells that a merge area covers. Those writes reach [`beforeChange`](@/api/hooks.md#beforechange) too, and the hook's second argument tells you where a change came from -- `'edit'` for a user edit, and the plugin's registered name for a plugin write. That name is capitalized, so the merge plugin's writes arrive as `'MergeCells'`, not `'mergeCells'`. See [Definition for `source` argument](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument) for the full list.

Dispatch those writes like any other change. The example returns `false` from `beforeChange`, so the store is the only thing that can apply them. Drop them and the covered cells keep their values, the plugin tries to clear them again on the next render, and the two keep triggering each other. Use `source` to label a change, not to skip it.

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

## Pass props from state

The React wrapper sends your props to the grid through [`updateSettings()`](@/api/core.md#updatesettings) on every render. Treat every prop as applied again each time the parent component re-renders. The wrapper skips only a few options whose value did not change: `dataSchema`, `colWidths`, `rowHeights`, `minRowHeights`, and `columns` when you pass it as a prop. With `<HotColumn>` children, the wrapper builds `columns` from them and sends it on every render.

A state change in the parent component -- a toggle, a counter, a Redux action -- therefore applies your props again. Three rules keep that harmless.

### Pass `data` by reference

A new `data` array replaces the grid's data and discards the user's edits. Keep the array in a constant, `useState`, or `useMemo`. For the full explanation, see [Binding to data](@/guides/getting-started/binding-to-data/binding-to-data.md#understand-binding-as-a-reference).

### Let the grid own what users change

Some options hold state that the grid changes while users work. [`mergeCells`](@/api/options.md#mergecells) is one of them: users merge cells through the context menu or the API. Every render applies the `mergeCells` prop again, so the merge areas users created disappear on the next state change. This happens even when the array is a constant.

Leave the `mergeCells` prop out. Declare the initial areas once on the [instance](@/guides/getting-started/react-methods/react-methods.md), and turn on the context menu so users can merge:

```jsx
import { useEffect, useRef } from 'react';
import { HotTable } from '@handsontable/react-wrapper';

const data = [
  ['Harbor Goods', 'Seattle', 142],
  ['Alpine Supply Co.', 'Denver', 0],
];

function InventoryGrid() {
  const hotRef = useRef(null);

  useEffect(() => {
    hotRef.current.hotInstance.updateSettings({
      mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }],
    });
  }, []);

  return (
    <HotTable
      // licenseKey="your-license-key" // get a key at https://handsontable.com/pricing/
      ref={hotRef}
      data={data}
      contextMenu
    />
  );
}
```

The wrapper never sends `mergeCells`, so the merges users create stay through every re-render.

Do not copy the merges into state from the [`afterMergeCells`](@/api/hooks.md#aftermergecells) and [`afterUnmergeCells`](@/api/hooks.md#afterunmergecells) hooks and pass them back as the prop. The hooks do not fire for undo and redo, or when inserting and removing rows shifts a merge. State then keeps the old area, and the next render puts it back and clears the cells it covers.

### Clear a prop with `undefined`

When a prop that had a value becomes `undefined`, the wrapper sends the option's default, so the grid goes back to it. `null` and `false` are real values, and the grid applies them as they are. A hook prop is the exception: a callback that becomes `undefined`, `null`, or `false` is removed.

```jsx
<HotTable readOnly={locked ? true : undefined} />
```

Two cases do not clear:

- A prop that you stop passing is not sent, so the grid keeps its last value. `{...(locked && { readOnly: true })}` leaves `readOnly` on after `locked` turns `false`. Pass `undefined` explicitly, as above. A hook you stop passing is removed.
- An option whose default is `undefined` can ignore an `undefined` value. [`height`](@/api/options.md#height) and [`width`](@/api/options.md#width) keep their last value. Pass `null` to remove a fixed size, or `'auto'` for the height.

```jsx
<HotTable height={fullPage ? null : 400} />
```

## What you learned

- You can connect a `HotTable` component to a Redux store using `react-redux`'s `connect()` method.
- The `beforeChange` hook dispatches Redux actions whenever a cell changes, keeping global state in sync.
- A reducer that returns the previous state when nothing changed keeps plugin writes from looping with re-renders.
- Every render applies your props again, so keep `data` stable and leave out the props of options that users change, such as `mergeCells`.
- Custom editor and renderer components can read from and write to the Redux store, enabling grid cells to reflect shared application state.

## Next steps

- [Binding to data](@/guides/getting-started/binding-to-data/binding-to-data.md) -- understand how Handsontable binds to different data structures.
- [Saving data](@/guides/getting-started/saving-data/saving-data.md) -- learn additional patterns for persisting grid changes.
