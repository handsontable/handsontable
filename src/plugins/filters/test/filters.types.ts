import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {
  filters: true,
});

const filters = hot.getPlugin('filters');

filters.enablePlugin();
filters.disablePlugin();
filters.isEnabled();
filters.addCondition(1, 'eq', [2]);
filters.addCondition(1, 'eq', [2], 'conjunction');
filters.removeConditions(1);
filters.clearConditions(1);
filters.filter();
filters.getSelectedColumn();
filters.getDataMapAtColumn(1);
filters.destroy();
