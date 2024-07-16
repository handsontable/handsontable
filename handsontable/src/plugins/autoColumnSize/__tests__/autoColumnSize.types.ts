import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {
  autoColumnSize: true,
});
new Handsontable(document.createElement('div'), {
  autoColumnSize: {
    syncLimit: '40%'
  },
});
new Handsontable(document.createElement('div'), {
  autoColumnSize: {
    useHeaders: true,
    syncLimit: 20,
  },
});
new Handsontable(document.createElement('div'), {
  autoColumnSize: {
    samplingRatio: 20,
  },
});
new Handsontable(document.createElement('div'), {
  autoColumnSize: {
    allowSampleDuplicates: true,
  },
});
const autoColumnSize = hot.getPlugin('autoColumnSize');

autoColumnSize.calculateVisibleColumnsWidth();
autoColumnSize.calculateColumnsWidth();
autoColumnSize.calculateColumnsWidth(1, 2);
autoColumnSize.calculateColumnsWidth({ from: 1, to: 2 }, { from: 4, to: 5 }, true);
autoColumnSize.calculateAllColumnsWidth();
autoColumnSize.calculateAllColumnsWidth({ from: 1, to: 2 });
autoColumnSize.recalculateAllColumnsWidth();
autoColumnSize.clearCache();
autoColumnSize.clearCache([1, 2, 3]);

const syncCalculationLimit: number = autoColumnSize.getSyncCalculationLimit();
const columnWidth1: number = autoColumnSize.getColumnWidth(1);
const columnWidth2: number = autoColumnSize.getColumnWidth(1, 10);
const columnWidth3: number = autoColumnSize.getColumnWidth(1, 10, true);
const firstVisibleColumn: number = autoColumnSize.getFirstVisibleColumn();
const lastVisibleColumn: number = autoColumnSize.getLastVisibleColumn();
const isNeedRecalculate: boolean = autoColumnSize.isNeedRecalculate();
