---
title: Custom editor example
metaTitle: Custom editor example - Guide - Handsontable Documentation
permalink: /10.0/vue-custom-editor-example
canonicalUrl: /vue-custom-editor-example
---

# Custom editor example

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
import Vue from 'vue';
import { HotTable } from '@handsontable/vue';
import Handsontable from 'handsontable';

class CustomEditor extends Handsontable.editors.TextEditor {
  constructor(props) {
    super(props);
  }

  createElements() {
    super.createElements();

    this.TEXTAREA = document.createElement('input');
    this.TEXTAREA.setAttribute('placeholder', 'Custom placeholder');
    this.TEXTAREA.setAttribute('data-hot-input', true);
    this.textareaStyle = this.TEXTAREA.style;
    Handsontable.dom.empty(this.TEXTAREA_PARENT);
    this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);
  }
}

new Vue({
  el: '#example1',
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
});
```
:::
