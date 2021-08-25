---
title: Interval
metaTitle: Interval - API Reference - Handsontable Documentation
permalink: /9.1/api/interval
canonicalUrl: /api/interval
hotPlugin: false
editLink: false
---

# Interval

[[toc]]
## Members

### delay
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e0c36706e259c08cdf019a83ae72bd9f7e2613fd/src/utils/interval.js#L28

:::

_interval.delay_

Number of milliseconds that function should wait before next call.



### func
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e0c36706e259c08cdf019a83ae72bd9f7e2613fd/src/utils/interval.js#L24

:::

_interval.func : function_

Function to invoke repeatedly.



### stopped
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e0c36706e259c08cdf019a83ae72bd9f7e2613fd/src/utils/interval.js#L35

:::

_interval.stopped : boolean_

Flag which indicates if interval object was stopped.

**Default**: <code>true</code>  


### timer
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e0c36706e259c08cdf019a83ae72bd9f7e2613fd/src/utils/interval.js#L18

:::

_interval.timer : number_

Animation frame request id.


## Methods

### start
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e0c36706e259c08cdf019a83ae72bd9f7e2613fd/src/utils/interval.js#L57

:::

_interval.start() ⇒ [Interval](@/api/interval.md)_

Start loop.



### stop
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e0c36706e259c08cdf019a83ae72bd9f7e2613fd/src/utils/interval.js#L72

:::

_interval.stop() ⇒ [Interval](@/api/interval.md)_

Stop looping.


