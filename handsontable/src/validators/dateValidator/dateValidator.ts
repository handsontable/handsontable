import moment from 'moment';
import { getEditorInstance } from '../../editors/registry';
import { EDITOR_TYPE as DATE_EDITOR_TYPE } from '../../editors/dateEditor';
import { getNormalizedDate } from '../../helpers/date';
import type { HotInstance } from '../../core/types';

export const VALIDATOR_TYPE: 'date' = 'date';

interface DateValidatorContext {
  instance: HotInstance;
  dateFormat?: string;
  allowEmpty?: boolean;
  correctFormat?: boolean;
  visualRow: number;
  visualCol: number;
  [key: string]: unknown;
}

/**
 * The Date cell validator.
 *
 * @private
 * @param {*} value Value of edited cell.
 * @param {Function} callback Callback called with validation result.
 */
export function dateValidator(this: DateValidatorContext, value: unknown, callback: (valid: boolean) => void): void {
  const dateEditor = getEditorInstance(DATE_EDITOR_TYPE, this.instance) as { defaultDateFormat: string };
  let valueToValidate = value;
  let valid = true;

  if (valueToValidate === null || valueToValidate === undefined) {
    valueToValidate = '';
  }

  let isValidFormat = moment(
    valueToValidate as string | number | Date, this.dateFormat || dateEditor.defaultDateFormat, true).isValid();
  let isValidDate = moment(new Date(valueToValidate as string | number)).isValid() || isValidFormat;

  if (this.allowEmpty && valueToValidate === '') {
    isValidDate = true;
    isValidFormat = true;
  }
  if (!isValidDate) {
    valid = false;
  }
  if (!isValidDate && isValidFormat) {
    valid = true;
  }

  if (isValidDate && !isValidFormat) {
    if (this.correctFormat === true) { // if format correction is enabled
      const correctedValue = correctFormat(String(valueToValidate), this.dateFormat as string);
      const isCorrectedValueValid = moment(correctedValue, this.dateFormat, true).isValid();

      if (isCorrectedValueValid) {
        this.instance.setDataAtCell(this.visualRow, this.visualCol, correctedValue, 'dateValidator');
      }
      valid = isCorrectedValueValid;
    } else {
      valid = false;
    }
  }

  callback(valid);
}

dateValidator.VALIDATOR_TYPE = VALIDATOR_TYPE;

/**
 * Format the given string using moment.js' format feature.
 *
 * @param {string} value The value to format.
 * @param {string} dateFormat The date pattern to format to.
 * @returns {string}
 */
export function correctFormat(value: string, dateFormat: string) {
  const dateFromDate = moment(getNormalizedDate(value));
  const dateFromMoment = moment(value, dateFormat);
  const isAlphanumeric = value.search(/[A-Za-z]/g) > -1;
  let date;

  if ((dateFromDate.isValid() && dateFromDate.format('x') === dateFromMoment.format('x')) ||
      !dateFromMoment.isValid() ||
      isAlphanumeric) {
    date = dateFromDate;

  } else {
    date = dateFromMoment;
  }

  return date.format(dateFormat);
}
