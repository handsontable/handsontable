---
title: Anonymous
metaTitle: Anonymous - API Reference - Handsontable Documentation
permalink: /9.1/api/anonymous
canonicalUrl: /api/anonymous
hotPlugin: false
editLink: false
---

# Anonymous

[[toc]]
## Members

### BODY_LINE_HEIGHT
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/3rdparty/walkontable/src/overlays.js#L52

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~BODY\_LINE\_HEIGHT_

Sometimes `line-height` might be set to 'normal'. In that case, a default `font-size` should be multiplied by roughly 1.2.
Https://developer.mozilla.org/pl/docs/Web/CSS/line-height#Values.



### value
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/dataMap.js#L665

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~value_

Allows for interacting with complex structures, for example
 d3/jQuery getter/setter properties:

   {columns: [{
     data: function(row, value){
       if(arguments.length === 1){
         return row.property();
       }
       row.property(value);
     }
   }]}.


## Methods

### callbackProxy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/eventManager.js#L43

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~callbackProxy(event)_


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | The event object. |



### findCenter
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/3rdparty/walkontable/test/lib/jquery.simulate.js#L277

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~findCenter()_

complex events



### handler
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/3rdparty/walkontable/src/border.js#L142

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~handler(handlerEvent)_


| Param | Type | Description |
| --- | --- | --- |
| handlerEvent | `Event` | The mouse event object. |



### inverse
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/utils/dataStructures/linkedList.js#L222

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~inverse(current, next)_


| Param | Type | Description |
| --- | --- | --- |
| current | `*` | The current value. |
| next | `*` | The next value. |



### isOutside
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/3rdparty/walkontable/src/border.js#L124

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~isOutside(mouseEvent) ⇒ boolean_


| Param | Type | Description |
| --- | --- | --- |
| mouseEvent | `Event` | The mouse event object. |



### isValidElement
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/plugins/contextMenu/contextMenu.js#L332

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~isValidElement(element) ⇒ boolean_


| Param | Type | Description |
| --- | --- | --- |
| element | `HTMLElement` | The element to validate. |



### removeFromDragged
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/plugins/multipleSelectionHandles/multipleSelectionHandles.js#L81

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~removeFromDragged(query) ⇒ boolean_


| Param | Type | Description |
| --- | --- | --- |
| query | `string` | Query for the position. |


