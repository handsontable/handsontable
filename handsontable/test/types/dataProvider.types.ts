import Handsontable from 'handsontable';
import type {
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
});

hot.addHook('beforeDataProviderFetch', (q: DataProviderQueryParameters) => q.page > 0);

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

void minimalConfig;
void hot;
