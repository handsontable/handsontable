<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const hotSettings = ref<GridSettings>({
  data: [
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: '2023-10-11',
      sellTime: '01:23',
      inStock: false,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: '2023-05-03',
      sellTime: '11:27',
      inStock: false,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: '2023-03-27',
      sellTime: '03:17',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: '2023-08-28',
      sellTime: '08:01',
      inStock: true,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: '2023-10-02',
      sellTime: '01:23',
      inStock: true,
    },
  ],
  columns: [
    {
      title: 'Brand',
      type: 'text',
      data: 'brand',
    },
    {
      title: 'Model',
      type: 'text',
      data: 'model',
    },
    {
      title: 'Price',
      type: 'numeric',
      data: 'price',
      locale: 'en-US',
      numericFormat: {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      },
    },
    {
      title: 'Date',
      type: 'intl-date',
      data: 'sellDate',
      locale: 'en-US',
      dateFormat: { month: 'short', day: 'numeric', year: 'numeric' },
      className: 'htRight',
    },
    {
      title: 'Time',
      type: 'intl-time',
      data: 'sellTime',
      locale: 'en-US',
      timeFormat: { hour: '2-digit', minute: '2-digit', hour12: true },
      className: 'htRight',
    },
    {
      title: 'In stock',
      type: 'checkbox',
      data: 'inStock',
      className: 'htCenter',
    },
  ],
  // enable filtering
  filters: true,
  // enable the column menu
  dropdownMenu: true,
  // to differentiate this example's CSS from other examples on this page
  className: 'customFilterButtonExample1',
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="exampleCustomFilterButton">
    <HotTable :settings="hotSettings" />
  </div>
</template>

<style>
.handsontable.customFilterButtonExample1 .changeType {
  --ht-icon-button-background-color: #e2e2e263;
  --ht-icon-button-border-radius: 100%;
}

.handsontable.customFilterButtonExample1 .changeType::before {
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg width=%2716%27 height=%2716%27 viewBox=%270 0 16 16%27 fill=%27none%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cpath d=%27M6.83337 7.99984C6.83337 8.30926 6.95629 8.606 7.17508 8.8248C7.39388 9.04359 7.69062 9.1665 8.00004 9.1665C8.30946 9.1665 8.60621 9.04359 8.825 8.8248C9.04379 8.606 9.16671 8.30926 9.16671 7.99984C9.16671 7.69042 9.04379 7.39367 8.825 7.17488C8.60621 6.95609 8.30946 6.83317 8.00004 6.83317C7.69062 6.83317 7.39388 6.95609 7.17508 7.17488C6.95629 7.39367 6.83337 7.69042 6.83337 7.99984Z%27 fill=%27%23222222%27/%3E%3Cpath d=%27M6.83337 12.4165C6.83337 12.7259 6.95629 13.0227 7.17508 13.2415C7.39388 13.4603 7.69062 13.5832 8.00004 13.5832C8.30946 13.5832 8.60621 13.4603 8.825 13.2415C9.04379 13.0227 9.16671 12.7259 9.16671 12.4165C9.16671 12.1071 9.04379 11.8103 8.825 11.5915C8.60621 11.3728 8.30946 11.2498 8.00004 11.2498C7.69062 11.2498 7.39388 11.3728 7.17508 11.5915C6.95629 11.8103 6.83337 12.1071 6.83337 12.4165Z%27 fill=%27%23222222%27/%3E%3Cpath d=%27M6.83337 3.58317C6.83337 3.89259 6.95629 4.18934 7.17508 4.40813C7.39388 4.62692 7.69062 4.74984 8.00004 4.74984C8.30946 4.74984 8.60621 4.62692 8.825 4.40813C9.04379 4.18934 9.16671 3.89259 9.16671 3.58317C9.16671 3.27375 9.04379 2.97701 8.825 2.75821C8.60621 2.53942 8.30946 2.4165 8.00004 2.4165C7.69062 2.4165 7.39388 2.53942 7.17508 2.75821C6.95629 2.97701 6.83337 3.27375 6.83337 3.58317Z%27 fill=%27currentColor%27/%3E%3C/svg%3E");
}
</style>
