---
title: 'Vuex in Vue 3'
metaTitle: 'Vuex in Vue 3 - Guide - Handsontable Documentation'
permalink: /12.1/vue3-vuex-example
canonicalUrl: /vue3-vuex-example
---

# Vuex in Vue 3

[[toc]]

## Overview

The following example implements the `@handsontable/vue3` component with a [`readOnly`](@/api/options.md#readonly) toggle switch and the Vuex state manager.

[Find out which Vue 3 versions are supported](@/guides/integrate-with-vue3/vue3-installation.md#vue-3-version-support)

## Example - Vuex store dump:

Toggle [`readOnly`](@/api/options.md#readonly) for the entire table.

::: example #example1 :vue3-vuex --html 1 --js 2
```html
<div id="example1">
  <div id="example-preview">
    <div id="toggle-boxes">
      <br/>
      <input v-on:click="toggleReadOnly" checked id="readOnlyCheck" type="checkbox"/>
      <label for="readOnlyCheck"> Toggle <code>readOnly</code> for the entire table</label>
    </div>
    <br/>
    <hot-table ref="wrapper" :settings="hotSettings"></hot-table>
  </div>
  <div id="vuex-preview">
    <h4>Vuex store dump:</h4>
    <table></table>
  </div>
</div>
```
```js
import { createApp } from 'vue';
import { createStore } from 'vuex';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import { createSpreadsheetData } from './helpers';

// register Handsontable's modules
registerAllModules();

const store = createStore({
  state() {
    return {
      hotData: null,
      hotSettings: {
        readOnly: false
      }
    };
  },
  mutations: {
    updateData(state, hotData) {
      state.hotData = hotData;
    },
    updateSettings(state, updateObj) {
      state.hotSettings[updateObj.prop] = updateObj.value;
    }
  }
});

const app = createApp({
  data() {
    return {
      hotSettings: {
        data: createSpreadsheetData(4, 4),
        colHeaders: true,
        rowHeaders: true,
        readOnly: true,
        height: 'auto',
        afterChange: () => {
          if (this.hotRef) {
            store.commit('updateData', this.hotRef.getSourceData());
          }
        },
        licenseKey: 'non-commercial-and-evaluation'
      },
      hotRef: null
    }
  },
  mounted() {
    this.hotRef = this.$refs.wrapper.hotInstance;
    store.subscribe((mutation, state) => {
      this.updateVuexPreview();
    });
    store.commit('updateData', this.hotRef.getSourceData());
  },
  methods: {
    toggleReadOnly(event) {
      this.hotSettings.readOnly = event.target.checked;
      store.commit('updateSettings', {prop: 'readOnly', value: this.hotSettings.readOnly});
    },
    updateVuexPreview() {
      // This method serves only as a renderer for the Vuex's state dump.
      const previewTable = document.querySelector('#vuex-preview table');
      let newInnerHtml = '<tbody>';

      for (const [key, value] of Object.entries(store.state)) {
        newInnerHtml += `<tr><td class="table-container">`;

        if (key === 'hotData' && Array.isArray(value)) {
          newInnerHtml += `<strong>hotData:</strong> <br><table><tbody>`;

          for (let row of value) {
            newInnerHtml += `<tr>`;

            for (let cell of row) {
              newInnerHtml += `<td>${cell}</td>`;
            }

            newInnerHtml += `</tr>`;
          }
          newInnerHtml += `</tbody></table>`;

        } else if (key === 'hotSettings') {
          newInnerHtml += `<strong>hotSettings:</strong> <ul>`;

          for (let settingsKey of Object.keys(value)) {
            newInnerHtml += `<li>${settingsKey}: ${store.state.hotSettings[settingsKey]}</li>`;
          }

          newInnerHtml += `</ul>`;
        }

        newInnerHtml += `</td></tr>`;
      }
      newInnerHtml += `</tbody>`;

      previewTable.innerHTML = newInnerHtml;
    }
  },
  components: {
    HotTable,
  }
});

app.use(store);
app.mount('#example1');
```
:::
