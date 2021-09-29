---
title: Interval
metaTitle: Interval - API Reference - Handsontable Documentation
permalink: /10.0/api/interval
canonicalUrl: /api/interval
hotPlugin: false
editLink: false
---

# Interval

[[toc]]
## Members

### delay
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/utils/interval.js#L28

:::

_interval.delay_

Number of milliseconds that function should wait before next call.



### func
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/utils/interval.js#L24

:::

_interval.func : function_

Function to invoke repeatedly.



### stopped
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/utils/interval.js#L35

:::

_interval.stopped : boolean_

Flag which indicates if interval object was stopped.

**Default**: <code>true</code>  


### timer
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/utils/interval.js#L18

:::

_interval.timer : number_

Animation frame request id.


## Methods

### start
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/utils/interval.js#L57

:::

_interval.start() ⇒ [Interval](@/api/interval.md)_

Start loop.



### stop
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/utils/interval.js#L72

:::

_interval.stop() ⇒ [Interval](@/api/interval.md)_

Stop looping.


