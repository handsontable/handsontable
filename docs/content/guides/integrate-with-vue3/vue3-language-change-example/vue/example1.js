import { defineComponent } from 'vue';
import { HotTable } from '@handsontable/vue3';
import {
  registerLanguageDictionary,
  getLanguagesDictionaries,
  arAR,
  csCZ,
  deCH,
  deDE,
  esMX,
  frFR,
  hrHR,
  itIT,
  jaJP,
  koKR,
  lvLV,
  nbNO,
  nlNL,
  plPL,
  ptBR,
  ruRU,
  srSP,
  zhCN,
  zhTW
} from 'handsontable/i18n';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

registerLanguageDictionary(arAR);
registerLanguageDictionary(csCZ);
registerLanguageDictionary(deCH);
registerLanguageDictionary(deDE);
registerLanguageDictionary(esMX);
registerLanguageDictionary(frFR);
registerLanguageDictionary(hrHR);
registerLanguageDictionary(itIT);
registerLanguageDictionary(jaJP);
registerLanguageDictionary(koKR);
registerLanguageDictionary(lvLV);
registerLanguageDictionary(nbNO);
registerLanguageDictionary(nlNL);
registerLanguageDictionary(plPL);
registerLanguageDictionary(ptBR);
registerLanguageDictionary(ruRU);
registerLanguageDictionary(srSP);
registerLanguageDictionary(zhCN);
registerLanguageDictionary(zhTW);

// register Handsontable's modules
registerAllModules();

const ExampleComponent = defineComponent({
  data() {
    return {
      hotSettings: {
        data: [
          ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
          ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'],
          ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4'],
          ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5'],
        ],
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
        height: 'auto',
        autoWrapRow: true,
        autoWrapCol: true,
        licenseKey: 'non-commercial-and-evaluation'
      },
      language: 'en-US'
    };
  },
  mounted() {
    this.getAllLanguageOptions();
  },
  methods: {
    getAllLanguageOptions() {
      const allDictionaries = getLanguagesDictionaries();
      const langSelect = document.querySelector('#languages');

      langSelect.innerHTML = '';

      for (const language of allDictionaries) {
        langSelect.innerHTML += `<option value="${language.languageCode}">${language.languageCode}</option>`;
      }
    },
    updateHotLanguage(event) {
      this.language = event.target.value;
    }
  },
  components: {
    HotTable,
  }
});

export default ExampleComponent;
