import { condition as trueFunction } from 'handsontable/plugins/filters/condition/true';
import { condition as falseFunction } from 'handsontable/plugins/filters/condition/false';
import { condition as beginsWithFunction } from 'handsontable/plugins/filters/condition/beginsWith';
import { condition as endsWithFunction } from 'handsontable/plugins/filters/condition/endsWith';
import { condition as containsFunction } from 'handsontable/plugins/filters/condition/contains';
import { operationResult as conjunction } from 'handsontable/plugins/filters/logicalOperations/conjunction';
import { conditionFactory, dateRowFactory } from '../helpers/utils';

describe('Operation on set of conditions (`conjunction`)', () => {
  const data = dateRowFactory();
  const trueConditionMock = conditionFactory(trueFunction);
  const falseConditionMock = conditionFactory(falseFunction);
  const beginsWithConditionMock = conditionFactory(beginsWithFunction);
  const endsWithConditionMock = conditionFactory(endsWithFunction);
  const containsWithConditionMock = conditionFactory(containsFunction);
  const anycellData = data('');
  const cellData = data('Alibaba');

  it('should filter matching values', () => {
    expect(conjunction([trueConditionMock(), trueConditionMock(), trueConditionMock()], anycellData)).toBe(true);
    expect(conjunction([beginsWithConditionMock(['a']), endsWithConditionMock(['a']), containsWithConditionMock(['b'])], cellData)).toBe(true);
  });

  it('should filter not matching values', () => {
    expect(conjunction([trueConditionMock(), falseConditionMock(), falseConditionMock()], anycellData)).toBe(false);
    expect(conjunction([trueConditionMock(), falseConditionMock(), trueConditionMock()], anycellData)).toBe(false);
    expect(conjunction([beginsWithConditionMock(['a']), falseConditionMock(), falseConditionMock()], cellData)).toBe(false);
    expect(conjunction([beginsWithConditionMock(['a']), endsWithConditionMock(['a']), containsWithConditionMock(['z'])], cellData)).toBe(false);
    expect(conjunction([falseConditionMock(), falseConditionMock(), falseConditionMock()], anycellData)).toBe(false);
    expect(conjunction([beginsWithConditionMock(['b']), endsWithConditionMock(['b']), containsWithConditionMock(['z'])], cellData)).toBe(false);
  });
});
