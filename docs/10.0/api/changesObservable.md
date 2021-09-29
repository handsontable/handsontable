---
title: ChangesObservable
metaTitle: ChangesObservable - API Reference - Handsontable Documentation
permalink: /10.0/api/changes-observable
canonicalUrl: /api/changes-observable
hotPlugin: false
editLink: false
---

# ChangesObservable

[[toc]]

## Description

The ChangesObservable module is an object that represents a resource that provides
the ability to observe the changes that happened in the index map indexes during
the code running.


## Methods

### emit
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/translations/changesObservable/observable.js#L103

:::

_changesObservable.emit(indexesState)_

The method is an entry point for triggering new index map changes. Emitting the
changes triggers comparing algorithm which compares last saved state with a new
state. When there are some differences, the changes are sent to all subscribers.


| Param | Type | Description |
| --- | --- | --- |
| indexesState | `Array` | An array with index map state. |


