import { getConditionDescriptor } from 'handsontable/plugins/filters/conditionRegisterer';
import { CONDITION_NAME as DATE_BEFORE } from 'handsontable/plugins/filters/condition/date/before';
import { CONDITION_NAME as DATE_AFTER } from 'handsontable/plugins/filters/condition/date/after';
import { CONDITION_NAME as DATE_BEFORE_OR_EQUAL } from 'handsontable/plugins/filters/condition/date/beforeOrEqual';
import { CONDITION_NAME as DATE_AFTER_OR_EQUAL } from 'handsontable/plugins/filters/condition/date/afterOrEqual';
import { CONDITION_NAME as INTL_DATE_BEFORE } from 'handsontable/plugins/filters/condition/intlDate/before';
import { CONDITION_NAME as INTL_DATE_AFTER } from 'handsontable/plugins/filters/condition/intlDate/after';
import {
  CONDITION_NAME as INTL_DATE_BEFORE_OR_EQUAL,
} from 'handsontable/plugins/filters/condition/intlDate/beforeOrEqual';
import {
  CONDITION_NAME as INTL_DATE_AFTER_OR_EQUAL,
} from 'handsontable/plugins/filters/condition/intlDate/afterOrEqual';
import { CONDITION_NAME as INTL_DATE_BETWEEN } from 'handsontable/plugins/filters/condition/intlDate/between';
import { CONDITION_NAME as INTL_TIME_BEFORE } from 'handsontable/plugins/filters/condition/intlTime/before';
import { CONDITION_NAME as INTL_TIME_AFTER } from 'handsontable/plugins/filters/condition/intlTime/after';
import {
  CONDITION_NAME as INTL_TIME_BEFORE_OR_EQUAL,
} from 'handsontable/plugins/filters/condition/intlTime/beforeOrEqual';
import {
  CONDITION_NAME as INTL_TIME_AFTER_OR_EQUAL,
} from 'handsontable/plugins/filters/condition/intlTime/afterOrEqual';
import { CONDITION_NAME as INTL_TIME_BETWEEN } from 'handsontable/plugins/filters/condition/intlTime/between';
import { CONDITION_NAME as CONTAINS } from 'handsontable/plugins/filters/condition/contains';

describe('Filters condition descriptors `inputType`', () => {
  it('should declare the `date` input type for date conditions with inputs', () => {
    expect(getConditionDescriptor(DATE_BEFORE).inputType).toBe('date');
    expect(getConditionDescriptor(DATE_AFTER).inputType).toBe('date');
    expect(getConditionDescriptor(DATE_BEFORE_OR_EQUAL).inputType).toBe('date');
    expect(getConditionDescriptor(DATE_AFTER_OR_EQUAL).inputType).toBe('date');
  });

  it('should declare the `date` input type for intl-date conditions with inputs', () => {
    expect(getConditionDescriptor(INTL_DATE_BEFORE).inputType).toBe('date');
    expect(getConditionDescriptor(INTL_DATE_AFTER).inputType).toBe('date');
    expect(getConditionDescriptor(INTL_DATE_BEFORE_OR_EQUAL).inputType).toBe('date');
    expect(getConditionDescriptor(INTL_DATE_AFTER_OR_EQUAL).inputType).toBe('date');
    expect(getConditionDescriptor(INTL_DATE_BETWEEN).inputType).toBe('date');
  });

  it('should declare the `time` input type for intl-time conditions with inputs', () => {
    expect(getConditionDescriptor(INTL_TIME_BEFORE).inputType).toBe('time');
    expect(getConditionDescriptor(INTL_TIME_AFTER).inputType).toBe('time');
    expect(getConditionDescriptor(INTL_TIME_BEFORE_OR_EQUAL).inputType).toBe('time');
    expect(getConditionDescriptor(INTL_TIME_AFTER_OR_EQUAL).inputType).toBe('time');
    expect(getConditionDescriptor(INTL_TIME_BETWEEN).inputType).toBe('time');
  });

  it('should not declare an input type for text conditions', () => {
    expect(getConditionDescriptor(CONTAINS).inputType).toBeUndefined();
  });
});
