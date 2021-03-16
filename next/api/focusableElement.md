---
title: FocusableElement
permalink: /next/api/focusable-element
canonicalUrl: /api/focusable-element
---

# {{ $frontmatter.title }}

[[toc]]
## Members:

### container

_focusableWrapper.container : HTMLElement_

Parent for an focusable element.



### eventManager

_focusableWrapper.eventManager : EventManager_

Instance of EventManager.



### listenersCount

_focusableWrapper.listenersCount : WeakSet_

An object for tracking information about event listeners attached to the focusable element.



### mainElement

_focusableWrapper.mainElement : HTMLElement_

The main/operational focusable element.


## Methods:

### focus

_focusableWrapper.focus()_

Set focus to the focusable element.



### getFocusableElement

_focusableWrapper.getFocusableElement() ⇒ HTMLElement_

Get currently set focusable element.



### setFocusableElement

_focusableWrapper.setFocusableElement(element)_

Switch to the main focusable element.


| Param | Type | Description |
| --- | --- | --- |
| element | `HTMLElement` | The DOM element. |



### useSecondaryElement

_focusableWrapper.useSecondaryElement()_

Switch to the secondary focusable element. Used when no any main focusable element is provided.



