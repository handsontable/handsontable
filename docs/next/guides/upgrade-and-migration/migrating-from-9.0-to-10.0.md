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

If you use the `beforeRender` or `afterRender` hooks, update their names in your app.

| Before         | After                                                 |
| -------------- | ----------------------------------------------------- |
| `beforeRender` | [`beforeViewRender`](@/api/hooks.md#beforeviewrender) |
| `afterRender`  | [`afterViewRender`](@/api/hooks.md#afterviewrender)   |

Now, the hooks previously named `beforeRender` and `afterRender` do completely new things. For more details, see the [Handsontable 10.0 API reference](@/api/hooks.md):
- [`beforeRender`](@/api/hooks.md#beforerender)
- [`afterRender`](@/api/hooks.md#afterrender)
- [`beforeViewRender`](@/api/hooks.md#beforeviewrender)
- [`afterViewRender`](@/api/hooks.md#afterviewrender)

## Step 2: Adapt to the [`Formulas`](@/api/formulas.md) plugin changes

If you use the [`Formulas`](@/api/formulas.md) plugin, update your code.

#### Hyperformula 0.6.2 -> 1.1.0

In Handsontable 10.0.0, we updated the optional HyperFormula dependency from 0.6.2 to ^1.1.0.

For more details on the breaking changes between HyperFormula 0.6.x and HyperFormula 1.0.x, see the [migration guide](https://handsontable.github.io/hyperformula/guide/migration-from-0.6-to-1.0.html).