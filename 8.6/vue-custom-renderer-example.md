---
title: Custom renderer example
permalink: /8.6/vue-custom-renderer-example
canonicalUrl: /vue-custom-renderer-example
---

# {{ $frontmatter.title }}

[[toc]]

You can declare a custom renderer for the `HotTable` component either by declaring it as a function in the Handsontable options, or create a rendering component.

## Declaring a renderer as a function

```html
<div id="example1" class="hot">
  <hot-table :settings="hotSettings"></hot-table>
</div>
```
```js
import Vue from 'vue';
import { HotTable } from '@handsontable/vue';
import Handsontable from 'handsontable';

new Vue({
  el: '#example1',
  data: function() {
    return {
      hotSettings: {
        data:
          [
            ['A1', 'https://handsontable.com/docs/images/examples/professional-javascript-developers-nicholas-zakas.jpg'],
            ['A2', 'https://handsontable.com/docs/images/examples/javascript-the-good-parts.jpg']],
        columns: [
          {},
          {
            renderer: function(instance, td, row, col, prop, value, cellProperties) {
              const escaped = Handsontable.helper.stringify(value);
              let img = null;

              if (escaped.indexOf('http') === 0) {
                img = document.createElement('IMG');
                img.src = value;

                Handsontable.dom.addEvent(img, 'mousedown', function(event) {
                  event.preventDefault();
                });

                Handsontable.dom.empty(td);
                td.appendChild(img);
              } else {
                Handsontable.renderers.TextRenderer.apply(this, arguments);
              }

              return td;
            }
          }
        ],
        colHeaders: true,
        rowHeights: 55
      }
    }
  },
  components: {
    HotTable
  }
});
```
