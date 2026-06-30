---
title: ScrollTimer
metaTitle: ScrollTimer API reference – JavaScript Data Grid | Handsontable
permalink: /api/scroll-timer
canonicalUrl: /api/scroll-timer
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]

## Members

### isActive

::: ask-about-api isActive|ScrollTimer

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dragToScroll/scrollTimer.ts#L88

:::

_scrollTimer.isActive : boolean_

Whether the timer is currently active.


## Methods

### configure

::: ask-about-api configure|ScrollTimer

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dragToScroll/scrollTimer.ts#L99

:::

_scrollTimer.configure(settings)_

Configures the scroll timing settings.


| Param | Type | Description |
| --- | --- | --- |
| settings | `object` | Timer settings. |
| settings.intervalRange | `object` | Interval range in ms. |
| settings.intervalRange.min | `number` | Minimum interval in ms. |
| settings.intervalRange.max | `number` | Maximum interval in ms. |
| settings.rampDistance | `number` | Distance at which interval reaches minimum. |



### stop

::: ask-about-api stop|ScrollTimer

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dragToScroll/scrollTimer.ts#L116

:::

_scrollTimer.stop()_

Stops the timer.



### update

::: ask-about-api update|ScrollTimer

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dragToScroll/scrollTimer.ts#L106

:::

_scrollTimer.update(distance)_

Updates the timer state. Starts or stops based on distance value.


| Param | Type | Description |
| --- | --- | --- |
| distance | `number` | Distance from viewport edge (0 = inside viewport, N > 0 = outside viewport). |


