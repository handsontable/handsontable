<script setup lang="ts">
import { markRaw } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import { HyperFormula } from 'hyperformula';
import * as formulaBuilder from 'hyperformula-ui';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const engine = markRaw(
  HyperFormula.buildFromSheets(
    {
      Budget: [
        ['Laptops', 4200, '=B1*Rates!B1', '=B1*Rates!B2', '=B1+C1+D1'],
        ['Desks', 1200, '=B2*Rates!B1', '=B2*Rates!B2', '=B2+C2+D2'],
        ['Monitors', 2600, '=B3*Rates!B1', '=B3*Rates!B2', '=B3+C3+D3'],
        ['Chairs', 950, '=B4*Rates!B1', '=B4*Rates!B2', '=B4+C4+D4'],
        ['Docking stations', 780, '=B5*Rates!B1', '=B5*Rates!B2', '=B5+C5+D5'],
        ['Total', '=SUM(B1:B5)', '=SUM(C1:C5)', '=SUM(D1:D5)', '=SUM(E1:E5)'],
      ],
      Rates: [
        ['VAT rate', 0.23],
        ['Service fee', 0.05],
      ],
    },
    {
      // this demo uses the GPLv3 key,
      // use your own HyperFormula license key in your app
      licenseKey: 'gpl-v3',
    }
  )
);

const hotSettings: GridSettings = {
  formulas: { engine },
  sheetsBar: true,
  rowHeaders: true,
  colHeaders: true,
  stretchH: 'all',
  height: 240,
  editor: 'formula',
  formulaBuilder: {
    builder: formulaBuilder,
    showFormulaBar: true,
  },
  // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
};
</script>

<template>
  <div id="example2">
    <HotTable :settings="hotSettings" />
  </div>
</template>
