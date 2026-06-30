---
title: AutoScroller
metaTitle: AutoScroller API reference – JavaScript Data Grid | Handsontable
permalink: /api/auto-scroller
canonicalUrl: /api/auto-scroller
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]

## Members

### isActive

::: ask-about-api isActive|AutoScroller

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dragToScroll/autoScroller.ts#L73

:::

_autoScroller.isActive : boolean_

Whether any axis is currently scrolling.



### isHorizontalActive

::: ask-about-api isHorizontalActive|AutoScroller

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dragToScroll/autoScroller.ts#L80

:::

_autoScroller.isHorizontalActive : boolean_

Whether the horizontal axis is currently scrolling.



### isVerticalActive

::: ask-about-api isVerticalActive|AutoScroller

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dragToScroll/autoScroller.ts#L87

:::

_autoScroller.isVerticalActive : boolean_

Whether the vertical axis is currently scrolling.


## Methods

### configure

::: ask-about-api configure|AutoScroller

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dragToScroll/autoScroller.ts#L98

:::

_autoScroller.configure(settings)_

Configures scroll timing settings for both axes.


| Param | Type | Description |
| --- | --- | --- |
| settings | `object` | Scroll settings. |
| settings.intervalRange | `object` | Interval range in milliseconds. |
| settings.intervalRange.min | `object` | Minimum interval in milliseconds. |
| settings.intervalRange.max | `object` | Maximum interval in milliseconds. |
| settings.rampDistance | `number` | Distance at which interval reaches minimum. |



### destroy

::: ask-about-api destroy|AutoScroller

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dragToScroll/autoScroller.ts#L128

:::

_autoScroller.destroy()_

Destroys the scroll looper.



### stop

::: ask-about-api stop|AutoScroller

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dragToScroll/autoScroller.ts#L112

:::

_autoScroller.stop()_

Stops all scrolling.



### stopHorizontal

::: ask-about-api stopHorizontal|AutoScroller

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dragToScroll/autoScroller.ts#L118

:::

_autoScroller.stopHorizontal()_

Stops the horizontal axis scrolling only.



### stopVertical

::: ask-about-api stopVertical|AutoScroller

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dragToScroll/autoScroller.ts#L123

:::

_autoScroller.stopVertical()_

Stops the vertical axis scrolling only.



### update

::: ask-about-api update|AutoScroller

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dragToScroll/autoScroller.ts#L106

:::

_autoScroller.update(overflow)_

Updates scroll state based on cursor overflow from viewport boundaries.


| Param | Type | Description |
| --- | --- | --- |
| overflow | `Object` | Distance past viewport edges (0 = inside, N >0 || N < 0 = pixels outside). |


