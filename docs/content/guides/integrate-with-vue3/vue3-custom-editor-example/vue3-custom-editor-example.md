---
id: 5864kf8v
title: Custom editor in Vue 3
metaTitle: Custom cell editor - Vue 3 Data Grid | Handsontable
description: Create a custom cell editor, and use it in your Vue 3 data grid by declaring it as a class.
permalink: /vue3-custom-editor-example
canonicalUrl: /vue3-custom-editor-example
react:
  id: vm94urge
  metaTitle: Custom cell editor - Vue 3 Data Grid | Handsontable
searchCategory: Guides
category: Integrate with Vue 3
---

# Custom editor  in Vue 3

Create a custom cell editor, and use it in your Vue 3 data grid by declaring it as a class.

[[toc]]

## Overview

You can declare a custom editor for the `HotTable` component by declaring it as a class and passing it to the Handsontable options or creating an editor component. You can use it many times and with different properties. To differentiate between editor instances, pass a `key` attribute.

[Find out which Vue 3 versions are supported](@/guides/integrate-with-vue3/vue3-installation/vue3-installation.md#vue-3-version-support)

## Example - Declaring an editor as a class

The following example implements the `@handsontable/vue3` component with a custom editor added, utilizing the `placeholder` attribute in the editor's `input` element.

::: example #example1 :vue3 --html 1 --js 2

@[code](@/content/guides/integrate-with-vue3/vue3-custom-editor-example/vue/example1.html)
@[code](@/content/guides/integrate-with-vue3/vue3-custom-editor-example/vue/example1.js)

:::

## Related articles

### Related guides

<div class="boxes-list gray">

- [Cell editor](@/guides/cell-functions/cell-editor/cell-editor.md)

</div>

### Related API reference

- APIs:
  - [`BasePlugin`](@/api/basePlugin.md)
- Configuration options:
  - [`editor`](@/api/options.md#editor)
  - [`enterBeginsEditing`](@/api/options.md#enterbeginsediting)
- Core methods:
  - [`destroyEditor()`](@/api/core.md#destroyeditor)
  - [`getActiveEditor()`](@/api/core.md#getactiveeditor)
  - [`getCellEditor()`](@/api/core.md#getcelleditor)
  - [`getCellMeta()`](@/api/core.md#getcellmeta)
  - [`getCellMetaAtRow()`](@/api/core.md#getcellmetaatrow)
  - [`getCellsMeta()`](@/api/core.md#getcellsmeta)
  - [`setCellMeta()`](@/api/core.md#setcellmeta)
  - [`setCellMetaObject()`](@/api/core.md#setcellmetaobject)
  - [`removeCellMeta()`](@/api/core.md#removecellmeta)
- Hooks:
  - [`afterBeginEditing`](@/api/hooks.md#afterbeginediting)
  - [`afterGetCellMeta`](@/api/hooks.md#aftergetcellmeta)
  - [`beforeGetCellMeta`](@/api/hooks.md#beforegetcellmeta)
