<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

type ModelOpts = Record<string, unknown>;

function model(opts: ModelOpts) {
  const _pub = {
    id: undefined,
    name: undefined,
    address: undefined,
    attr: undefined,
  };
  const _priv = {};

  for (const i in opts) {
    if (opts.hasOwnProperty && opts.hasOwnProperty(i)) {
      _priv[i] = opts[i];
    }
  }

  _pub.attr = function(attr: string, val?: unknown) {
    if (typeof val === 'undefined') {
      window.console && console.log('GET the', attr, 'value of', _pub);
      return _priv[attr];
    }
    window.console && console.log('SET the', attr, 'value of', _pub);
    _priv[attr] = val;
    return _pub;
  };

  return _pub;
}

function property(attr: string) {
  return (row: ReturnType<typeof model>, value: unknown) => row.attr(attr, value);
}

const hotSettings = ref<GridSettings>({
  data: [
    model({ id: 1, name: 'Ted Right', address: '' }),
    model({ id: 2, name: 'Frank Honest', address: '' }),
    model({ id: 3, name: 'Joan Well', address: '' }),
    model({ id: 4, name: 'Gail Polite', address: '' }),
    model({ id: 5, name: 'Michael Fair', address: '' }),
  ],
  dataSchema: model,
  height: 'auto',
  width: 'auto',
  colHeaders: ['ID', 'Name', 'Address'],
  columns: [{ data: property('id') }, { data: property('name') }, { data: property('address') }],
  minSpareRows: 1,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example7">
    <HotTable :settings="hotSettings" />
  </div>
</template>
