import staticRegister from './../../../utils/staticRegister';

import {
  HIGHLIGHT_ACTIVE_HEADER_TYPE,
  HIGHLIGHT_AREA_TYPE,
  HIGHLIGHT_FOCUS_TYPE,
  HIGHLIGHT_CUSTOM_SELECTION_TYPE,
  HIGHLIGHT_FILL_TYPE,
  HIGHLIGHT_HEADER_TYPE,
  HIGHLIGHT_ROW_TYPE,
  HIGHLIGHT_COLUMN_TYPE,
} from '../../../3rdparty/walkontable/src';
import activeHeaderHighlight from './activeHeader';
import areaHighlight from './area';
import columnHighlight from './column';
import focusHighlight from './focus';
import customSelection from './customSelection';
import fillHighlight from './fill';
import headerHighlight from './header';
import rowHighlight from './row';

const {
  register,
  getItem,
} = staticRegister('highlight/types');

register(HIGHLIGHT_ACTIVE_HEADER_TYPE, activeHeaderHighlight);
register(HIGHLIGHT_AREA_TYPE, areaHighlight);
register(HIGHLIGHT_FOCUS_TYPE, focusHighlight);
register(HIGHLIGHT_CUSTOM_SELECTION_TYPE, customSelection);
register(HIGHLIGHT_FILL_TYPE, fillHighlight);
register(HIGHLIGHT_HEADER_TYPE, headerHighlight);
register(HIGHLIGHT_ROW_TYPE, rowHighlight);
register(HIGHLIGHT_COLUMN_TYPE, columnHighlight);

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
