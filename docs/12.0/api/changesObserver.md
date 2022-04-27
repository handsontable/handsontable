---
title: ChangesObserver
metaTitle: ChangesObserver - API Reference - Handsontable Documentation
permalink: /12.0/api/changes-observer
canonicalUrl: /api/changes-observer
hotPlugin: false
editLink: false
---

# ChangesObserver

[[toc]]

## Description

The ChangesObserver module is an object that represents a disposable resource
provided by the ChangesObservable module.


## Methods

### subscribe
  
::: source-code-link https://github.com/handsontable/handsontable/blob/92725e660e6a9b7df7b6d889aeab2022cbf4b4a7/handsontable/src/translations/changesObservable/observer.js#L26

:::

_changesObserver.subscribe(callback) ⇒ [ChangesObserver](@/api/changesObserver.md)_

Subscribes to the observer.


| Param | Type | Description |
| --- | --- | --- |
| callback | `function` | A function that will be called when the new changes will appear. |



### unsubscribe
  
::: source-code-link https://github.com/handsontable/handsontable/blob/92725e660e6a9b7df7b6d889aeab2022cbf4b4a7/handsontable/src/translations/changesObservable/observer.js#L39

:::

_changesObserver.unsubscribe() ⇒ [ChangesObserver](@/api/changesObserver.md)_

Unsubscribes all subscriptions. After the method call, the observer would not produce
any new events.


