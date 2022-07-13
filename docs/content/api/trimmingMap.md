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

::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/translations/maps/trimmingMap.js#L22

:::

_trimmingMap.getTrimmedIndexes() ⇒ Array_

Get physical indexes which are trimmed.

Note: Indexes marked as trimmed aren't included in a [DataMap](@/api/dataMap.md) and aren't rendered.
