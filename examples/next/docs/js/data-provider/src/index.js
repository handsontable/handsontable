import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import './styles.css';

registerAllModules();

const REST_API = import.meta.env.VITE_API_BASE || 'http://localhost:4010';
const GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:4011/graphql';

function warehouseFetchRows(queryParameters, { signal }) {
  const params = new URLSearchParams({
    page: String(queryParameters.page),
    pageSize: String(queryParameters.pageSize),
  });

  if (queryParameters.sort) {
    params.set('sortBy', queryParameters.sort.prop);
    params.set('sortDir', queryParameters.sort.order);
  }

  if (queryParameters.filters?.length) {
    params.set('filters', JSON.stringify(queryParameters.filters));
  }

  return fetch(`${REST_API}/api/stock-lines?${params}`, { signal })
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      return res.json();
    })
    .then((json) => ({ rows: json.data, totalRows: json.total }));
}

const OPEN_TICKETS = `
  query OpenTickets(
    $page: Int!
    $pageSize: Int!
    $sortBy: String
    $sortDir: SortDir
    $filtersJson: String
  ) {
    openTickets(
      page: $page
      pageSize: $pageSize
      sortBy: $sortBy
      sortDir: $sortDir
      filtersJson: $filtersJson
    ) {
      nodes { id subject requesterEmail priority status }
      totalCount
    }
  }
`;

const M_CREATE = `
  mutation CreateTickets(
    $count: Int!
    $position: RowInsertPosition
    $referenceRowId: ID
  ) {
    createSupportTickets(
      count: $count
      position: $position
      referenceRowId: $referenceRowId
    )
  }
`;
const M_UPDATE = `
  mutation UpdateTickets($updates: [TicketUpdateInput!]!) {
    updateSupportTickets(updates: $updates)
  }
`;
const M_REMOVE = `
  mutation RemoveTickets($ids: [ID!]!) {
    removeSupportTickets(ids: $ids)
  }
`;

function ticketsFetchRows(queryParameters, { signal }) {
  const variables = {
    page: queryParameters.page,
    pageSize: queryParameters.pageSize,
    sortBy: queryParameters.sort?.prop ?? null,
    sortDir: queryParameters.sort
      ? queryParameters.sort.order === 'asc'
        ? 'ASC'
        : 'DESC'
      : null,
    filtersJson:
      queryParameters.filters?.length > 0
        ? JSON.stringify(queryParameters.filters)
        : null,
  };

  return fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    signal,
    body: JSON.stringify({ query: OPEN_TICKETS, variables }),
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      return res.json();
    })
    .then((body) => {
      if (body.errors?.length) {
        throw new Error(body.errors.map((e) => e.message).join('; '));
      }

      const page = body.data.openTickets;

      return { rows: page.nodes, totalRows: page.totalCount };
    });
}

function gqlFetch(body, signal = undefined) {
  return fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    ...(signal ? { signal } : {}),
    body: JSON.stringify(body),
  }).then(async(res) => {
    const json = await res.json();

    if (!res.ok || json.errors?.length) {
      throw new Error(json.errors?.map((e) => e.message).join('; ') || res.statusText);
    }

    return json;
  });
}

const warehouseDataProvider = {
  rowId: 'id',
  fetchRows: warehouseFetchRows,
  onRowsCreate: async ({ rowsAmount, position, referenceRowId }) => {
    const res = await fetch(`${REST_API}/api/stock-lines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        count: rowsAmount,
        position,
        referenceRowId,
      }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
  },
  onRowsUpdate: async (rows) => {
    const res = await fetch(`${REST_API}/api/stock-lines`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        updates: rows.map(({ id, changes }) => ({ id: String(id), changes })),
      }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
  },
  onRowsRemove: async (rowIds) => {
    const res = await fetch(`${REST_API}/api/stock-lines`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: rowIds.map((id) => String(id)) }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
  },
};

const ticketsDataProvider = {
  rowId: 'id',
  fetchRows: ticketsFetchRows,
  onRowsCreate: async ({ rowsAmount, position, referenceRowId }) => {
    await gqlFetch({
      query: M_CREATE,
      variables: {
        count: rowsAmount,
        position:
          position === 'above' ? 'ABOVE' : position === 'below' ? 'BELOW' : null,
        referenceRowId:
          referenceRowId !== undefined && referenceRowId !== null
            ? String(referenceRowId)
            : null,
      },
    });
  },
  onRowsUpdate: async (rows) => {
    await gqlFetch({
      query: M_UPDATE,
      variables: {
        updates: rows.map(({ id, changes }) => ({
          id: String(id),
          changes,
        })),
      },
    });
  },
  onRowsRemove: async (rowIds) => {
    await gqlFetch({
      query: M_REMOVE,
      variables: { ids: rowIds.map((id) => String(id)) },
    });
  },
};

const sharedGridOptions = {
  colHeaders: true,
  rowHeaders: true,
  width: '100%',
  height: 420,
  filters: true,
  dropdownMenu: true,
  columnSorting: true,
  contextMenu: true,
  emptyDataState: true,
  notification: true,
  licenseKey: 'non-commercial-and-evaluation',
};

new Handsontable(document.getElementById('stock-grid'), {
  ...sharedGridOptions,
  dataProvider: warehouseDataProvider,
  columns: [
    { data: 'sku', title: 'SKU' },
    { data: 'bin', title: 'Bin' },
    { data: 'quantityOnHand', type: 'numeric', title: 'On hand' },
    { data: 'reorderPoint', type: 'numeric', title: 'Reorder at' },
  ],
  pagination: { pageSize: 15 },
});

new Handsontable(document.getElementById('tickets-grid'), {
  ...sharedGridOptions,
  dataProvider: ticketsDataProvider,
  columns: [
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
  ],
  pagination: { pageSize: 12 },
});

console.log(`Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`);
