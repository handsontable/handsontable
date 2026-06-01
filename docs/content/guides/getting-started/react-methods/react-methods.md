---
type: how-to
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
angular:
  id: 7a8puryp
  metaTitle: Instance methods - Angular Data Grid | Handsontable
vue:
  id: dzj81kmk
  metaTitle: Instance methods - Vue Data Grid | Handsontable
searchCategory: Guides
onlyFor: react
category: Getting started
---
Use useRef and HotTableRef to get a reference to the Handsontable instance from a React component, then call any API method on it.

[[toc]]

## Use Handsontable's API

You can programmatically change the internal state of Handsontable beyond what's possible with props. To do that, call API methods of the relevant Handsontable instance associated with your instance of the [`HotTable`](@/guides/getting-started/installation/installation.md#_4-use-the-hottable-component) component.

The following example implements the [`HotTable`](@/guides/getting-started/installation/installation.md#_4-use-the-hottable-component) component showing how to reference the Handsontable instance from the wrapper component.

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/getting-started/react-methods/react/example1.jsx)
@[code](@/content/guides/getting-started/react-methods/react/example1.tsx)

:::

::: tip Mobile and Android support

Handsontable is designed for desktop browsers. While the library may load on mobile browsers (including Android), features such as cell editing, context menus, and keyboard navigation may not work as expected on touch devices.

:::

## TypeScript: type the `hotInstance` reference

Since 14.1.0, `HotTable` is a functional component, not a class component. Because of this, you can no longer use `HotTable` as the type argument of `useRef` to get access to the Handsontable instance:

```typescript
// This no longer works as expected since 14.1.0
import HotTable from '@handsontable/react-wrapper';
const ref = useRef<HotTable>(null); // TypeScript error or wrong type
```

Instead, use the `HotTableRef` interface exported from `@handsontable/react-wrapper`:

```typescript
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';

const ref = useRef<HotTableRef>(null);

// Access the Handsontable instance through `hotInstance`:
ref.current?.hotInstance?.selectCell(1, 1);
```

`HotTableRef` exposes the following properties:

| Property | Type | Description |
|---|---|---|
| `hotInstance` | `Handsontable \| null` | The Handsontable instance. Use this to call Handsontable API methods. |
| `hotElementRef` | `HTMLElement` | The root DOM element of the grid. |

## Result

Your React component now holds a typed reference to the Handsontable instance through `HotTableRef`. You can call any Handsontable API method on `ref.current.hotInstance` from event handlers and lifecycle effects.
