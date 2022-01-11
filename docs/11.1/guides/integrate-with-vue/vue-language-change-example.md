---
title: 'Language change in Vue 2'
metaTitle: 'Language change in Vue 2 - Guide - Handsontable Documentation'
permalink: /11.1/vue-language-change-example
canonicalUrl: /vue-language-change-example
---

# Language change in Vue 2

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
import { getLanguagesDictionaries } from 'handsontable/i18n';
import { registerAllModules } from 'handsontable/registry';
import { createSpreadsheetData } from './helpers';

// register Handsontable's modules
registerAllModules();

new Vue({
  el: '#example1',
  data() {
    return {
      hotSettings: {
        data: createSpreadsheetData(5, 10),
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
      const allDictionaries = getLanguagesDictionaries();
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
