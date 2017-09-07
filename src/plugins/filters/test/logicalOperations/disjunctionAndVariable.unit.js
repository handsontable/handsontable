import {condition as trueFunction} from 'handsontable-pro/plugins/filters/condition/true';
import {condition as falseFunction} from 'handsontable-pro/plugins/filters/condition/false';
import {condition as beginsWithFunction} from 'handsontable-pro/plugins/filters/condition/beginsWith';
import {condition as endsWithFunction} from 'handsontable-pro/plugins/filters/condition/endsWith';
import {condition as containsFunction} from 'handsontable-pro/plugins/filters/condition/contains';
import {operationResult as disjunctionAndVariable} from 'handsontable-pro/plugins/filters/logicalOperations/disjunctionAndVariable';
import {conditionFactory, dateRowFactory} from './../helpers/utils';

describe('Operation on set of conditions (`disjunction and variable`)', function() {
  const data = dateRowFactory();
  const trueConditionMock = conditionFactory(trueFunction);
  const falseConditionMock = conditionFactory(falseFunction);
  const beginsWithConditionMock = conditionFactory(beginsWithFunction);
  const endsWithConditionMock = conditionFactory(endsWithFunction);
  const containsWithConditionMock = conditionFactory(containsFunction);
  const anycellData = data('');
  const cellData = data('Alibaba');

  it('should filter matching values', function() {
    expect(disjunctionAndVariable([trueConditionMock(), trueConditionMock(), trueConditionMock()], anycellData)).toBe(true);
    expect(disjunctionAndVariable([trueConditionMock(), falseConditionMock(), trueConditionMock()], anycellData)).toBe(true);
    expect(disjunctionAndVariable([beginsWithConditionMock(['a']), endsWithConditionMock(['a']), containsWithConditionMock(['b'])], cellData)).toBe(true);
  });

  it('should filter not matching values', function() {
    expect(disjunctionAndVariable([trueConditionMock(), falseConditionMock(), falseConditionMock()], anycellData)).toBe(false);
    expect(disjunctionAndVariable([beginsWithConditionMock(['a']), falseConditionMock(), falseConditionMock()], cellData)).toBe(false);
    expect(disjunctionAndVariable([beginsWithConditionMock(['a']), endsWithConditionMock(['a']), containsWithConditionMock(['z'])], cellData)).toBe(false);
    expect(disjunctionAndVariable([falseConditionMock(), falseConditionMock(), falseConditionMock()], anycellData)).toBe(false);
    expect(disjunctionAndVariable([beginsWithConditionMock(['b']), endsWithConditionMock(['b']), containsWithConditionMock(['z'])], cellData)).toBe(false);
  });

  it('should throw error when handling less than 3 arguments', function () {
    expect(function() {
      disjunctionAndVariable([trueConditionMock()]);
    }).toThrow();

    expect(function() {
      disjunctionAndVariable([trueConditionMock(), falseConditionMock()]);
    }).toThrow();
  });
});
