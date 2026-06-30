---
title: ChangesObservable
metaTitle: ChangesObservable API reference – JavaScript Data Grid | Handsontable
permalink: /api/changes-observable
canonicalUrl: /api/changes-observable
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]

## Description

Initializes the observable with an optional initial index value used as the baseline for generating first-time change events.


## Methods

### createObserver

::: ask-about-api createObserver|ChangesObservable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/changesObservable/observable.ts#L103

:::

_changesObservable.createObserver() ⇒ [ChangesObserver](@/api/changesObserver.md)_

Creates and returns a new instance of the ChangesObserver object. The resource
allows subscribing to the index changes that during the code running may change.
Changes are emitted as an array of the index change. Each change is represented
separately as an object with `op`, `index`, `oldValue`, and `newValue` props.

For example:
```
[
  { op: 'replace', index: 1, oldValue: false, newValue: true },
  { op: 'replace', index: 3, oldValue: false, newValue: true },
  { op: 'insert', index: 4, oldValue: false, newValue: true },
]
// or when the new index map changes have less indexes
[
  { op: 'replace', index: 1, oldValue: false, newValue: true },
  { op: 'remove', index: 4, oldValue: false, newValue: true },
]
```



### emit

::: ask-about-api emit|ChangesObservable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/changesObservable/observable.ts#L118

:::

_changesObservable.emit(indexesState)_

The method is an entry point for triggering new index map changes. Emitting the
changes triggers comparing algorithm which compares last saved state with a new
state. When there are some differences, the changes are sent to all subscribers.


| Param | Type | Description |
| --- | --- | --- |
| indexesState | `Array` | An array with index map state. |


