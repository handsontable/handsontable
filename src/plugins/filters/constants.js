import { clone } from '../../helpers/object';
import { arrayEach } from '../../helpers/array';
import { SEPARATOR } from '../contextMenu/predefinedItems';
import { getConditionDescriptor } from './conditionRegisterer';

import { CONDITION_NAME as CONDITION_NONE } from './condition/none';
import { CONDITION_NAME as CONDITION_EMPTY } from './condition/empty';
import { CONDITION_NAME as CONDITION_NOT_EMPTY } from './condition/notEmpty';
import { CONDITION_NAME as CONDITION_EQUAL } from './condition/equal';
import { CONDITION_NAME as CONDITION_NOT_EQUAL } from './condition/notEqual';
import { CONDITION_NAME as CONDITION_GREATER_THAN } from './condition/greaterThan';
import { CONDITION_NAME as CONDITION_GREATER_THAN_OR_EQUAL } from './condition/greaterThanOrEqual';
import { CONDITION_NAME as CONDITION_LESS_THAN } from './condition/lessThan';
import { CONDITION_NAME as CONDITION_LESS_THAN_OR_EQUAL } from './condition/lessThanOrEqual';
import { CONDITION_NAME as CONDITION_BETWEEN } from './condition/between';
import { CONDITION_NAME as CONDITION_NOT_BETWEEN } from './condition/notBetween';
import { CONDITION_NAME as CONDITION_BEGINS_WITH } from './condition/beginsWith';
import { CONDITION_NAME as CONDITION_ENDS_WITH } from './condition/endsWith';
import { CONDITION_NAME as CONDITION_CONTAINS } from './condition/contains';
import { CONDITION_NAME as CONDITION_NOT_CONTAINS } from './condition/notContains';
import { CONDITION_NAME as CONDITION_DATE_BEFORE } from './condition/date/before';
import { CONDITION_NAME as CONDITION_DATE_AFTER } from './condition/date/after';
import { CONDITION_NAME as CONDITION_TOMORROW } from './condition/date/tomorrow';
import { CONDITION_NAME as CONDITION_TODAY } from './condition/date/today';
import { CONDITION_NAME as CONDITION_YESTERDAY } from './condition/date/yesterday';
import { CONDITION_NAME as CONDITION_BY_VALUE } from './condition/byValue';
import { CONDITION_NAME as CONDITION_TRUE } from './condition/true';
import { CONDITION_NAME as CONDITION_FALSE } from './condition/false';

import { OPERATION_ID as OPERATION_AND } from './logicalOperations/conjunction';
import { OPERATION_ID as OPERATION_OR } from './logicalOperations/disjunction';
import { OPERATION_ID as OPERATION_OR_THEN_VARIABLE } from './logicalOperations/disjunctionWithExtraCondition';

export {
  CONDITION_NONE,
  CONDITION_EMPTY,
  CONDITION_NOT_EMPTY,
  CONDITION_EQUAL,
  CONDITION_NOT_EQUAL,
  CONDITION_GREATER_THAN,
  CONDITION_GREATER_THAN_OR_EQUAL,
  CONDITION_LESS_THAN,
  CONDITION_LESS_THAN_OR_EQUAL,
  CONDITION_BETWEEN,
  CONDITION_NOT_BETWEEN,
  CONDITION_BEGINS_WITH,
  CONDITION_ENDS_WITH,
  CONDITION_CONTAINS,
  CONDITION_NOT_CONTAINS,
  CONDITION_DATE_BEFORE,
  CONDITION_DATE_AFTER,
  CONDITION_TOMORROW,
  CONDITION_TODAY,
  CONDITION_YESTERDAY,
  CONDITION_BY_VALUE,
  CONDITION_TRUE,
  CONDITION_FALSE,
  OPERATION_AND,
  OPERATION_OR,
  OPERATION_OR_THEN_VARIABLE
};

export const TYPE_NUMERIC = 'numeric';
export const TYPE_TEXT = 'text';
export const TYPE_DATE = 'date';
/**
 * Default types and order for filter conditions.
 *
 * @type {Object}
 */
export const TYPES = {
  [TYPE_NUMERIC]: [
    CONDITION_NONE,
    SEPARATOR,
    CONDITION_EMPTY,
    CONDITION_NOT_EMPTY,
    SEPARATOR,
    CONDITION_EQUAL,
    CONDITION_NOT_EQUAL,
    SEPARATOR,
    CONDITION_GREATER_THAN,
    CONDITION_GREATER_THAN_OR_EQUAL,
    CONDITION_LESS_THAN,
    CONDITION_LESS_THAN_OR_EQUAL,
    CONDITION_BETWEEN,
    CONDITION_NOT_BETWEEN,
  ],
  [TYPE_TEXT]: [
    CONDITION_NONE,
    SEPARATOR,
    CONDITION_EMPTY,
    CONDITION_NOT_EMPTY,
    SEPARATOR,
    CONDITION_EQUAL,
    CONDITION_NOT_EQUAL,
    SEPARATOR,
    CONDITION_BEGINS_WITH,
    CONDITION_ENDS_WITH,
    SEPARATOR,
    CONDITION_CONTAINS,
    CONDITION_NOT_CONTAINS,
  ],
  [TYPE_DATE]: [
    CONDITION_NONE,
    SEPARATOR,
    CONDITION_EMPTY,
    CONDITION_NOT_EMPTY,
    SEPARATOR,
    CONDITION_EQUAL,
    CONDITION_NOT_EQUAL,
    SEPARATOR,
    CONDITION_DATE_BEFORE,
    CONDITION_DATE_AFTER,
    CONDITION_BETWEEN,
    SEPARATOR,
    CONDITION_TOMORROW,
    CONDITION_TODAY,
    CONDITION_YESTERDAY,
  ],
};

/**
 * Get options list for conditional filter by data type (e.q: `'text'`, `'numeric'`, `'date'`).
 *
 * @returns {Object}
 */
export default function getOptionsList(type) {
  const items = [];
  let typeName = type;

  if (!TYPES[typeName]) {
    typeName = TYPE_TEXT;
  }

  arrayEach(TYPES[typeName], (typeValue) => {
    let option;

    if (typeValue === SEPARATOR) {
      option = { name: SEPARATOR };

    } else {
      option = clone(getConditionDescriptor(typeValue));
    }
    items.push(option);
  });

  return items;
}
