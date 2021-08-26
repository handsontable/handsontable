---
title: Interval
metaTitle: Interval - API Reference - Handsontable Documentation
permalink: /8.4/api/interval
canonicalUrl: /api/interval
hotPlugin: false
editLink: false
---

# Interval

[[toc]]
## Members

### delay
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/utils/interval.js#L28

:::

_interval.delay_

Number of milliseconds that function should wait before next call.



### func
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/utils/interval.js#L24

:::

_interval.func : function_

Function to invoke repeatedly.



### stopped
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/utils/interval.js#L35

:::

_interval.stopped : boolean_

Flag which indicates if interval object was stopped.

**Default**: <code>true</code>  


### timer
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/utils/interval.js#L18

:::

_interval.timer : number_

Animation frame request id.


## Methods

### start
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/utils/interval.js#L57

:::

_interval.start() ⇒ [Interval](@/api/interval.md)_

Start loop.



### stop
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/utils/interval.js#L72

:::

_interval.stop() ⇒ [Interval](@/api/interval.md)_

Stop looping.


