import { DateEditor } from '../dateEditor/dateEditor';

export const EDITOR_TYPE = 'intl-date';

/**
 * @private
 * @class IntlDateEditor
 */
export class IntlDateEditor extends DateEditor {
  static get EDITOR_TYPE() {
    return EDITOR_TYPE;
  }
}
