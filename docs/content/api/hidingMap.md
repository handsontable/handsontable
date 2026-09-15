---
title: HidingMap
metaTitle: HidingMap - JavaScript Data Grid | Handsontable
permalink: /api/hiding-map
canonicalUrl: /api/hiding-map
searchCategory: API Reference
hotPlugin: false
editLink: false
id: g0whnkji
description: Options, members, and methods of Handsontable's HidingMap API.
react:
  id: 9k5ucjxx
  metaTitle: HidingMap - React Data Grid | Handsontable
angular:
  id: s5l4u2cd
  metaTitle: HidingMap - Angular Data Grid | Handsontable
---

[[toc]]

## Description

Initializes the hiding map with an optional default value, defaulting to `false` (not hidden).

The map stores flags coerced to booleans, so a write of an unchanged flag is provably a no-op —
`skipUnchangedWrites` is always on, keeping no-op writes from rebuilding the index caches.


## Methods

### getHiddenIndexes

::: ask-about-api getHiddenIndexes|HidingMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/translations/maps/hidingMap.ts#L20

:::

_hidingMap.getHiddenIndexes() ⇒ Array_

Get physical indexes which are hidden.

Note: Indexes marked as hidden are included in a [DataMap](@/api/dataMap.md), but aren't rendered.


