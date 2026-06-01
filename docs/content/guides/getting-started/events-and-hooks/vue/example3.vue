<script setup>
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

const hotSettings = ref({
  data: [
    ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'K1', 'L1'],
    ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2', 'K2', 'L2'],
    ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3', 'K3', 'L3'],
    ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4', 'K4', 'L4'],
    ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5'],
    ['A6', 'B6', 'C6', 'D6', 'E6', 'F6', 'G6', 'H6', 'I6', 'J6', 'K6', 'L6'],
    ['A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7', 'H7', 'I7', 'J7', 'K7', 'L7'],
    ['A8', 'B8', 'C8', 'D8', 'E8', 'F8', 'G8', 'H8', 'I8', 'J8', 'K8', 'L8'],
    ['A9', 'B9', 'C9', 'D9', 'E9', 'F9', 'G9', 'H9', 'I9', 'J9', 'K9', 'L9'],
    ['A10', 'B10', 'C10', 'D10', 'E10', 'F10', 'G10', 'H10', 'I10', 'J10', 'K10', 'L10'],
    ['A11', 'B11', 'C11', 'D11', 'E11', 'F11', 'G11', 'H11', 'I11', 'J11', 'K11', 'L11'],
    ['A12', 'B12', 'C12', 'D12', 'E12', 'F12', 'G12', 'H12', 'I12', 'J12', 'K12', 'L12'],
  ],
  autoWrapRow: true,
  autoWrapCol: true,
  height: 240,
  licenseKey: 'non-commercial-and-evaluation',
});

function onFixedRowsChange(event) {
  hotSettings.value = { ...hotSettings.value, fixedRowsTop: event.target.checked ? 2 : 0 };
}

function onFixedColumnsChange(event) {
  hotSettings.value = { ...hotSettings.value, fixedColumnsStart: event.target.checked ? 2 : 0 };
}

function onRowHeadersChange(event) {
  hotSettings.value = { ...hotSettings.value, rowHeaders: event.target.checked };
}

function onColHeadersChange(event) {
  hotSettings.value = { ...hotSettings.value, colHeaders: event.target.checked };
}
</script>

<template>
  <div id="example3">
    <div class="example-controls-container">
      <div class="controls">
        <label>
          <input type="checkbox" @change="onFixedRowsChange" />
          Add fixed rows
        </label>
        <br />
        <label>
          <input type="checkbox" @change="onFixedColumnsChange" />
          Add fixed columns
        </label>
        <br />
        <label>
          <input type="checkbox" @change="onRowHeadersChange" />
          Enable row headers
        </label>
        <br />
        <label>
          <input type="checkbox" @change="onColHeadersChange" />
          Enable column headers
        </label>
      </div>
    </div>
    <HotTable :settings="hotSettings" />
  </div>
</template>

<style>
#example3 {
  max-width: 440px;
}
</style>
