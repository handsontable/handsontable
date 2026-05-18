---
title: Rendering and styling recipes
metaTitle: Rendering and styling recipes - JavaScript Data Grid | Handsontable
permalink: /recipes/rendering-styling
canonicalUrl: /recipes/rendering-styling
searchCategory: Recipes
hotPlugin: false
editLink: false
type: how-to
id: a8f3c91d
description: Practical recipes for row layout, summaries, custom renderers, and visual styling in Handsontable.
react:
  id: b2e4d80a
  metaTitle: Rendering and styling recipes - React Data Grid | Handsontable
angular:
  id: c7f1a92e
  metaTitle: Rendering and styling recipes - Angular Data Grid | Handsontable
---
[[toc]]

## Overview

This section collects recipes that focus on how the grid is laid out and how cells look. You can use these patterns for pinned summaries, inline graphics, and visual tweaks without adding heavy charting libraries.

## Getting started

If you are new to fixed rows, read the [Row freezing](@/guides/rows/row-freezing/row-freezing.md) guide for `fixedRowsTop` and `fixedRowsBottom` before you add a custom summary row.

## Available recipes

- [Frozen summary row](@/recipes/rendering-styling/frozen-summary-row/frozen-summary-row.md) - pinned bottom row with sum, average, and count that updates on edits
- [Sparkline cell renderer](@/recipes/rendering-styling/sparkline-cell-renderer/sparkline-cell-renderer.md) - mini SVG bar charts from array values in a cell
- [Conditional row coloring](@/recipes/rendering-styling/conditional-row-coloring/conditional-row-coloring.md) - map a status column to row-level CSS classes with the `cells` callback and scoped styles

Each recipe includes runnable examples you can copy into your project.