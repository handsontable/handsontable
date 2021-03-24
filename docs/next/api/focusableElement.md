---
title: FocusableElement
permalink: /next/api/focusable-element
canonicalUrl: /api/focusable-element
editLink: false
---

# FocusableElement

[[toc]]
## Members:

### container

_focusableWrapper.container : HTMLElement_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/copyPaste/focusableElement.js#L38)

Parent for an focusable element.



### eventManager

_focusableWrapper.eventManager : EventManager_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/copyPaste/focusableElement.js#L26)

Instance of EventManager.



### listenersCount

_focusableWrapper.listenersCount : WeakSet_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/copyPaste/focusableElement.js#L32)

An object for tracking information about event listeners attached to the focusable element.



### mainElement

_focusableWrapper.mainElement : HTMLElement_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/copyPaste/focusableElement.js#L20)

The main/operational focusable element.


## Methods:

### focus

_focusableWrapper.focus()_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/copyPaste/focusableElement.js#L81)

Set focus to the focusable element.



### getFocusableElement

_focusableWrapper.getFocusableElement() ⇒ HTMLElement_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/copyPaste/focusableElement.js#L74)

Get currently set focusable element.



### setFocusableElement

_focusableWrapper.setFocusableElement(element)_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/copyPaste/focusableElement.js#L60)

Switch to the main focusable element.


| Param | Type | Description |
| --- | --- | --- |
| element | `HTMLElement` | The DOM element. |



### useSecondaryElement

_focusableWrapper.useSecondaryElement()_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/copyPaste/focusableElement.js#L44)

Switch to the secondary focusable element. Used when no any main focusable element is provided.



