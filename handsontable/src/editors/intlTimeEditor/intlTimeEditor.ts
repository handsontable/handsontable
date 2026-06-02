import { TimeEditor } from '../timeEditor/timeEditor';

export const EDITOR_TYPE = 'intl-time';

/**
 * @private
 * @class IntlTimeEditor
 */
export class IntlTimeEditor extends TimeEditor {
  static get EDITOR_TYPE() {
    return EDITOR_TYPE;
  }
}
