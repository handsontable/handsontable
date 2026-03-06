import Handsontable from 'handsontable';
import { ColumnConditions } from 'handsontable/plugins/filters';

const hot = new Handsontable(document.createElement('div'), {
  filters: true,
});

new Handsontable(document.createElement('div'), {
  filters: {
    searchMode: 'show',
  }
});

new Handsontable(document.createElement('div'), {
  filters: {
    searchMode: 'apply',
  }
});

const filters = hot.getPlugin('filters');

filters.enablePlugin();
filters.disablePlugin();
filters.isEnabled();
filters.addCondition(1, 'eq', [2]);
filters.addCondition(1, 'eq', [2], 'conjunction');
filters.removeConditions(1);
filters.clearConditions(1);
filters.importConditions([
  {
    column: 1,
    operation: 'conjunction',
    conditions: [
      {
        name: 'eq',
        args: [2],
      },
    ],
  },
]);
filters.filter();
filters.getDataMapAtColumn(1);
filters.destroy();

const conditions: ColumnConditions[] = filters.exportConditions();
const selectedColumn = filters.getSelectedColumn();

if (selectedColumn !== null) {
  const selectedColumnPhysicalIndex: number = selectedColumn.physicalIndex;
  const selectedColumnVisualIndex: number = selectedColumn.visualIndex;
}
