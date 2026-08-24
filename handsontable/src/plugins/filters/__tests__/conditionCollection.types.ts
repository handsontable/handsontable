import Handsontable from 'handsontable/base';

interface ColumnConditions {
  column: number;
  operation: string;
  conditions: { name: string; args: unknown[] }[];
}

type Maybe<T> = T | undefined;
type OperationType = 'conjunction' | 'disjunction' | 'disjunctionWithExtraCondition';

interface Condition {
  name: string;
  args: unknown[];
  func?: (dataRow: unknown, values: unknown[]) => boolean;
}

const hot = Handsontable(document.createElement('div'), {
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
  name: 'eq',
};

if (conditionCollection) {
  conditionCollection.isEmpty();
  conditionCollection.isMatch(cellLikeData, 2);
  conditionCollection.isMatchInConditions(
    [{
      name: 'not_between',
      args: [[3]],
      func: (dataRow: unknown, values: unknown[]) => true,
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
