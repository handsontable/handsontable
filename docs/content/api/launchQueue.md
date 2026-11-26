---
title: LaunchQueue
metaTitle: LaunchQueue API reference | Handsontable DataGrid for JavaScript
permalink: /api/launch-queue
canonicalUrl: /api/launch-queue
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]

## Description

Creates a queue.


## Methods

### clear

::: ask-about-api clear|LaunchQueue

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/asyncValues/launchQueue.ts#L194

:::

_launchQueue.clear()_

Drops every waiting launch. Running ones keep their slots until they release them.



### pump

::: ask-about-api pump|LaunchQueue

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/asyncValues/launchQueue.ts#L166

:::

_launchQueue.pump()_

Starts waiting launches while slots are free. A launch with nothing left to compute is dropped.



### push

::: ask-about-api push|LaunchQueue

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/asyncValues/launchQueue.ts#L160

:::

_launchQueue.push(launch)_

Queues a launch and starts what fits.


| Param | Type | Description |
| --- | --- | --- |
| launch | `Launch` | The launch. |


