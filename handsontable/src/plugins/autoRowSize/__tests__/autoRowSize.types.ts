import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {
  autoRowSize: true,
});
new Handsontable(document.createElement('div'), {
  autoRowSize: {
    syncLimit: '40%'
  },
});
new Handsontable(document.createElement('div'), {
  autoRowSize: {
    samplingRatio: 20,
    syncLimit: 20,
  },
});
new Handsontable(document.createElement('div'), {
  autoRowSize: {
    allowSampleDuplicates: true,
  },
});
const autoRowSize = hot.getPlugin('autoRowSize');

autoRowSize.calculateVisibleRowsHeight();
autoRowSize.calculateRowsHeight();
autoRowSize.calculateRowsHeight(1, 2);
autoRowSize.calculateRowsHeight({ from: 1, to: 2 }, { from: 4, to: 5 }, true);
autoRowSize.calculateAllRowsHeight();
autoRowSize.calculateAllRowsHeight({ from: 1, to: 2 });
autoRowSize.recalculateAllRowsHeight();
autoRowSize.clearCache();
autoRowSize.clearCache([1, 2, 3]);
autoRowSize.clearCacheByRange(1);
autoRowSize.clearCacheByRange({ from: 1, to: 2 });

const syncCalculationLimit: number = autoRowSize.getSyncCalculationLimit();
const columnWidth1: number = autoRowSize.getRowHeight(1);
const columnWidth2: number = autoRowSize.getRowHeight(1, 10);
const columnHeaderHeight: number = autoRowSize.getColumnHeaderHeight();
const firstVisibleRow: number = autoRowSize.getFirstVisibleRow();
const lastVisibleRow: number = autoRowSize.getLastVisibleRow();
const isNeedRecalculate: boolean = autoRowSize.isNeedRecalculate();
