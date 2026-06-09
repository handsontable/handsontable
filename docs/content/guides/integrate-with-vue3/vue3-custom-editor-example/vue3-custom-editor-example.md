---
type: tutorial
id: 5864kf8v
title: Custom editor in Vue 3
metaTitle: Custom cell editor - Vue 3 Data Grid | Handsontable
description: Create a custom cell editor, and use it in your Vue 3 data grid by declaring it as a class.
permalink: /vue3-custom-editor-example
canonicalUrl: /vue3-custom-editor-example
react:
  id: vm94urge
  metaTitle: Custom cell editor - Vue 3 Data Grid | Handsontable
angular:
  id: nmw9ha36
  metaTitle: Custom cell editor - Vue 3 Data Grid | Handsontable
vue:
  id: 9a852yq1
searchCategory: Guides
category: Integrate with Vue 3
---
In this tutorial, you will create a custom cell editor as a Vue 3 component. You will learn to extend the BaseEditor class and register your editor with Handsontable.

[[toc]]

## Overview

You can declare a custom editor for the `HotTable` component by declaring it as a class and passing it to the Handsontable options or creating an editor component. You can use it many times and with different properties. To differentiate between editor instances, pass a `key` attribute.

[Find out which Vue 3 versions are supported](@/guides/integrate-with-vue3/vue3-installation/vue3-installation.md#vue-3-version-support)

## Example - Declaring an editor as a class

The following example implements the `@handsontable/vue3` component with a custom editor added, utilizing the `placeholder` attribute in the editor's `input` element.

::: example #example1 :vue3

@[code](@/content/guides/integrate-with-vue3/vue3-custom-editor-example/vue/example1.vue)

:::

## Related articles

**Related guides**

<div class="boxes-list">

- [Cell editor](@/guides/cell-functions/cell-editor/cell-editor.md)

</div>

**APIs**

<div class="boxes-list">

- [BasePlugin](@/api/basePlugin.md)

</div>

**Configuration options**

<div class="boxes-list">

- [editor](@/api/options.md#editor)
- [enterBeginsEditing](@/api/options.md#enterbeginsediting)

</div>

**Core methods**

<div class="boxes-list">

- [destroyEditor()](@/api/core.md#destroyeditor)
- [getActiveEditor()](@/api/core.md#getactiveeditor)
- [getCellEditor()](@/api/core.md#getcelleditor)
- [getCellMeta()](@/api/core.md#getcellmeta)
- [getCellMetaAtRow()](@/api/core.md#getcellmetaatrow)
- [getCellsMeta()](@/api/core.md#getcellsmeta)
- [setCellMeta()](@/api/core.md#setcellmeta)
- [setCellMetaObject()](@/api/core.md#setcellmetaobject)
- [removeCellMeta()](@/api/core.md#removecellmeta)

</div>

**Hooks**

<div class="boxes-list">

- [afterBeginEditing](@/api/hooks.md#afterbeginediting)
- [afterGetCellMeta](@/api/hooks.md#aftergetcellmeta)
- [beforeGetCellMeta](@/api/hooks.md#beforegetcellmeta)

</div>

## What you learned

- How to extend the `BaseEditor` class to build a custom editor.
- How to register a custom editor with a Handsontable column or the entire grid.
- How to pass a `key` attribute to differentiate between multiple editor instances.

## Next steps

- [Cell editor](@/guides/cell-functions/cell-editor/cell-editor.md) -- read the full editor API documentation.
- [HotColumn component in Vue 3](@/guides/getting-started/vue3-hot-column/vue3-hot-column.md) -- declare editors per column using HotColumn.
- [Custom renderer in Vue 3](@/guides/integrate-with-vue3/vue3-custom-renderer-example/vue3-custom-renderer-example.md) -- complement your editor with a custom renderer.
