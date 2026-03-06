import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {
  search: true,
});

new Handsontable(document.createElement('div'), {
  search: {
    searchResultClass: 'searchResultClass',
    queryMethod(queryStr: string, value: any) {
      return true;
    },
    callback(instance: Handsontable, row: number, column: number, value: any, result: boolean) {}
  },
});
const plugin = hot.getPlugin('search');

plugin.query(
  'foo',
  (hotInstance: Handsontable, row: number, column: number, value: any, result: boolean) => {},
  (query: string, value: any, cellMeta: Handsontable.CellProperties) => true
);
plugin.setCallback((hotInstance: Handsontable, row: number, column: number, value: any, result: boolean) => {});
plugin.setQueryMethod((query: string, value: any, cellMeta: Handsontable.CellProperties) => true);
plugin.setSearchResultClass('searchResultClass');

const callback = plugin.getCallback();
const queryMethod = plugin.getQueryMethod();
const searchClass: string = plugin.getSearchResultClass();
