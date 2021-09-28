---
title: Migrating from 9.0 to 10.0
metaTitle: Migrating from 9.0 to 10.0 - Guide - Handsontable Documentation
permalink: /next/migration-from-9.0-to-10.0
canonicalUrl: /migration-from-9.0-to-10.0
pageClass: migration-guide
---

# Migrating from 9.0 to 10.0

[[toc]]

To upgrade your Handsontable version from 9.0.x to 10.0.x, follow this guide.

## Step 1: Rename your hooks

If you use the `beforeRender` or `afterRender` hooks, update their names in your app ([#8632](https://github.com/handsontable/handsontable/pull/8632)).

| Before         | After              |
| -------------- | ------------------ |
| `beforeRender` | `beforeViewRender` |
| `afterRender`  | `afterViewRender`  |

There are still hooks that are named `beforeRender` and `afterRender`, but they do completely new things now. For more details, see the [Handsontable 10.0 API reference](@/api/hooks.md):
- [`beforeRender`](@/api/hooks.md#beforerender)
- [`afterRender`](@/api/hooks.md#afterrender)
- [`beforeViewRender`](@/api/hooks.md#beforeviewrender)
- [`afterViewRender`](@/api/hooks.md#afterviewrender)

## Step 2: Adapt to the HyperFormula dependency update

In Handsontable 10.0.0, we updated the optional HyperFormula dependency from `0.6.2` to `^1.1.0` ([#8669](https://github.com/handsontable/handsontable/pull/8669)).

For more details on the breaking changes between HyperFormula 0.6.x and HyperFormula 1.0.x, see the [migration guide](https://handsontable.github.io/hyperformula/guide/migration-from-0.6-to-1.0.html).

## Step 3: Adapt to the configuration options' new default values

In Handsontable 10.0.0, we changed the default values of the [`autoWrapCol`](@/api/options.md#autowrapcol) and [`autoWrapRow`](@/api/options.md#autowraprow) [configuration options](@/guides/getting-started/setting-options.md), from `true` to `false` ([#8662](https://github.com/handsontable/handsontable/pull/8662)):

| Before                                              | After                                                |
| --------------------------------------------------- | ---------------------------------------------------- |
| [`autoWrapCol: true`](@/api/options.md#autowrapcol) | [`autoWrapCol: false`](@/api/options.md#autowrapcol) |
| [`autoWrapRow: true`](@/api/options.md#autowraprow) | [`autoWrapRow: false`](@/api/options.md#autowraprow) |

We also changed the default values for the [`rowsLimit`](@/api/copypaste.md#rowslimit) and [`columnsLimit`](@/api/copypaste.md#columnslimit) options of the [`CopyPaste`](@/api/copypaste.md) plugin, from `1000` to `Infinity` ([#8676](https://github.com/handsontable/handsontable/pull/8676)):

| Before                                                  | After                                                       |
| ------------------------------------------------------- | ----------------------------------------------------------- |
| [`rowsLimit: 1000`](@/api/copypaste.md#rowslimit)       | [`rowsLimit: Infinity`](@/api/copypaste.md#rowslimit)       |
| [`columnsLimit: 1000`](@/api/copypaste.md#columnslimit) | [`columnsLimit: Infinity`](@/api/copypaste.md#columnslimit) |

## Step 4: Adapt to the hook changes

In Handsontable 10.0, we unified the naming of an argument used by the [`beforeOnCellMouseDown`](@/api/hooks.md#beforeoncellmousedown) and [`beforeOnCellMouseOver`](@/api/hooks.md#beforeoncellmouseover) hooks ([#8591](https://github.com/handsontable/handsontable/pull/8591)):

| Hook                                                            | Before              | After        |
| --------------------------------------------------------------- | ------------------- | ------------ |
| [`beforeOnCellMouseDown`](@/api/hooks.md#beforeoncellmousedown) | `blockCalculations` | `controller` |
| [`beforeOnCellMouseOver`](@/api/hooks.md#beforeoncellmouseover) | `blockCalculations` | `controller` |

In both cases, the renamed `controller` object now has a `cell` property, instead of a `cells` property:

| `blockCalculations` (before) | `controller` (after)        |
| ---------------------------- | --------------------------- |
| `row`<br>`column`<br>`cells` | `row`<br>`column`<br>`cell` |

This change affects the following plugins:
- [`ColumnSorting`](@/api/columnsorting.md)
- [`MultiColumnSorting`](@/api/multicolumnsorting.md)
- [`ManualColumnMove`](@/api/manualcolumnmove.md)
- [`ManualRowMove`](@/api/manualrowmove.md)
- [`NestedHeaders`](@/api/nestedheaders.md)

For more details, see [this PR](https://github.com/handsontable/handsontable/pull/8591).

## Step 5: Adapt to the font changes

To make Handsontable look good right out of the box, we added default `font-family`, `font size`, `font weight`, and `color` properties for all elements within the `.handsontable` CSS class ([#8681](https://github.com/handsontable/handsontable/pull/8681)). If you're not overwriting these properties in your app, this change will affect your grid's font.