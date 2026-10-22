import Handsontable from 'handsontable';
import type {
  DataProviderBeforeFetchParameters,
  DataProviderConfig,
  DataProviderFetchOptions,
  DataProviderFetchResult,
  DataProviderOptions,
  DataProviderQueryParameters,
  RowMutationPayload,
  RowMutationUpdatePayload,
  RowsCreatePayload,
} from 'handsontable/plugins/dataProvider';

const minimalConfig: DataProviderConfig = {
  rowId: 'id',
  fetchRows: async(
    queryParameters: DataProviderQueryParameters,
    options: DataProviderFetchOptions
  ) => {
    void queryParameters.page;
    void queryParameters.pageSize;
    void queryParameters.sort;
    void queryParameters.filters;
    void options.signal;

    return { rows: [], totalRows: 0 };
  },
  onRowsCreate: async(p: RowsCreatePayload) => {
    void p.rowsAmount;

    return [];
  },
  onRowsUpdate: async() => {},
  onRowsRemove: async() => {},
  refetchAfterCreate: false,
};

const configWithDefaultRefetch: DataProviderConfig = {
  rowId: 'id',
  fetchRows: minimalConfig.fetchRows,
};

void configWithDefaultRefetch.refetchAfterCreate;

// @ts-expect-error `refetchAfterCreate` accepts only a boolean.
const configWithWrongRefetchType: DataProviderConfig = { rowId: 'id', refetchAfterCreate: 'no' };

void configWithWrongRefetchType;

const configWithRowIdFunction: DataProviderConfig = {
  rowId: row => (row as { id: number }).id,
  fetchRows: minimalConfig.fetchRows,
};

// A function that declares its row type is assignable too, as it is to the grid-level `rowId`.
const configWithTypedRowIdFunction: DataProviderConfig = {
  rowId: (row: Handsontable.RowObject | unknown[]) => (Array.isArray(row) ? row[0] : row.id),
  fetchRows: minimalConfig.fetchRows,
};

void configWithRowIdFunction;
void configWithTypedRowIdFunction;

// @ts-expect-error `rowId` accepts a string path or a function, not a number.
const configWithWrongRowIdType: DataProviderConfig = { rowId: 1, fetchRows: minimalConfig.fetchRows };

void configWithWrongRowIdType;

const hot = new Handsontable(document.createElement('div'), {
  dataProvider: minimalConfig,
});

hot.addHook('afterDataProviderFetch', (result: DataProviderFetchResult) => {
  void result.rows;
  void result.totalRows;
  void result.queryParameters?.page;
  void result.columnSortConfig;
  void result.filtersConditionsStack;
});

hot.addHook('beforeDataProviderFetch', (q: DataProviderBeforeFetchParameters) => {
  void q.skipLoading;

  return q.page > 0;
});

hot.addHook('hasExternalDataSource', () => false);

hot.addHook('afterDataProviderFetchError', (error: Error, queryParameters: DataProviderQueryParameters) => {
  void error;
  void queryParameters.filters;

  if (queryParameters.filters) {
    const col = queryParameters.filters[0];

    void col.prop;
    void col.operation;
    col.conditions.forEach((c) => {
      void c.name;
      void c.args;
    });
  }
});

const onFetchError = (error: Error, queryParameters: DataProviderQueryParameters, isVisible?: boolean) => {
  const visible: boolean = isVisible !== false;

  void visible;
};

hot.addHook('afterDataProviderFetchError', onFetchError);

hot.addHook('afterDataProviderFetchAbort', (queryParameters: DataProviderQueryParameters, reason?: Error) => {
  void queryParameters.page;
  void reason?.name;
});

hot.addHook('afterRowsMutation', (operation: string, payload: RowMutationPayload) => {
  if (operation === 'create' && 'rowsCreate' in payload) {
    void payload.rowsCreate.rowsAmount;
  }
  if (operation === 'remove' && 'rowsRemove' in payload && payload.rowsRemove[0]) {
    void payload.rowsRemove[0];
  }
  if (operation === 'update' && 'rows' in payload && (payload as RowMutationUpdatePayload).rows[0]) {
    void (payload as RowMutationUpdatePayload).rows[0].id;
  }
});

const dataProviderPlugin = hot.getPlugin('dataProvider');

if (dataProviderPlugin) {
  void dataProviderPlugin.getQueryParameters();
  void dataProviderPlugin.fetchData({ skipLoading: true });

  const fetching: boolean = dataProviderPlugin.isFetching();

  void fetching;
}

void minimalConfig;
void hot;

// Deprecated alias must stay assignable until 19.0.0.
const legacyOptions: DataProviderOptions = { signal: new AbortController().signal } as DataProviderFetchOptions;

void legacyOptions;
