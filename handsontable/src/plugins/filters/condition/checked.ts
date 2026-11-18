import * as C from '../../../i18n/constants';
import { registerCondition } from '../conditionRegisterer';
import { matchCheckboxTemplate } from '../../../utils/checkboxColumn';
import type { CheckboxMeta } from '../../../utils/checkboxColumn';

export const CONDITION_NAME = 'checked';

type DataRow = {
  value: unknown;
  meta: CheckboxMeta;
};

/**
 * Matches a cell whose value is the checked template of its checkbox, or reads the same as it, ignoring
 * case (see `matchCheckboxTemplate()`). An empty cell and a value that matches neither template do not match.
 *
 * @param {object} dataRow The object which holds and describes the single cell value.
 * @returns {boolean}
 */
export function condition(dataRow: DataRow) {
  return matchCheckboxTemplate(dataRow.value, dataRow.meta) === 'checked';
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_CHECKED,
  inputsCount: 0,
  showOperators: true
});
