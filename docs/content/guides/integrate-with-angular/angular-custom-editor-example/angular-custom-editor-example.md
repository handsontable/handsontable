---
id: 161z7hq7
title: Custom editor in Angular
metaTitle: Custom cell editor - Angular Data Grid | Handsontable
description: Create a custom cell editor, and use it in your Angular data grid by declaring it as a class.
permalink: /angular-custom-editor-example
canonicalUrl: /angular-custom-editor-example
react:
  id: q5mi9bqw
  metaTitle: Custom cell editor - Angular Data Grid | Handsontable
searchCategory: Guides
category: Integrate with Angular
---

# Custom editor example in Angular

Create a custom cell editor, and use it in your Angular data grid by declaring it as a class.

[[toc]]

## Example

The following is an implementation of the `@handsontable/angular` component with a custom editor added. It utilizes the `placeholder` attribute in the editor's `input` element.

::: example :angular --html 1 --js 2

@[code](@/content/guides/integrate-with-angular/angular-custom-editor-example/angular/example1.html)
@[code](@/content/guides/integrate-with-angular/angular-custom-editor-example/angular/example1.js)

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
