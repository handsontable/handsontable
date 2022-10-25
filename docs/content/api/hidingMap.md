---
title: HidingMap
metaTitle: HidingMap - JavaScript Data Grid | Handsontable
permalink: /api/hiding-map
canonicalUrl: /api/hiding-map
searchCategory: API Reference
hotPlugin: false
editLink: false
description: Options, members, and methods of Handsontable's HidingMap API.
react:
  metaTitle: HidingMap - React Data Grid | Handsontable
---

# HidingMap

[[toc]]

## Description

Map for storing mappings from an physical index to a boolean value. It stores information whether physical index is
included in a dataset, but skipped in the process of rendering.


## Methods

### getHiddenIndexes
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/translations/maps/hidingMap.js#L22

:::

_hidingMap.getHiddenIndexes() ⇒ Array_

Get physical indexes which are hidden.

Note: Indexes marked as hidden are included in a [DataMap](@/api/dataMap.md), but aren't rendered.


