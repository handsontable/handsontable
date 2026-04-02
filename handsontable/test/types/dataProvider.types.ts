import Handsontable from 'handsontable';
import type {
  DataProviderBeforeFetchParameters,
  DataProviderConfig,
  DataProviderFetchOptions,
  DataProviderFetchResult,
  DataProviderQueryParameters,
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
  onRowsCreate: async(p) => {
    void p.rowsAmount;
  },
  onRowsUpdate: async() => {},
  onRowsRemove: async() => {},
};

const hot = new Handsontable(document.createElement('div'), {
  dataProvider: minimalConfig,
});

hot.addHook('afterDataProviderFetch', (result: DataProviderFetchResult) => {
  void result.rows;
  void result.totalRows;
  void result.queryParameters.page;
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
    col.conditions.forEach(c => {
      void c.name;
      void c.args;
    });
  }
});

hot.addHook('afterDataProviderFetchAbort', (queryParameters: DataProviderQueryParameters, reason?: Error) => {
  void queryParameters.page;
  void reason?.name;
});

hot.addHook('afterRowsMutation', (operation, payload) => {
  if (operation === 'create' && 'rowsCreate' in payload) {
    void payload.rowsCreate.rowsAmount;
  }
  if (operation === 'remove' && 'rowsRemove' in payload && payload.rowsRemove[0]) {
    void payload.rowsRemove[0];
  }
  if (operation === 'update' && 'rows' in payload && payload.rows[0]) {
    void payload.rows[0].id;
  }
});

const dataProviderPlugin = hot.getPlugin('dataProvider');

if (dataProviderPlugin) {
  void dataProviderPlugin.getQueryParameters();
  void dataProviderPlugin.fetchData({ skipLoading: true });
}

void minimalConfig;
void hot;
