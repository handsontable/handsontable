import { TimeEditor } from '../timeEditor';

export const EDITOR_TYPE = 'intl-time';

/**
 * @private
 * @class IntlTimeEditor
 */
export class IntlTimeEditor extends TimeEditor {
  /**
   * Returns the unique editor type identifier for the intl-time editor.
   */
  static get EDITOR_TYPE() {
    return EDITOR_TYPE;
  }

}
