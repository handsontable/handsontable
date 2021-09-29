---
title: FocusableWrapper
metaTitle: FocusableWrapper - API Reference - Handsontable Documentation
permalink: /10.0/api/focusable-wrapper
canonicalUrl: /api/focusable-wrapper
hotPlugin: false
editLink: false
---

# FocusableWrapper

[[toc]]
## Options

### copyPaste
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/metaManager/metaSchema.js#L1818

:::

_copyPaste.copyPaste : object | boolean_

Disables or enables the copy/paste functionality.

**Default**: <code>true</code>  
**Example**  
```js
// disable copy and paste
copyPaste: false,

// enable copy and paste with custom configuration
copyPaste: {
  columnsLimit: 25,
  rowsLimit: 50,
  pasteMode: 'shift_down',
  uiContainer: document.body,
},
```

## Methods
## Members

### container
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/copyPaste/focusableElement.js#L38

:::

_focusableWrapper.container : HTMLElement_

Parent for an focusable element.



### eventManager
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/copyPaste/focusableElement.js#L26

:::

_focusableWrapper.eventManager : [EventManager](@/api/eventManager.md)_

Instance of EventManager.



### listenersCount
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/copyPaste/focusableElement.js#L32

:::

_focusableWrapper.listenersCount : WeakSet_

An object for tracking information about event listeners attached to the focusable element.



### mainElement
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/copyPaste/focusableElement.js#L20

:::

_focusableWrapper.mainElement : HTMLElement_

The main/operational focusable element.


## Methods

### focus
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/copyPaste/focusableElement.js#L81

:::

_focusableWrapper.focus()_

Set focus to the focusable element.



### getFocusableElement
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/copyPaste/focusableElement.js#L74

:::

_focusableWrapper.getFocusableElement() ⇒ HTMLElement_

Get currently set focusable element.



### setFocusableElement
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/copyPaste/focusableElement.js#L60

:::

_focusableWrapper.setFocusableElement(element)_

Switch to the main focusable element.


| Param | Type | Description |
| --- | --- | --- |
| element | `HTMLElement` | The DOM element. |



### useSecondaryElement
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/copyPaste/focusableElement.js#L44

:::

_focusableWrapper.useSecondaryElement()_

Switch to the secondary focusable element. Used when no any main focusable element is provided.


