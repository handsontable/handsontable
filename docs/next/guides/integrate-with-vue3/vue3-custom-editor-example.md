---
title: 'Custom editor in Vue 3'
metaTitle: 'Custom editor in Vue 3 - Guide - Handsontable Documentation'
permalink: /next/vue3-custom-editor-example
canonicalUrl: /vue3-custom-editor-example
---

# Custom editor  in Vue 3

[[toc]]

## Overview

You can declare a custom editor for the `HotTable` component by declaring it as a class and passing it to the Handsontable options or creating an editor component. You can use it many times and with different properties. To differentiate between editor instances, pass a `key` attribute.

[Find out which Vue 3 versions are supported](@/guides/integrate-with-vue3/vue3-installation.md#vue-3-version-support)

## Example - Declaring an editor as a class

The following example implements the `@handsontable/vue3` component with a custom editor added, utilizing the `placeholder` attribute in the editor's `input` element.

::: example #example1 :vue3 --html 1 --js 2
```html
<div id="example1">
  <hot-table :settings="hotSettings"></hot-table>
</div>
```
```js
import { createApp } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { TextEditor } from 'handsontable/editors/textEditor';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

class CustomEditor extends TextEditor {
  constructor(props) {
    super(props);
  }

  createElements() {
    super.createElements();

    this.TEXTAREA = document.createElement('input');
    this.TEXTAREA.setAttribute('placeholder', 'Custom placeholder');
    this.TEXTAREA.setAttribute('data-hot-input', true);
    this.textareaStyle = this.TEXTAREA.style;
    this.TEXTAREA_PARENT.innerText = '';
    this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);
  }
}

const app = createApp({
  data() {
    return {
      hotSettings: {
        startRows: 5,
        columns: [
          {
            editor: CustomEditor
          }
        ],
        colHeaders: true,
        colWidths: 200,
        licenseKey: 'non-commercial-and-evaluation'
      }
    }
  },
  components: {
    HotTable,
  }
});

app.mount('#example1');
```
:::

## Related articles

#### Related guides

- [Adding comments via the context menu](@/guides/cell-features/comments.md#adding-comments-via-the-context-menu)
- [Clipboard: Context menu](@/guides/cell-features/clipboard.md#context-menu)
- [Context menu](@/guides/accessories-and-menus/context-menu.md)
- [Icon pack](@/guides/accessories-and-menus/icon-pack.md)

#### Related blog articles

- [Customize Handsontable context menu](https://handsontable.com/blog/customize-handsontable-context-menu)

#### Related API reference

- APIs:
  - [`BasePlugin`](@/api/basePlugin.md)
- Configuration options:
  - [`editor`](@/api/options.md#editor)
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
  - [`afterSetCellMeta`](@/api/hooks.md#aftersetcellmeta)
  - [`beforeGetCellMeta`](@/api/hooks.md#beforegetcellmeta)
  - [`beforeSetCellMeta`](@/api/hooks.md#beforesetcellmeta)