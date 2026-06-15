import { DateEditor } from '../dateEditor';

export const EDITOR_TYPE = 'intl-date';

/**
 * @private
 * @class IntlDateEditor
 */
export class IntlDateEditor extends DateEditor {
  /**
   * Returns the unique editor type identifier for the intl-date editor.
   */
  static get EDITOR_TYPE() {
    return EDITOR_TYPE;
  }
}
