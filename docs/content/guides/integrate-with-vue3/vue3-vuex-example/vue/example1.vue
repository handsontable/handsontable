<script setup>
import { ref, onMounted } from 'vue';
import { createStore } from 'vuex';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

const store = createStore({
  state() {
    return {
      hotData: null,
      hotSettings: {
        readOnly: false,
        autoWrapRow: true,
        autoWrapCol: true,
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

const wrapper = ref(null);
const hotSettings = ref({
  data: [
    ['A1', 'B1', 'C1', 'D1'],
    ['A2', 'B2', 'C2', 'D2'],
    ['A3', 'B3', 'C3', 'D3'],
    ['A4', 'B4', 'C4', 'D4'],
  ],
  colHeaders: true,
  rowHeaders: true,
  readOnly: true,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  afterChange: () => {
    if (wrapper.value) {
      store.commit('updateData', wrapper.value.hotInstance.getSourceData());
    }
  },
  licenseKey: 'non-commercial-and-evaluation'
});

function toggleReadOnly(event) {
  hotSettings.value.readOnly = event.target.checked;
  store.commit('updateSettings', { prop: 'readOnly', value: hotSettings.value.readOnly });
}

function updateVuexPreview() {
  const previewTable = document.querySelector('#vuex-preview pre');
  let newInnerHtml = '<div>';

  for (const [key, value] of Object.entries(store.state)) {
    newInnerHtml += '<div><div class="table-container">';

    if (key === 'hotData' && Array.isArray(value)) {
      newInnerHtml += '<strong>hotData:</strong> <br><table><tbody>';

      for (const row of value) {
        newInnerHtml += '<tr>';

        for (const cell of row) {
          newInnerHtml += `<td>${cell}</td>`;
        }

        newInnerHtml += '</tr>';
      }
      newInnerHtml += '</tbody></table>';

    } else if (key === 'hotSettings') {
      newInnerHtml += '<strong>hotSettings:</strong> <ul>';

      for (const settingsKey of Object.keys(value)) {
        newInnerHtml += `<li>${settingsKey}: ${store.state.hotSettings[settingsKey]}</li>`;
      }

      newInnerHtml += '</ul>';
    }

    newInnerHtml += '</div></div>';
  }
  newInnerHtml += '</div>';

  previewTable.innerHTML = newInnerHtml;
}

onMounted(() => {
  store.subscribe(() => updateVuexPreview());
  store.commit('updateData', wrapper.value.hotInstance.getSourceData());
});
</script>

<template>
  <div id="example1">
    <div class="example-controls-container">
      <div class="controls">
        <label><input v-on:click="toggleReadOnly" checked id="readOnlyCheck" type="checkbox" /> Toggle <code>readOnly</code> for the entire table</label>
      </div>
    </div>
    <HotTable ref="wrapper" :settings="hotSettings" />
    <div id="vuex-preview">
      <strong>Vuex store dump:</strong>
      <pre></pre>
    </div>
  </div>
</template>

<style>
#vuex-preview {
  margin-top: 0.75rem;
}

#vuex-preview strong {
  display: block;
  margin-bottom: 0.375rem;
  color: var(--sl-color-gray-2, #555555);
  font-family: var(--sl-font, Inter, system-ui, -apple-system, sans-serif);
  font-size: var(--sl-text-xs, 0.75rem);
}

#vuex-preview pre {
  height: 168px;
  padding: 0.5rem 0.75rem;
  overflow-y: auto;
  font-size: var(--sl-text-xs, 0.75rem);
  font-family: var(--sl-font-mono, ui-monospace, monospace);
  line-height: 1.6;
  border: 1px solid var(--sl-color-gray-5, #e0e0e0);
  background: var(--sl-color-gray-7, #f5f5f5);
  color: var(--sl-color-gray-2, #555555);
  margin: 0;
  border-radius: 0;
}

#vuex-preview pre .table-container {
  margin-bottom: 0.375rem;
}

#vuex-preview pre table {
  border-collapse: collapse;
  margin: 0.25rem 0;
  font-size: var(--sl-text-xs, 0.75rem);
}

#vuex-preview pre td {
  padding: 0.125rem 0.5rem 0.125rem 0;
  color: var(--sl-color-gray-2, #555555);
  border: none;
}

#vuex-preview pre ul {
  margin: 0.125rem 0 0;
  padding-left: 1.25rem;
  list-style: disc;
}

#vuex-preview pre li {
  padding: 0.0625rem 0;
  color: var(--sl-color-gray-2, #555555);
}
</style>
