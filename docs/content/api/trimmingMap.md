---
title: TrimmingMap
metaTitle: TrimmingMap - API Reference - Handsontable Documentation
permalink: /api/trimming-map
canonicalUrl: /api/trimming-map
hotPlugin: false
editLink: false
---

# TrimmingMap

[[toc]]

## Description

Map for storing mappings from an physical index to a boolean value. It stores information whether physical index is
NOT included in a dataset and skipped in the process of rendering.


## Methods

### getTrimmedIndexes

::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/translations/maps/trimmingMap.js#L22

:::

_trimmingMap.getTrimmedIndexes() ⇒ Array_

Get physical indexes which are trimmed.

Note: Indexes marked as trimmed aren't included in a [DataMap](@/api/dataMap.md) and aren't rendered.
