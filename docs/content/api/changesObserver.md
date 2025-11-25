---
title: ChangesObserver
metaTitle: ChangesObserver - JavaScript Data Grid | Handsontable
permalink: /api/changes-observer
canonicalUrl: /api/changes-observer
searchCategory: API Reference
hotPlugin: false
editLink: false
id: n1d2orqc
description: Options, members, and methods of Handsontable's ChangesObserver API.
react:
  id: v5k5tou4
  metaTitle: ChangesObserver - React Data Grid | Handsontable
angular:
  id: n0g9p7st
  metaTitle: ChangesObserver - Angular Data Grid | Handsontable
---

# Plugin: ChangesObserver

[[toc]]

## Description

The ChangesObserver module is an object that represents a disposable resource
provided by the ChangesObservable module.


## Methods

### subscribe
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/translations/changesObservable/observer.js#L26

:::

_changesObserver.subscribe(callback) ⇒ [ChangesObserver](@/api/changesObserver.md)_

Subscribes to the observer.


| Param | Type | Description |
| --- | --- | --- |
| callback | `function` | A function that will be called when the new changes will appear. |



### unsubscribe
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/translations/changesObservable/observer.js#L39

:::

_changesObserver.unsubscribe() ⇒ [ChangesObserver](@/api/changesObserver.md)_

Unsubscribes all subscriptions. After the method call, the observer would not produce
any new events.


