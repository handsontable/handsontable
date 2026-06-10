<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import { HyperFormula } from 'hyperformula';
import type { GridSettings } from 'handsontable/settings';
import type { DetailedSettings } from 'handsontable/plugins/formulas';

// register Handsontable's modules
registerAllModules();

const hotRef = useTemplateRef<InstanceType<typeof HotTable>>('hotRef');
const namedExpressionValue = ref('=10 * Sheet1!$A$2');

const data = [
  ['Travel ID', 'Destination', 'Base price', 'Price with extra cost'],
  ['154', 'Rome', 400, '=ROUND(ADDITIONAL_COST+C2,0)'],
  ['155', 'Athens', 300, '=ROUND(ADDITIONAL_COST+C3,0)'],
  ['156', 'Warsaw', 150, '=ROUND(ADDITIONAL_COST+C4,0)'],
];

const hotSettings = ref<GridSettings>({
  data,
  colHeaders: true,
  rowHeaders: true,
  height: 'auto',
  formulas: {
    engine: HyperFormula,
    namedExpressions: [
      {
        name: 'ADDITIONAL_COST',
        expression: 100,
      },
    ],
  } as DetailedSettings,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});

function inputChangeCallback(event: Event) {
  namedExpressionValue.value = (event.target as HTMLInputElement).value;
}

function buttonClickCallback() {
  const hotInstance = hotRef.value?.hotInstance;
  const formulasPlugin = hotInstance?.getPlugin('formulas');

  formulasPlugin?.engine?.changeNamedExpression('ADDITIONAL_COST', namedExpressionValue.value);

  hotInstance?.render();
}
</script>

<template>
  <div id="example-named-expressions1">
    <div class="example-controls-container">
      <div class="controls">
        <input
          id="named-expressions-input"
          type="text"
          :value="namedExpressionValue"
          @input="inputChangeCallback"
        />
        <button id="named-expressions-button" @click="buttonClickCallback">
          Calculate the price
        </button>
      </div>
    </div>
    <HotTable ref="hotRef" :settings="hotSettings" />
  </div>
</template>
