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
---

# TrimmingMap

[[toc]]

## Description

Map for storing mappings from an physical index to a boolean value. It stores information whether physical index is
NOT included in a dataset and skipped in the process of rendering.


## Methods

### getTrimmedIndexes
  
::: source-code-link https://github.com/handsontable/handsontable/blob/34e9d0aded2c90f656e6de8cc0a811b812dd92c4/handsontable/src/translations/maps/trimmingMap.js#L22

:::

_trimmingMap.getTrimmedIndexes() ⇒ Array_

Get physical indexes which are trimmed.

Note: Indexes marked as trimmed aren't included in a [DataMap](@/api/dataMap.md) and aren't rendered.


