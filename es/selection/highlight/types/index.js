/* eslint-disable import/prefer-default-export */
import staticRegister from './../../../utils/staticRegister';

import activeHeaderHighlight from './activeHeader';
import areaHighlight from './area';
import cellHighlight from './cell';
import customSelection from './customSelection';
import fillHighlight from './fill';
import headerHighlight from './header';

var _staticRegister = staticRegister('highlight/types'),
    register = _staticRegister.register,
    getItem = _staticRegister.getItem;

register('active-header', activeHeaderHighlight);
register('area', areaHighlight);
register('cell', cellHighlight);
register('custom-selection', customSelection);
register('fill', fillHighlight);
register('header', headerHighlight);

function createHighlight(highlightType, options) {
  return getItem(highlightType)(options);
}

export { createHighlight };