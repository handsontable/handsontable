<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

type Airport = {
  name: string;
  city: string;
  country: string;
};

// each `value` is an object, so the cell stores the whole airport, not only its name
const airports = [
  { key: 'LAX', value: { name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'USA' } },
  { key: 'JFK', value: { name: 'John F. Kennedy International Airport', city: 'New York', country: 'USA' } },
  { key: 'LHR', value: { name: 'London Heathrow Airport', city: 'London', country: 'United Kingdom' } },
  { key: 'CDG', value: { name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France' } },
  { key: 'HND', value: { name: 'Tokyo Haneda Airport', city: 'Tokyo', country: 'Japan' } },
  { key: 'SIN', value: { name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore' } },
];

const shipments = [
  ['Electronics and Gadgets', airports[0]],
  ['Medical Supplies', airports[1]],
  ['Fresh Produce', airports[2]],
  ['Textiles', airports[3]],
  ['Pharmaceuticals', airports[4]],
];

const hotSettings = ref<GridSettings>({
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  data: shipments,
  columns: [
    {
      title: 'Shipment',
    },
    {
      type: 'autocomplete',
      source: airports,
      // display the city and the name of each airport
      sourceLabel: (airport: Airport) => `${airport.city} - ${airport.name}`,
      title: 'Destination airport',
      width: 400,
    },
  ],
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example10">
    <HotTable :settings="hotSettings" />
  </div>
</template>
