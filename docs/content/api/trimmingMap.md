---
title: TrimmingMap
metaTitle: TrimmingMap - JavaScript Data Grid | Handsontable
permalink: /api/trimming-map
canonicalUrl: /api/trimming-map
searchCategory: API Reference
hotPlugin: false
editLink: false
id: 8wnfx6b9
description: Options, members, and methods of Handsontable's TrimmingMap API.
react:
  id: l3n89gff
  metaTitle: TrimmingMap - React Data Grid | Handsontable
angular:
  id: b6u3d1uv
  metaTitle: TrimmingMap - Angular Data Grid | Handsontable
---

[[toc]]

## Description

Initializes the trimming map with an optional default value, defaulting to `false` (not trimmed).

The map stores flags coerced to booleans, so a write of an unchanged flag is provably a no-op —
`skipUnchangedWrites` is always on, keeping no-op writes from rebuilding the index caches.


## Methods

### getTrimmedIndexes

::: ask-about-api getTrimmedIndexes|TrimmingMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/translations/maps/trimmingMap.ts#L20

:::

_trimmingMap.getTrimmedIndexes() ⇒ Array_

Get physical indexes which are trimmed.

Note: Indexes marked as trimmed aren't included in a [DataMap](@/api/dataMap.md) and aren't rendered.


