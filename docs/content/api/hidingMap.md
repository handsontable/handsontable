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
---

# HidingMap

[[toc]]

## Description

Map for storing mappings from an physical index to a boolean value. It stores information whether physical index is
included in a dataset, but skipped in the process of rendering.


## Methods

### getHiddenIndexes
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3d620674b8d47d39f08596d8bc413ee314849214/handsontable\src\translations\maps/hidingMap.js#L22

:::

_hidingMap.getHiddenIndexes() ⇒ Array_

Get physical indexes which are hidden.

Note: Indexes marked as hidden are included in a [DataMap](@/api/dataMap.md), but aren't rendered.


