---
id: 5l7bspro
title: Migrating from 9.0 to 10.0
metaTitle: Migrate from 9.0 to 10.0 - JavaScript Data Grid | Handsontable
description: Migrate from Handsontable 9.0 to Handsontable 10.0, released on September 29, 2021.
permalink: /migration-from-9.0-to-10.0
canonicalUrl: /migration-from-9.0-to-10.0
pageClass: migration-guide
react:
  id: oh5ffbjc
  metaTitle: Migrate from 9.0 to 10.0 - React Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---

# Migrate from 9.0 to 10.0

Migrate from Handsontable 9.0 to Handsontable 10.0, released on September 29, 2021.

[[toc]]

## Step 1: Rename your Handsontable hooks

If you use the [`beforeRender`](@/api/hooks.md#beforerender) or [`afterRender`](@/api/hooks.md#afterrender) Handsontable hooks, update their names in your app ([#8632](https://github.com/handsontable/handsontable/pull/8632)).

| Before                                        | After                                                 |
| --------------------------------------------- | ----------------------------------------------------- |
| [`beforeRender`](@/api/hooks.md#beforerender) | [`beforeViewRender`](@/api/hooks.md#beforeviewrender) |
| [`afterRender`](@/api/hooks.md#afterrender)   | [`afterViewRender`](@/api/hooks.md#afterviewrender)   |

There are still Handsontable hooks that are named [`beforeRender`](@/api/hooks.md#beforerender) and [`afterRender`](@/api/hooks.md#afterrender), but they do completely new things now. For more details, see the [Handsontable 10.0 API reference](@/api/hooks.md):
- [`beforeRender`](@/api/hooks.md#beforerender)
- [`afterRender`](@/api/hooks.md#afterrender)
- [`beforeViewRender`](@/api/hooks.md#beforeviewrender)
- [`afterViewRender`](@/api/hooks.md#afterviewrender)

## Step 2: Adapt to the HyperFormula dependency update

In Handsontable 10.0.0, we updated the optional HyperFormula dependency from `0.6.2` to `^1.1.0` ([#8669](https://github.com/handsontable/handsontable/pull/8669)).

For more details on the breaking changes between HyperFormula 0.6.x and HyperFormula 1.0.x, see the [migration guide](https://handsontable.github.io/hyperformula/guide/migration-from-0.6-to-1.0.html).

## Step 3: Adapt to the configuration options' new default values

In Handsontable 10.0.0, we changed the default values of the [`autoWrapCol`](@/api/options.md#autowrapcol) and [`autoWrapRow`](@/api/options.md#autowraprow) [configuration options](@/guides/getting-started/configuration-options/configuration-options.md), from `true` to `false` ([#8662](https://github.com/handsontable/handsontable/pull/8662)):

::: only-for javascript

| Before                                              | After                                                |
| --------------------------------------------------- | ---------------------------------------------------- |
| [`autoWrapCol: true`](@/api/options.md#autowrapcol) | [`autoWrapCol: false`](@/api/options.md#autowrapcol) |
| [`autoWrapRow: true`](@/api/options.md#autowraprow) | [`autoWrapRow: false`](@/api/options.md#autowraprow) |

:::

::: only-for react

| Before                                               | After                                                 |
| ---------------------------------------------------- | ----------------------------------------------------- |
| [`autoWrapCol={true}`](@/api/options.md#autowrapcol) | [`autoWrapCol={false}`](@/api/options.md#autowrapcol) |
| [`autoWrapRow={true}`](@/api/options.md#autowraprow) | [`autoWrapRow={false}`](@/api/options.md#autowraprow) |

:::

We also changed the default values for the [`rowsLimit`](@/api/copyPaste.md#rowslimit) and [`columnsLimit`](@/api/copyPaste.md#columnslimit) options of the [`CopyPaste`](@/api/copyPaste.md) plugin, from `1000` to `Infinity` ([#8676](https://github.com/handsontable/handsontable/pull/8676)):

::: only-for javascript

| Before                                                  | After                                                       |
| ------------------------------------------------------- | ----------------------------------------------------------- |
| [`rowsLimit: 1000`](@/api/copyPaste.md#rowslimit)       | [`rowsLimit: Infinity`](@/api/copyPaste.md#rowslimit)       |
| [`columnsLimit: 1000`](@/api/copyPaste.md#columnslimit) | [`columnsLimit: Infinity`](@/api/copyPaste.md#columnslimit) |

:::

::: only-for react

| Before                                                   | After                                                        |
| -------------------------------------------------------- | ------------------------------------------------------------ |
| [`rowsLimit={1000}`](@/api/copyPaste.md#rowslimit)       | [`rowsLimit={Infinity}`](@/api/copyPaste.md#rowslimit)       |
| [`columnsLimit={1000}`](@/api/copyPaste.md#columnslimit) | [`columnsLimit={Infinity}`](@/api/copyPaste.md#columnslimit) |

:::

## Step 4: Adapt to the Handsontable hooks changes

In Handsontable 10.0, we unified the naming of an argument used by the [`beforeOnCellMouseDown`](@/api/hooks.md#beforeoncellmousedown) and [`beforeOnCellMouseOver`](@/api/hooks.md#beforeoncellmouseover) Handsontable hooks ([#8591](https://github.com/handsontable/handsontable/pull/8591)):

| Handsontable hook                                               | Before              | After        |
| --------------------------------------------------------------- | ------------------- | ------------ |
| [`beforeOnCellMouseDown`](@/api/hooks.md#beforeoncellmousedown) | `blockCalculations` | `controller` |
| [`beforeOnCellMouseOver`](@/api/hooks.md#beforeoncellmouseover) | `blockCalculations` | `controller` |

In both cases, the renamed `controller` object now has a `cell` property, instead of a `cells` property:

| `blockCalculations` (before) | `controller` (after)        |
| ---------------------------- | --------------------------- |
| `row`<br>`column`<br>`cells` | `row`<br>`column`<br>`cell` |

This change affects the following plugins:
- [`ColumnSorting`](@/api/columnSorting.md)
- [`MultiColumnSorting`](@/api/multiColumnSorting.md)
- [`ManualColumnMove`](@/api/manualColumnMove.md)
- [`ManualRowMove`](@/api/manualRowMove.md)
- [`NestedHeaders`](@/api/nestedHeaders.md)

For more details, see [this PR](https://github.com/handsontable/handsontable/pull/8591).

## Step 5: Adapt to the font changes

To make Handsontable look good right out of the box, we added default `font-family`, `font size`, `font weight`, and `color` properties for all elements within the `.handsontable` CSS class ([#8681](https://github.com/handsontable/handsontable/pull/8681)). If you're not overwriting these properties in your app, this change will affect your grid's font.
