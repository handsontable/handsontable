import type { SourceRowData } from 'handsontable';
import type {
  DataProviderFetchOptions,
  DataProviderQueryParameters,
  RowUpdatePayload,
  RowsCreatePayload,
} from 'handsontable/plugins/dataProvider';

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

function warehouseFetchRows(
  restApi: string,
  queryParameters: DataProviderQueryParameters,
  { signal }: DataProviderFetchOptions
) {
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

  return fetch(`${restApi}/api/stock-lines?${params}`, { signal })
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      return res.json();
    })
    .then((json: { data: SourceRowData[]; total: number }) => ({ rows: json.data, totalRows: json.total }));
}

function ticketsFetchRows(
  graphqlUrl: string,
  queryParameters: DataProviderQueryParameters,
  { signal }: DataProviderFetchOptions
) {
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
      queryParameters.filters && queryParameters.filters.length > 0
        ? JSON.stringify(queryParameters.filters)
        : null,
  };

  return fetch(graphqlUrl, {
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
    .then((body: {
      errors?: Array<{ message: string }>;
      data: { openTickets: { nodes: SourceRowData[]; totalCount: number } };
    }) => {
      if (body.errors?.length) {
        throw new Error(body.errors.map((e) => e.message).join('; '));
      }

      const page = body.data.openTickets;

      return { rows: page.nodes, totalRows: page.totalCount };
    });
}

function gqlFetch(graphqlUrl: string, body: object, signal?: AbortSignal) {
  return fetch(graphqlUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    ...(signal ? { signal } : {}),
    body: JSON.stringify(body),
  }).then(async(res) => {
    const json = (await res.json()) as { errors?: Array<{ message: string }> };

    if (!res.ok || json.errors?.length) {
      throw new Error(json.errors?.map((e) => e.message).join('; ') || res.statusText);
    }

    return json;
  });
}

export function createWarehouseDataProvider(restApi: string) {
  return {
    rowId: 'id',
    fetchRows: (queryParameters: DataProviderQueryParameters, options: DataProviderFetchOptions) =>
      warehouseFetchRows(restApi, queryParameters, options),
    onRowsCreate: async ({ rowsAmount, position, referenceRowId }: RowsCreatePayload) => {
      const res = await fetch(`${restApi}/api/stock-lines`, {
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
    onRowsUpdate: async (rows: RowUpdatePayload[]) => {
      const res = await fetch(`${restApi}/api/stock-lines`, {
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
    onRowsRemove: async (rowIds: unknown[]) => {
      const res = await fetch(`${restApi}/api/stock-lines`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: rowIds.map((id) => String(id)) }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
    },
  };
}

export function createTicketsDataProvider(graphqlUrl: string) {
  return {
    rowId: 'id',
    fetchRows: (queryParameters: DataProviderQueryParameters, options: DataProviderFetchOptions) =>
      ticketsFetchRows(graphqlUrl, queryParameters, options),
    onRowsCreate: async ({ rowsAmount, position, referenceRowId }: RowsCreatePayload) => {
      await gqlFetch(graphqlUrl, {
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
    onRowsUpdate: async (rows: RowUpdatePayload[]) => {
      await gqlFetch(graphqlUrl, {
        query: M_UPDATE,
        variables: {
          updates: rows.map(({ id, changes }) => ({
            id: String(id),
            changes,
          })),
        },
      });
    },
    onRowsRemove: async (rowIds: unknown[]) => {
      await gqlFetch(graphqlUrl, {
        query: M_REMOVE,
        variables: { ids: rowIds.map((id) => String(id)) },
      });
    },
  };
}
