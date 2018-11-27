import { condition as trueFunction } from 'handsontable/plugins/filters/condition/true';
import { condition as falseFunction } from 'handsontable/plugins/filters/condition/false';
import { condition as beginsWithFunction } from 'handsontable/plugins/filters/condition/beginsWith';
import { condition as endsWithFunction } from 'handsontable/plugins/filters/condition/endsWith';
import { condition as containsFunction } from 'handsontable/plugins/filters/condition/contains';
import { operationResult as disjunctionWithExtraCondition } from 'handsontable/plugins/filters/logicalOperations/disjunctionWithExtraCondition';
import { conditionFactory, dateRowFactory } from '../helpers/utils';

describe('Operation on set of conditions (`disjunction and variable`)', () => {
  const data = dateRowFactory();
  const trueConditionMock = conditionFactory(trueFunction);
  const falseConditionMock = conditionFactory(falseFunction);
  const beginsWithConditionMock = conditionFactory(beginsWithFunction);
  const endsWithConditionMock = conditionFactory(endsWithFunction);
  const containsWithConditionMock = conditionFactory(containsFunction);
  const anycellData = data('');
  const cellData = data('Alibaba');

  it('should filter matching values', () => {
    expect(disjunctionWithExtraCondition([trueConditionMock(), trueConditionMock(), trueConditionMock()], anycellData)).toBe(true);
    expect(disjunctionWithExtraCondition([trueConditionMock(), falseConditionMock(), trueConditionMock()], anycellData)).toBe(true);
    expect(disjunctionWithExtraCondition([beginsWithConditionMock(['a']), endsWithConditionMock(['a']), containsWithConditionMock(['b'])], cellData)).toBe(true);
  });

  it('should filter not matching values', () => {
    expect(disjunctionWithExtraCondition([trueConditionMock(), falseConditionMock(), falseConditionMock()], anycellData)).toBe(false);
    expect(disjunctionWithExtraCondition([beginsWithConditionMock(['a']), falseConditionMock(), falseConditionMock()], cellData)).toBe(false);
    expect(disjunctionWithExtraCondition([beginsWithConditionMock(['a']), endsWithConditionMock(['a']), containsWithConditionMock(['z'])], cellData)).toBe(false);
    expect(disjunctionWithExtraCondition([falseConditionMock(), falseConditionMock(), falseConditionMock()], anycellData)).toBe(false);
    expect(disjunctionWithExtraCondition([beginsWithConditionMock(['b']), endsWithConditionMock(['b']), containsWithConditionMock(['z'])], cellData)).toBe(false);
  });

  it('should throw error when handling less than 3 arguments', () => {
    expect(() => {
      disjunctionWithExtraCondition([trueConditionMock()]);
    }).toThrow();

    expect(() => {
      disjunctionWithExtraCondition([trueConditionMock(), falseConditionMock()]);
    }).toThrow();
  });
});
