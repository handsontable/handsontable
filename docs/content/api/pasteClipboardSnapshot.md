---
title: PasteClipboardSnapshot
metaTitle: PasteClipboardSnapshot API reference | Handsontable DataGrid for JavaScript
permalink: /api/paste-clipboard-snapshot
canonicalUrl: /api/paste-clipboard-snapshot
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]

## Description

Copies the string flavors of `source`. With `copyEveryType` off nothing is copied, because a
paste with no callback reads the source directly.


## Members

### types

::: ask-about-api types|PasteClipboardSnapshot

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/copyPaste/pasteClipboardData.ts#L100

:::

_pasteClipboardSnapshot.types_

The flavors currently in the snapshot.


## Methods

### clearData

::: ask-about-api clearData|PasteClipboardSnapshot

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/copyPaste/pasteClipboardData.ts#L117

:::

_pasteClipboardSnapshot.clearData()_

Removes one flavor, or all of them when called without an argument.



### getData

::: ask-about-api getData|PasteClipboardSnapshot

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/copyPaste/pasteClipboardData.ts#L105

:::

_pasteClipboardSnapshot.getData()_

Returns the content of a flavor, or `''` when it is absent, as `DataTransfer` does.



### isChanged

::: ask-about-api isChanged|PasteClipboardSnapshot

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/copyPaste/pasteClipboardData.ts#L129

:::

_pasteClipboardSnapshot.isChanged()_

Whether a flavor holds another string than it did when the snapshot was built.



### resolve

::: ask-about-api resolve|PasteClipboardSnapshot

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/copyPaste/pasteClipboardData.ts#L138

:::

_pasteClipboardSnapshot.resolve()_

Returns the content of a known flavor for the plugin to parse: `undefined` when there is none.

A flavor no callback touched answers exactly what the source does, which is the behavior from
before the hook existed. A flavor a callback set or cleared answers what the callbacks left.



### setData

::: ask-about-api setData|PasteClipboardSnapshot

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/copyPaste/pasteClipboardData.ts#L110

:::

_pasteClipboardSnapshot.setData()_

Sets the content of a flavor.


