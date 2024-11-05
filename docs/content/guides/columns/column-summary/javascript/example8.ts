import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';
import { NestedRows } from 'handsontable/plugins';
import { DetailedSettings } from 'handsontable/plugins/columnSummary';

const container = document.querySelector('#example8')!;

new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    {
      value: null,
      __children: [{ value: 5 }, { value: 6 }, { value: 7 }],
    },
    {
      __children: [{ value: 15 }, { value: 16 }, { value: 17 }],
    },
  ],
  columns: [{ data: 'value' }],
  nestedRows: true,
  rowHeaders: true,
  colHeaders: ['sum', 'min', 'max', 'count', 'average'],
  columnSummary() {
    const endpoints: DetailedSettings[] = [];
    const nestedRowsPlugin: NestedRows = this.hot.getPlugin('nestedRows');
    const getRowIndex = nestedRowsPlugin.dataManager!.getRowIndex.bind(
      nestedRowsPlugin.dataManager
    );

    const resultColumn = 0;

    let nestedRowsCache: any = null;

    if (nestedRowsPlugin.isEnabled()) {
      nestedRowsCache = nestedRowsPlugin.dataManager!.cache;
    } else {
      return [];
    }

    if (!nestedRowsCache) {
      return [];
    }

    for (let i = 0; i < nestedRowsCache.levels[0].length; i++) {
      if (
        !nestedRowsCache.levels[0][i].__children ||
        nestedRowsCache.levels[0][i].__children.length === 0
      ) {
        continue;
      }

      const tempEndpoint: DetailedSettings = {
        destinationColumn: resultColumn,
        destinationRow: getRowIndex(nestedRowsCache.levels[0][i]),
        type: 'sum',
        forceNumeric: true,
        ranges: [],
      };

      tempEndpoint.ranges!.push([
        getRowIndex(nestedRowsCache.levels[0][i].__children[0]),
        getRowIndex(
          nestedRowsCache.levels[0][i].__children[
            nestedRowsCache.levels[0][i].__children.length - 1
          ]
        ),
      ]);

      endpoints.push(tempEndpoint);
    }

    return endpoints;
  },
  autoWrapRow: true,
  autoWrapCol: true,
  height: 'auto',
});
