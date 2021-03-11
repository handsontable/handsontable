---
title: Custom editor example
permalink: /next/vue-custom-editor-example
canonicalUrl: /vue-custom-editor-example
---

# {{ $frontmatter.title }}

[[toc]]

You can declare a custom editor for the `HotTable` component either by declaring it as a class and passing it to the Handsontable options, or create an editor component.

Since version 5.1.0 of the Vue wrapper, you can declare a custom editor for the `HotTable` component and use it many times and with different props. To differenciate between editor instances pass a `key` attribute.

## Declaring an editor as a class

An implementation of the `@handsontable/vue` component with a custom editor added. It utilizes the `placeholder` attribute in the editor's `input` element.

```html
<div id="example1" class="hot">
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
  data: function() {
    return {
      hotSettings: {
        startRows: 5,
        columns: [
          {
            editor: CustomEditor
          }
        ],
        colHeaders: true,
        colWidths: 200
      }
    }
  },
  components: {
    HotTable
  }
});
```
