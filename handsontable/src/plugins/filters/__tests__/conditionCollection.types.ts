import Handsontable from 'handsontable/base';
import { ColumnConditions, OperationType } from 'handsontable/plugins/filters';
import { Condition } from 'handsontable/plugins/filters/conditionCollection';

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
};
const condition = {
  args: [3],
  name: 'eq' as Handsontable.plugins.Filters.ConditionName,
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
  conditionCollection.importAllConditions([{
    column: 1,
    conditions: [{
      name: 'gt',
      args: [],
    }],
    operation: 'conjunction',
  }]);
  conditionCollection.removeConditions(3);
  conditionCollection.hasConditions(3, 'eq');
  conditionCollection.clean();
  conditionCollection.destroy();

  const conditions: Condition[] = conditionCollection.getConditions(3);
  const filteredColumns = conditionCollection.getFilteredColumns();
  const columnStackPosition: Maybe<number> = conditionCollection.getColumnStackPosition(3);
  const operation: Maybe<OperationType> = conditionCollection.getOperation(3);
  const exportAllConditions: ColumnConditions[] = conditionCollection.exportAllConditions();
}
