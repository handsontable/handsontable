---
title: FocusableElement
metaTitle: FocusableElement - API Reference - Handsontable Documentation
permalink: /10.0/api/focusable-element
canonicalUrl: /api/focusable-element
editLink: false
---

# FocusableElement

[[toc]]
## Members

### container
  
::: source-code-link https://github.com/handsontable/handsontable/blob/a823abcaa2d349166fef0f3df23de6fddb619814/src/plugins/copyPaste/focusableElement.js#L38

:::

_focusableWrapper.container : HTMLElement_

Parent for an focusable element.



### eventManager
  
::: source-code-link https://github.com/handsontable/handsontable/blob/a823abcaa2d349166fef0f3df23de6fddb619814/src/plugins/copyPaste/focusableElement.js#L26

:::

_focusableWrapper.eventManager : EventManager_

Instance of EventManager.



### listenersCount
  
::: source-code-link https://github.com/handsontable/handsontable/blob/a823abcaa2d349166fef0f3df23de6fddb619814/src/plugins/copyPaste/focusableElement.js#L32

:::

_focusableWrapper.listenersCount : WeakSet_

An object for tracking information about event listeners attached to the focusable element.



### mainElement
  
::: source-code-link https://github.com/handsontable/handsontable/blob/a823abcaa2d349166fef0f3df23de6fddb619814/src/plugins/copyPaste/focusableElement.js#L20

:::

_focusableWrapper.mainElement : HTMLElement_

The main/operational focusable element.


## Methods

### focus
  
::: source-code-link https://github.com/handsontable/handsontable/blob/a823abcaa2d349166fef0f3df23de6fddb619814/src/plugins/copyPaste/focusableElement.js#L81

:::

_focusableWrapper.focus()_

Set focus to the focusable element.



### getFocusableElement
  
::: source-code-link https://github.com/handsontable/handsontable/blob/a823abcaa2d349166fef0f3df23de6fddb619814/src/plugins/copyPaste/focusableElement.js#L74

:::

_focusableWrapper.getFocusableElement() ⇒ HTMLElement_

Get currently set focusable element.



### setFocusableElement
  
::: source-code-link https://github.com/handsontable/handsontable/blob/a823abcaa2d349166fef0f3df23de6fddb619814/src/plugins/copyPaste/focusableElement.js#L60

:::

_focusableWrapper.setFocusableElement(element)_

Switch to the main focusable element.


| Param | Type | Description |
| --- | --- | --- |
| element | `HTMLElement` | The DOM element. |



### useSecondaryElement
  
::: source-code-link https://github.com/handsontable/handsontable/blob/a823abcaa2d349166fef0f3df23de6fddb619814/src/plugins/copyPaste/focusableElement.js#L44

:::

_focusableWrapper.useSecondaryElement()_

Switch to the secondary focusable element. Used when no any main focusable element is provided.



