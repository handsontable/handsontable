---
id: frameworks-wrapper-for-vue-language-change-example
title: Language change example
sidebar_label: Language change example
slug: /frameworks-wrapper-for-vue-language-change-example
---

An implementation of the `@handsontable/vue` component with an option to change the Context Menu language.  
Select a language from the selector above the table and open the Context Menu to see the result.  
  
Note, that the `language` property is bound to the component separately (by using `:language="language"`), but it could be included in the `:settings` prop just as well.

Select language:  
  
```
<div id="example1" class="hot"> <label for="languages">Select language: </label><select v-on:change="updateHotLanguage" id="languages"></select><br/><br/> <hot-table :language="language" :settings="hotSettings"></hot-table> </div>

Edit

import Vue from 'vue'; import { HotTable } from '@handsontable/vue'; import Handsontable from 'handsontable'; new Vue({ el: '#example1', data: function() { return { hotSettings: { data: Handsontable.helper.createSpreadsheetData(5, 10), colHeaders: true, rowHeaders: true, contextMenu: true }, language: 'en-US' } }, mounted: function() { this.getAllLanguageOptions(); }, methods: { getAllLanguageOptions: function() { const allDictionaries = Handsontable.languages.getLanguagesDictionaries(); const langSelect = document.querySelector('#languages'); langSelect.innerHTML = ''; for (let language of allDictionaries) { langSelect.innerHTML += \`<option value="${language.languageCode}">${language.languageCode}</option>\` } }, updateHotLanguage: function(event) { this.language = event.target.value; } }, components: { HotTable } });
```

