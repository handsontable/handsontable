import { createStore } from 'vuex';
import { defineComponent } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
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

const ExampleComponent = defineComponent({
  data() {
    return {
      hotSettings: {
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
          if (this.hotRef) {
            store.commit('updateData', this.hotRef.getSourceData());
          }
        },
        licenseKey: 'non-commercial-and-evaluation'
      },
      hotRef: null
    };
  },
  mounted() {
    this.hotRef = this.$refs.wrapper.hotInstance;
    store.subscribe(() => this.updateVuexPreview());
    store.commit('updateData', this.hotRef.getSourceData());
  },
  methods: {
    toggleReadOnly(event) {
      this.hotSettings.readOnly = event.target.checked;
      store.commit('updateSettings', { prop: 'readOnly', value: this.hotSettings.readOnly });
    },
    updateVuexPreview() {
      // This method serves only as a renderer for the Vuex's state dump.
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
  },
  components: {
    HotTable,
  }
});

export default ExampleComponent;
