<template>
  <div id="example">
    <div class="demo-chrome">
      <p class="demo-lead">
        Run <code>npm run server</code> (or <code>npm run server:rest</code> and
        <code>npm run server:graphql</code> in two terminals), then <code>npm run start</code>.
        REST uses port 4010; GraphQL uses port 4011. Override with
        <code>VITE_API_BASE</code> and <code>VITE_GRAPHQL_URL</code>.
      </p>
    </div>
    <section class="demo-panel" aria-labelledby="warehouse-heading">
      <h2 id="warehouse-heading" class="demo-panel-title">Warehouse stock (REST)</h2>
      <p class="demo-panel-note">
        Express API at <code>/api/stock-lines</code>.
      </p>
      <div id="stock-grid">
        <HotTable
          :data-provider="warehouseDataProvider"
          :columns="warehouseColumns"
          :row-headers="true"
          :col-headers="true"
          width="100%"
          :height="420"
          license-key="non-commercial-and-evaluation"
          :column-sorting="true"
          :pagination="{ pageSize: 15 }"
          :dropdown-menu="true"
          :filters="true"
          :context-menu="true"
          :empty-data-state="true"
          :notification="true"
        />
      </div>
    </section>
    <section class="demo-panel" aria-labelledby="tickets-heading">
      <h2 id="tickets-heading" class="demo-panel-title">Support queue (GraphQL)</h2>
      <p class="demo-panel-note">
        <code>POST /graphql</code>
      </p>
      <div id="tickets-grid">
        <HotTable
          :data-provider="ticketsDataProvider"
          :columns="ticketsColumns"
          :row-headers="true"
          :col-headers="true"
          width="100%"
          :height="420"
          license-key="non-commercial-and-evaluation"
          :column-sorting="true"
          :pagination="{ pageSize: 12 }"
          :dropdown-menu="true"
          :filters="true"
          :context-menu="true"
          :empty-data-state="true"
          :notification="true"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import Handsontable from 'handsontable/base';
import { HotTable } from '@handsontable/vue3';
import { version as vueVersion } from 'vue';

import { createTicketsDataProvider, createWarehouseDataProvider } from './dataProviderClients';

const REST_API = import.meta.env.VITE_API_BASE || 'http://localhost:4010';
const GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:4011/graphql';

const warehouseDataProvider = createWarehouseDataProvider(REST_API);
const ticketsDataProvider = createTicketsDataProvider(GRAPHQL_URL);

const warehouseColumns = [
  { data: 'sku', title: 'SKU' },
  { data: 'bin', title: 'Bin' },
  { data: 'quantityOnHand', type: 'numeric', title: 'On hand' },
  { data: 'reorderPoint', type: 'numeric', title: 'Reorder at' },
] as const;

const ticketsColumns = [
  { data: 'subject', title: 'Subject' },
  { data: 'requesterEmail', title: 'Requester' },
  {
    data: 'priority',
    title: 'Priority',
    type: 'dropdown',
    source: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
  },
  {
    data: 'status',
    title: 'Status',
    type: 'dropdown',
    source: ['OPEN', 'PENDING', 'RESOLVED'],
  },
] as const;

console.log(
  `Handsontable: v${Handsontable.version} (${Handsontable.buildDate}) Wrapper: v${HotTable.version} Vue: v${vueVersion}`
);
</script>
