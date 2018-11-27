import { condition as trueFunction } from 'handsontable-pro/plugins/filters/condition/true';
import { condition as falseFunction } from 'handsontable-pro/plugins/filters/condition/false';
import { condition as beginsWithFunction } from 'handsontable-pro/plugins/filters/condition/beginsWith';
import { condition as endsWithFunction } from 'handsontable-pro/plugins/filters/condition/endsWith';
import { condition as containsFunction } from 'handsontable-pro/plugins/filters/condition/contains';
import { operationResult as disjunction } from 'handsontable-pro/plugins/filters/logicalOperations/disjunction';
import { conditionFactory, dateRowFactory } from './../helpers/utils';

describe('Operation on set of conditions (`disjunction`)', () => {
  const data = dateRowFactory();
  const trueConditionMock = conditionFactory(trueFunction);
  const falseConditionMock = conditionFactory(falseFunction);
  const beginsWithConditionMock = conditionFactory(beginsWithFunction);
  const endsWithConditionMock = conditionFactory(endsWithFunction);
  const containsWithConditionMock = conditionFactory(containsFunction);
  const anycellData = data('');
  const cellData = data('Alibaba');

  it('should filter matching values', () => {
    expect(disjunction([trueConditionMock(), trueConditionMock(), trueConditionMock()], anycellData)).toBe(true);
    expect(disjunction([trueConditionMock(), falseConditionMock(), trueConditionMock()], anycellData)).toBe(true);
    expect(disjunction([trueConditionMock(), falseConditionMock(), falseConditionMock()], anycellData)).toBe(true);
    expect(disjunction([beginsWithConditionMock(['a']), falseConditionMock(), falseConditionMock()], cellData)).toBe(true);
    expect(disjunction([beginsWithConditionMock(['a']), endsWithConditionMock(['a']), containsWithConditionMock(['b'])], cellData)).toBe(true);
    expect(disjunction([beginsWithConditionMock(['a']), endsWithConditionMock(['a']), containsWithConditionMock(['z'])], cellData)).toBe(true);
  });

  it('should filter not matching values', () => {
    expect(disjunction([falseConditionMock(), falseConditionMock(), falseConditionMock()], anycellData)).toBe(false);
    expect(disjunction([beginsWithConditionMock(['b']), endsWithConditionMock(['b']), containsWithConditionMock(['z'])], cellData)).toBe(false);
  });
});
