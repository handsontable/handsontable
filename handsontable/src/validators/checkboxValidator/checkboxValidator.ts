import { isEmpty } from '../../helpers/mixed';
import { matchCheckboxTemplate } from '../../utils/checkboxColumn';
import type { CellProperties } from '../../settings';

export const VALIDATOR_TYPE: 'checkbox' = 'checkbox';

/**
 * The Checkbox cell validator. A value is valid when it matches the cell's `checkedTemplate` or
 * `uncheckedTemplate` (the same case-insensitive match the checkbox renderer uses), or when it is
 * empty and `allowEmpty` is not `false`.
 *
 * The `checkbox` cell type does not apply it on its own – set `validator: 'checkbox'` to opt in, and
 * add `allowInvalid: false` to reject a value such as `'Ted'` pasted or autofilled into the cell
 * instead of storing it and marking the cell invalid (DEV-355). The cell type does not register it
 * either: `registerAllModules()` and `registerAllValidators()` do, and a modular build that registers
 * only `CheckboxCellType` also calls `registerValidator(checkboxValidator)`.
 *
 * @private
 * @param {*} value Value of edited cell.
 * @param {Function} callback Callback called with validation result.
 */
export function checkboxValidator(
  this: CellProperties, value: unknown, callback: (valid: boolean) => void): void {
  // The templates come first: a template may itself be empty (`uncheckedTemplate: ''`), and the
  // value it stands for is valid whatever `allowEmpty` says.
  if (matchCheckboxTemplate(value, this) !== null) {
    callback(true);

    return;
  }

  callback(isEmpty(value) && this.allowEmpty !== false);
}

checkboxValidator.VALIDATOR_TYPE = VALIDATOR_TYPE;
