import BaseUI from './_base';
import { addClass } from '../../../helpers/dom/element';

const CSS_CLASSNAME = 'ht__manualRowMove--guideline';

/**
 * @class GuidelineUI
 * @util
 */
class GuidelineUI extends BaseUI {
  /**
   * Custom className on build process.
   */
  build() {
    super.build();

    addClass(this._element, CSS_CLASSNAME);
  }
}

export default GuidelineUI;
