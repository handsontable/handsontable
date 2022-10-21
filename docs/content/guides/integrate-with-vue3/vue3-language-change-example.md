---
title: Language change in Vue 3
metaTitle: Language change - Vue 3 Data Grid | Handsontable
description: Change the default language of the right-click context menu from English to any of the built-in translations, using the "language" property.
permalink: /vue3-language-change-example
canonicalUrl: /vue3-language-change-example
searchCategory: Guides
---

# Language change in Vue 3

Change the default language of the right-click context menu from English to any of the built-in translations, using the `language` property.

[[toc]]

## Example - Select language

The following example implements the `@handsontable/vue3` component with the option to change the Context Menu language configured. Select a language from the selector above the table and open the Context Menu to see the result.

:::tip
Note that the `language` property is bound to the component separately using `language={this.language}"`, but it could be included in the `settings` property just as well.
:::

[Find out which Vue 3 versions are supported](@/guides/integrate-with-vue3/vue3-installation.md#vue-3-version-support)

::: example #example1 :vue3-languages --html 1 --js 2
```html
<div id="example1" class="controls select-language">
  <label for="languages">Select language of the context menu:</label>
  <select v-on:change="updateHotLanguage" id="languages"></select><br/>
  <br/>
  <hot-table :language="language" :settings="hotSettings"></hot-table>
</div>
```
```js
import { defineComponent } from 'vue';
import { HotTable } from '@handsontable/vue3';
import {
  registerLanguageDictionary,
  getLanguagesDictionaries,
  deCH,
  deDE,
  esMX,
  frFR,
  itIT,
  jaJP,
  koKR,
  lvLV,
  nbNO,
  nlNL,
  plPL,
  ptBR,
  ruRU,
  zhCN,
  zhTW
} from 'handsontable/i18n';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.css';

registerLanguageDictionary(deCH);
registerLanguageDictionary(deDE);
registerLanguageDictionary(esMX);
registerLanguageDictionary(frFR);
registerLanguageDictionary(itIT);
registerLanguageDictionary(jaJP);
registerLanguageDictionary(koKR);
registerLanguageDictionary(lvLV);
registerLanguageDictionary(nbNO);
registerLanguageDictionary(nlNL);
registerLanguageDictionary(plPL);
registerLanguageDictionary(ptBR);
registerLanguageDictionary(ruRU);
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
    HotTable,
  }
});

export default ExampleComponent;

/* start:non-previewable */
import { createApp } from 'vue';

const app = createApp(ExampleComponent);

app.mount('#example1');
/* end:non-previewable */
```
:::

## Related articles

### Related guides

- [Language](@/guides/internationalization/language.md)
- [Layout direction](@/guides/internationalization/layout-direction.md)
- [Locale](@/guides/internationalization/locale.md)

### Related API reference

- Configuration options:
  - [`language`](@/api/options.md#language)
  - [`layoutDirection`](@/api/options.md#layoutdirection)
  - [`locale`](@/api/options.md#locale)
- Core methods:
  - [`getDirectionFactor()`](@/api/core.md#getdirectionfactor)
  - [`getTranslatedPhrase()`](@/api/core.md#gettranslatedphrase)
  - [`isLtr()`](@/api/core.md#isltr)
  - [`isRtl()`](@/api/core.md#isrtl)
- Hooks:
  - [`afterLanguageChange`](@/api/hooks.md#afterlanguagechange)
  - [`beforeLanguageChange`](@/api/hooks.md#beforelanguagechange)
