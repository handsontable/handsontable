---
title: Language change example
metaTitle: Language change example - Guide - Handsontable Documentation
permalink: /9.0/vue-language-change-example
canonicalUrl: /vue-language-change-example
---

# Language change example

The following example implements the `@handsontable/vue` component with the option to change the Context Menu language configured. Select a language from the selector above the table and open the Context Menu to see the result.

:::tip
Note that the `language` property is bound to the component separately using `language={this.language}"`, but it could be included in the `settings` property just as well.
:::

## Example - Select language

::: example #example1 :vue-languages --html 1 --js 2
```html
<div id="example1">
  <label for="languages">Select language:</label>
  <select v-on:change="updateHotLanguage" id="languages"></select><br/>
  <br/>
  <hot-table :language="language" :settings="hotSettings"></hot-table>
</div>
```
```js
import Vue from 'vue';
import { HotTable } from '@handsontable/vue';
import Handsontable from 'handsontable';

new Vue({
  el: '#example1',
  data() {
    return {
      hotSettings: {
        data: Handsontable.helper.createSpreadsheetData(5, 10),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
        height: 'auto',
        licenseKey: 'non-commercial-and-evaluation'
      },
      language: 'en-US'
    }
  },
  mounted() {
    this.getAllLanguageOptions();
  },
  methods: {
    getAllLanguageOptions() {
      const allDictionaries = Handsontable.languages.getLanguagesDictionaries();
      const langSelect = document.querySelector('#languages');
      langSelect.innerHTML = '';

      for (let language of allDictionaries) {
        langSelect.innerHTML += `<option value="${language.languageCode}">${language.languageCode}</option>`
      }
    },
    updateHotLanguage(event) {
      this.language = event.target.value;
    }
  },
  components: {
    HotTable
  }
});
```
:::
