import Vue from 'vue';
import Vuex from 'vuex';
import { HotTable } from '@handsontable/vue';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

Vue.use(Vuex);

// register Handsontable's modules
registerAllModules();

const ExampleComponent = {
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
    this.$store.subscribe(() => this.updateVuexPreview());
    this.$store.commit('updateData', this.hotRef.getSourceData());
  },
  methods: {
    toggleReadOnly(event) {
      this.hotSettings.readOnly = event.target.checked;
      this.$store.commit('updateSettings', { prop: 'readOnly', value: this.hotSettings.readOnly });
    },
    updateVuexPreview() {
      // This method serves only as a renderer for the Vuex's state dump.

      const previewTable = document.querySelector('#vuex-preview pre');
      let newInnerHtml = '<div>';

      for (const [key, value] of Object.entries(this.$store.state)) {
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
            newInnerHtml += `<li>${settingsKey}: ${this.$store.state.hotSettings[settingsKey]}</li>`;
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
    HotTable
  },
  store: new Vuex.Store({
    state: {
      hotData: null,
      hotSettings: {
        readOnly: false,
        autoWrapRow: true,
        autoWrapCol: true,
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
};

export default ExampleComponent;
