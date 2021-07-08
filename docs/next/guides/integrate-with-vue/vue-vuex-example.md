---
title: Vuex example
metaTitle: Vuex example - Guide - Handsontable Documentation
permalink: /next/vue-vuex-example
canonicalUrl: /vue-vuex-example
---

# Vuex example

[[toc]]

## Overview

The following example implements the `@handsontable/vue` component with a `readOnly` toggle switch and the Vuex state manager.

## Example - Vuex store dump:

Toggle `readOnly` for the entire table.

::: example #example1 :vue-vuex --html 1 --js 2
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
import Vue from 'vue';
import { HotTable } from '@handsontable/vue';
import Handsontable from 'handsontable';

new Vue({
  el: "#example1",
  data() {
    return {
      hotSettings: {
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        colHeaders: true,
        rowHeaders: true,
        readOnly: true,
        height: 'auto',
        afterChange: () => {
          if (this.hotRef) {
            this.$store.commit('updateData', this.hotRef.getSourceData());
          }
        },
        licenseKey: 'non-commercial-and-evaluation'
      },
      hotRef: null
    };
  },
  mounted() {
    this.hotRef = this.$refs.wrapper.hotInstance;
    this.$store.subscribe((mutation, state) => {
      this.updateVuexPreview();
    });
    this.$store.commit('updateData', this.hotRef.getSourceData());
  },
  methods: {
    toggleReadOnly(event) {
      this.hotSettings.readOnly = event.target.checked;
      this.$store.commit('updateSettings', {prop: 'readOnly', value: this.hotSettings.readOnly});
    },
    updateVuexPreview() {
      // This method serves only as a renderer for the Vuex's state dump.

      const previewTable = document.querySelector('#vuex-preview table');
      let newInnerHtml = '<tbody>';

      for (const [key, value] of Object.entries(this.$store.state)) {
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
            newInnerHtml += `<li>${settingsKey}: ${this.$store.state.hotSettings[settingsKey]}</li>`;
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
    HotTable
  },
  store: new Vuex.Store({
    state: {
      hotData: null,
      hotSettings: {
        readOnly: false
      }
    },
    mutations: {
      updateData(state, hotData) {
        state.hotData = hotData;
      },
      updateSettings(state, updateObj) {
        state.hotSettings[updateObj.prop] = updateObj.value;
      }
    }
  })
});
```
:::
