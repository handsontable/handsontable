import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {
  filters: true,
});

const conditionCollection = hot.getPlugin('filters').conditionCollection;
const cellLikeData = {
  meta: {
    row: 1,
    col: 1,
    visualCol: 1,
    visualRow: 1,
    type: 'text',
    instance: hot,
  },
  value: 'foo',
}
const condition = {
  args: [3],
  name: 'eq' as Handsontable.plugins.FiltersPlugin.ConditionName,
};

if (conditionCollection) {
  conditionCollection.isEmpty();
  conditionCollection.isMatch(cellLikeData, 2);
  conditionCollection.isMatchInConditions(
    [{
      name: 'not_between',
      args: [[3]],
      func: (dataRow, values) => true,
    }],
    cellLikeData,
    'conjunction'
  );
  conditionCollection.addCondition(2, condition);
  conditionCollection.addCondition(2, condition, 'conjunction');
  conditionCollection.addCondition(2, condition, 'conjunction', 3);
  conditionCollection.getConditions(3);
  conditionCollection.getFilteredColumns();
  conditionCollection.getColumnStackPosition(3);
  conditionCollection.getOperation(3);
  conditionCollection.exportAllConditions();
  conditionCollection.importAllConditions([condition]);
  conditionCollection.removeConditions(3);
  conditionCollection.hasConditions(3, 'eq');
  conditionCollection.clean();
  conditionCollection.destroy();
}
