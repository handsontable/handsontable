import React, { useMemo, version as reactVersion } from 'react';
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { HotTable } from '@handsontable/react-wrapper';
import { createTicketsDataProvider, createWarehouseDataProvider } from './dataProviderClients';

registerAllModules();

const REST_API = process.env.REACT_APP_API_BASE || 'http://localhost:4010';
const GRAPHQL_URL = process.env.REACT_APP_GRAPHQL_URL || 'http://localhost:4011/graphql';

const sharedGridProps = {
  rowHeaders: true,
  colHeaders: true,
  width: '100%',
  height: 420,
  licenseKey: 'non-commercial-and-evaluation',
  columnSorting: true,
  dropdownMenu: true,
  filters: true,
  contextMenu: true,
  emptyDataState: true,
  notification: true,
};

function App() {
  const warehouseDataProvider = useMemo(() => createWarehouseDataProvider(REST_API), []);
  const ticketsDataProvider = useMemo(() => createTicketsDataProvider(GRAPHQL_URL), []);

  return (
    <div id="example">
      <div className="demo-chrome">
        <p className="demo-lead">
          Run <code>npm run server</code> (or <code>npm run server:rest</code> and{' '}
          <code>npm run server:graphql</code> in two terminals), then <code>npm run start</code>.
          REST uses port 4010; GraphQL uses port 4011. Override with{' '}
          <code>REACT_APP_API_BASE</code> and <code>REACT_APP_GRAPHQL_URL</code>.
        </p>
      </div>
      <section className="demo-panel" aria-labelledby="warehouse-heading">
        <h2 id="warehouse-heading" className="demo-panel-title">
          Warehouse stock (REST)
        </h2>
        <p className="demo-panel-note">
          Express API at <code>/api/stock-lines</code>.
        </p>
        <div id="stock-grid">
          <HotTable
            dataProvider={warehouseDataProvider}
            columns={[
              { data: 'sku', title: 'SKU' },
              { data: 'bin', title: 'Bin' },
              { data: 'quantityOnHand', type: 'numeric', title: 'On hand' },
              { data: 'reorderPoint', type: 'numeric', title: 'Reorder at' },
            ]}
            {...sharedGridProps}
            pagination={{ pageSize: 15 }}
          />
        </div>
      </section>
      <section className="demo-panel" aria-labelledby="tickets-heading">
        <h2 id="tickets-heading" className="demo-panel-title">
          Support queue (GraphQL)
        </h2>
        <p className="demo-panel-note">
          <code>POST /graphql</code>
        </p>
        <div id="tickets-grid">
          <HotTable
            dataProvider={ticketsDataProvider}
            columns={[
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
            ]}
            {...sharedGridProps}
            pagination={{ pageSize: 12 }}
          />
        </div>
      </section>
    </div>
  );
}

console.log(
  `Handsontable: v${Handsontable.version} (${Handsontable.buildDate}) Wrapper: v${HotTable.version} React: v${reactVersion}`
);

export default App;
