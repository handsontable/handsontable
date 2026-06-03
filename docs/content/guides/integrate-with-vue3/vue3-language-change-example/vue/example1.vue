<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
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

registerAllModules();

const hotSettings = ref({
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
});
const language = ref('en-US');
const isOpen = ref(false);
const languages = ref([]);
const dropdown = ref(null);

function toggleDropdown() {
  isOpen.value = !isOpen.value;
}

function selectLanguage(lang) {
  language.value = lang;
  isOpen.value = false;
}

function handleClickOutside(e) {
  if (dropdown.value && !dropdown.value.contains(e.target)) {
    isOpen.value = false;
  }
}

function handleEscape(e) {
  if (e.key === 'Escape') {
    isOpen.value = false;
  }
}

onMounted(() => {
  languages.value = getLanguagesDictionaries().map((d) => d.languageCode);

  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleEscape);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleEscape);
});
</script>

<template>
  <div id="example1" class="select-language">
    <div class="example-controls-container">
      <div class="controls">
        <label>Select language of the context menu:</label>
        <div class="theme-dropdown" ref="dropdown">
          <button
            class="theme-dropdown-trigger"
            type="button"
            aria-haspopup="listbox"
            :aria-expanded="isOpen"
            @click="toggleDropdown"
          >
            <span>{{ language }}</span>
            <svg class="theme-dropdown-chevron" aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6l6 -6"/></svg>
          </button>
          <ul class="theme-dropdown-menu" role="listbox" v-if="isOpen">
            <li
              v-for="lang in languages"
              :key="lang"
              role="option"
              :aria-selected="language === lang"
              @click="selectLanguage(lang)"
            >{{ lang }}</li>
          </ul>
        </div>
      </div>
    </div>
    <HotTable :language="language" :settings="hotSettings" />
  </div>
</template>
