---
title: HidingMap
metaTitle: HidingMap - API Reference - Handsontable Documentation
permalink: /api/hiding-map
canonicalUrl: /api/hiding-map
hotPlugin: false
editLink: false
---

# HidingMap

[[toc]]

## Description

Map for storing mappings from an physical index to a boolean value. It stores information whether physical index is
included in a dataset, but skipped in the process of rendering.


## Methods

### getHiddenIndexes

::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/translations/maps/hidingMap.js#L21

:::

_hidingMap.getHiddenIndexes() ⇒ Array_

Get physical indexes which are hidden.

Note: Indexes marked as hidden are included in a [DataMap](@/api/dataMap.md), but aren't rendered.
