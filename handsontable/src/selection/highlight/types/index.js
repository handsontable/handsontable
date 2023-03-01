import staticRegister from './../../../utils/staticRegister';

import {
  ACTIVE_HEADER_TYPE,
  AREA_TYPE,
  FOCUS_TYPE,
  CUSTOM_SELECTION_TYPE,
  FILL_TYPE,
  HEADER_TYPE,
} from '../constants';
import activeHeaderHighlight from './activeHeader';
import areaHighlight from './area';
import focusHighlight from './focus';
import customSelection from './customSelection';
import fillHighlight from './fill';
import headerHighlight from './header';

const {
  register,
  getItem,
} = staticRegister('highlight/types');

register(ACTIVE_HEADER_TYPE, activeHeaderHighlight);
register(AREA_TYPE, areaHighlight);
register(FOCUS_TYPE, focusHighlight);
register(CUSTOM_SELECTION_TYPE, customSelection);
register(FILL_TYPE, fillHighlight);
register(HEADER_TYPE, headerHighlight);

/**
 * @param {string} highlightType The selection type.
 * @param {object} options The selection options.
 * @returns {Selection}
 */
function createHighlight(highlightType, options) {
  return getItem(highlightType)({
    type: highlightType,
    ...options
  });
}

export {
  createHighlight,
};
