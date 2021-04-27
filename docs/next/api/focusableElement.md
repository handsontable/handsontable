---
title: FocusableElement
permalink: /next/api/focusable-element
canonicalUrl: /api/focusable-element
editLink: false
---

# FocusableElement

[[toc]]
## Members

### container
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/copyPaste/focusableElement.js#L38

:::

`focusableWrapper.container : HTMLElement`

Parent for an focusable element.



### eventManager
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/copyPaste/focusableElement.js#L26

:::

`focusableWrapper.eventManager : EventManager`

Instance of EventManager.



### listenersCount
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/copyPaste/focusableElement.js#L32

:::

`focusableWrapper.listenersCount : WeakSet`

An object for tracking information about event listeners attached to the focusable element.



### mainElement
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/copyPaste/focusableElement.js#L20

:::

`focusableWrapper.mainElement : HTMLElement`

The main/operational focusable element.


## Methods

### focus
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/copyPaste/focusableElement.js#L81

:::

`focusableWrapper.focus()`

Set focus to the focusable element.



### getFocusableElement
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/copyPaste/focusableElement.js#L74

:::

`focusableWrapper.getFocusableElement() ⇒ HTMLElement`

Get currently set focusable element.



### setFocusableElement
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/copyPaste/focusableElement.js#L60

:::

`focusableWrapper.setFocusableElement(element)`

Switch to the main focusable element.


| Param | Type | Description |
| --- | --- | --- |
| element | `HTMLElement` | The DOM element. |



### useSecondaryElement
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/copyPaste/focusableElement.js#L44

:::

`focusableWrapper.useSecondaryElement()`

Switch to the secondary focusable element. Used when no any main focusable element is provided.



