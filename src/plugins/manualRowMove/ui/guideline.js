import {BaseUI} from './_base';
import {addClass} from './../../../helpers/dom/element';

const CSS_CLASSNAME = 'ht__manualRowMove--guideline';

class GuidelineUI extends BaseUI {
  constructor(hotInstance) {
    super(hotInstance);
  }

  build() {
    super.build();

    addClass(this.element, CSS_CLASSNAME);
  }
}

export {GuidelineUI};
