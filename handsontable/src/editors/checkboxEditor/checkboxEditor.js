import { BaseEditor } from '../baseEditor';

export const EDITOR_TYPE = 'checkbox';

/**
 * @private
 * @class CheckboxEditor
 */
export class CheckboxEditor extends BaseEditor {
  static get EDITOR_TYPE() {
    return EDITOR_TYPE;
  }

  beginEditing() {}
  finishEditing() {}
  init() {}
  open() {}
  close() {}
  getValue() {}
  setValue() {}
  focus() {}
}
