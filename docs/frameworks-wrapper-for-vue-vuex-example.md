---
id: frameworks-wrapper-for-vue-vuex-example
title: Vuex example
sidebar_label: Vuex example
slug: /frameworks-wrapper-for-vue-vuex-example
---

An implementation of the `@handsontable/vue` component with a `readOnly` toggle switch and the Vuex state manager implemented.

  
 Toggle `readOnly` for the entire table

  

#### Vuex store dump:

```
<div id="example1"> <div id="example-preview" class="hot"> <div id="toggle-boxes"> <input v-on:click="toggleReadOnly" checked id="readOnlyCheck" type="checkbox"/><label for="readOnlyCheck"> Toggle <code>readOnly</code> for the entire table</label> </div> <hot-table ref="wrapper" :settings="hotSettings"></hot-table> </div> <div id="vuex-preview"> <h4>Vuex store dump:</h3> <table> </table> </div> </div>

Edit

import Vue from 'vue'; import { HotTable } from '@handsontable/vue'; import Handsontable from 'handsontable'; new Vue({ el: "#example1", data: function() { return { hotSettings: { data: Handsontable.helper.createSpreadsheetData(4, 4), colHeaders: true, rowHeaders: true, readOnly: false, afterChange: () => { if (this.hotRef) { this.$store.commit('updateData', this.hotRef.getSourceData()); } } }, hotRef: null }; }, mounted: function() { this.hotRef = this.$refs.wrapper.hotInstance; this.$store.subscribe((mutation, state) => { this.updateVuexPreview(); }); this.$store.commit('updateData', this.hotRef.getSourceData()); }, methods: { toggleReadOnly: function(event) { this.hotSettings.readOnly = event.target.checked; this.$store.commit('updateSettings', {prop: 'readOnly', value: this.hotSettings.readOnly}); }, updateVuexPreview: function() { // This method serves only as a renderer for the Vuex's state dump. const previewTable = document.querySelector('#vuex-preview table'); let newInnerHtml = '<tbody>'; for (const \[key, value\] of Object.entries(this.$store.state)) { newInnerHtml += \`<tr><td class="table-container">\`; if (key === 'hotData' && Array.isArray(value)) { newInnerHtml += \`<strong>hotData:</strong> <br/><table><tbody>\`; for (let row of value) { newInnerHtml += \`<tr>\`; for (let cell of row) { newInnerHtml += \`<td>${cell}</td>\`; } newInnerHtml += \`</tr>\`; } newInnerHtml += \`</tbody></table>\`; } else if (key === 'hotSettings') { newInnerHtml += \`<strong>hotSettings:</strong> <ul>\`; for (let settingsKey of Object.keys(value)) { newInnerHtml += \`<li>${settingsKey}: ${this.$store.state.hotSettings\[settingsKey\]}</li>\`; } newInnerHtml += \`</ul>\`; } newInnerHtml += \`</td></tr>\`; } newInnerHtml += \`</tbody>\`; previewTable.innerHTML = newInnerHtml; } }, components: { HotTable }, store: new Vuex.Store({ state: { hotData: null, hotSettings: { readOnly: false } }, mutations: { updateData(state, hotData) { state.hotData = hotData; }, updateSettings(state, updateObj) { state.hotSettings\[updateObj.prop\] = updateObj.value; } } }) });
```

[Edit this page](https://github.com/handsontable/docs/edit/8.2.0/tutorials/wrapper-for-vue-vuex-example.html)
