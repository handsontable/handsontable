---
title: Launch
metaTitle: Launch API reference | Handsontable DataGrid for JavaScript
permalink: /api/launch
canonicalUrl: /api/launch
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]

## Description

Creates a launch.


## Methods

### isLive

::: ask-about-api isLive|Launch

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/asyncValues/launchQueue.ts#L73

:::

_launch.isLive() ⇒ boolean_

Tells whether the launch still has a cell to compute.



### isStarted

::: ask-about-api isStarted|Launch

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/asyncValues/launchQueue.ts#L80

:::

_launch.isStarted() ⇒ boolean_

Whether the source was called.



### release

::: ask-about-api release|Launch

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/asyncValues/launchQueue.ts#L128

:::

_launch.release()_

Frees the slot. Safe to call more than once, and before the source settles: a launch whose cells were
all canceled gives its slot back at once, even when its source ignores the abort signal.



### start

::: ask-about-api start|Launch

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/asyncValues/launchQueue.ts#L87

:::

_launch.start(onRelease)_

Calls the source, holding a slot until `release()`.


| Param | Type | Description |
| --- | --- | --- |
| onRelease | `function` | Frees the slot. |


