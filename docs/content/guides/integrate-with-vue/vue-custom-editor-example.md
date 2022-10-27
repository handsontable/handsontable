---
title: Custom editor in Vue 2
metaTitle: Custom cell editor - Vue 2 Data Grid | Handsontable
description: Create a custom cell editor, and use it in your Vue 2 data grid by declaring it as a class.
permalink: /vue-custom-editor-example
canonicalUrl: /vue-custom-editor-example
searchCategory: Guides
---

# Custom editor in Vue 2

Create a custom cell editor, and use it in your Vue 2 data grid by declaring it as a class.

[[toc]]

## Overview

You can declare a custom editor for the `HotTable` component by declaring it as a class and passing it to the Handsontable options or creating an editor component. You can use it many times and with different properties. To differentiate between editor instances, pass a `key` attribute.

## Example - Declaring an editor as a class

The following example implements the `@handsontable/vue` component with a custom editor added, utilizing the `placeholder` attribute in the editor's `input` element.

::: example #example1 :vue --html 1 --js 2
```html
<div id="example1">
  <hot-table :settings="hotSettings"></hot-table>
</div>
```
```js
import { HotTable } from '@handsontable/vue';
import { TextEditor } from 'handsontable/editors/textEditor';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.css';

// register Handsontable's modules
registerAllModules();

class CustomEditor extends TextEditor {
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

import 'handsontable/dist/handsontable.full.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = {
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
    HotTable
  }
}

export default ExampleComponent;

/* start:skip-in-preview */
new Vue({
  ...ExampleComponent,
  el: '#example1',
});
/* end:skip-in-preview */
```
:::

## Related articles

### Related guides

- [Cell editor](@/guides/cell-functions/cell-editor.md)

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
