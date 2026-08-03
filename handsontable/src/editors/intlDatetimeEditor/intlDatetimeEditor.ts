import { DatetimeEditor } from '../datetimeEditor';

export const EDITOR_TYPE = 'intl-datetime';

/**
 * @private
 * @class IntlDatetimeEditor
 */
export class IntlDatetimeEditor extends DatetimeEditor {
  /**
   * Returns the unique editor type identifier for the intl-datetime editor.
   */
  static get EDITOR_TYPE() {
    return EDITOR_TYPE;
  }
}
