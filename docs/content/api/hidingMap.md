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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/34e9d0aded2c90f656e6de8cc0a811b812dd92c4/handsontable/src/translations/maps/hidingMap.js#L22

:::

_hidingMap.getHiddenIndexes() ⇒ Array_

Get physical indexes which are hidden.

Note: Indexes marked as hidden are included in a [DataMap](@/api/dataMap.md), but aren't rendered.


