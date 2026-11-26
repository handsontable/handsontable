---
title: ChangesObserver
metaTitle: ChangesObserver | Handsontable DataGrid for JavaScript
permalink: /api/changes-observer
canonicalUrl: /api/changes-observer
searchCategory: API Reference
hotPlugin: false
editLink: false
id: n1d2orqc
description: Options, members, and methods of Handsontable DataGrid's ChangesObserver API.
react:
  id: v5k5tou4
  metaTitle: ChangesObserver | Handsontable DataGrid for React
angular:
  id: n0g9p7st
  metaTitle: ChangesObserver | Handsontable DataGrid for Angular
---

[[toc]]
## Methods

### subscribe

::: ask-about-api subscribe|ChangesObserver

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/translations/changesObservable/observer.ts#L71

:::

_changesObserver.subscribe(callback) ⇒ [ChangesObserver](@/api/changesObserver.md)_

Subscribes to the observer.


| Param | Type | Description |
| --- | --- | --- |
| callback | `function` | A function that will be called when the new changes will appear. |



### unsubscribe

::: ask-about-api unsubscribe|ChangesObserver

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/translations/changesObservable/observer.ts#L81

:::

_changesObserver.unsubscribe() ⇒ [ChangesObserver](@/api/changesObserver.md)_

Unsubscribes all subscriptions. After the method call, the observer would not produce
any new events.


