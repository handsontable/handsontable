/* eslint-disable import/prefer-default-export */
import staticRegister from './../../../utils/staticRegister';

import activeHeaderHighlight from './activeHeader';
import areaHighlight from './area';
import cellHighlight from './cell';
import customSelection from './customSelection';
import fillHighlight from './fill';
import headerHighlight from './header';

// temporary. Move these functions to copyPaste.js

import { Selection } from './../../../3rdparty/walkontable/src';

const {
  register,
  getItem,
} = staticRegister('highlight/types');

register('active-header', activeHeaderHighlight);
register('area', areaHighlight);
register('cell', cellHighlight);
register('custom-selection', customSelection);
register('fill', fillHighlight);
register('header', headerHighlight);
register('copyingBack', createCopyingHighlightBack);
register('copyingFront', createCopyingHighlightFront);

function createHighlight(highlightType, options) {
  return getItem(highlightType)(options);
}

export {
  createHighlight,
};
function createCopyingHighlightBack() {
  const s = new Selection({
    className: 'copyingBack',
    border: {
      width: 2,
      color: '#fff',
    },
  });

  return s;
}
function createCopyingHighlightFront() {
  const s = new Selection({
    className: 'copyingFront',
    border: {
      width: 2,
      color: '#4b89ff',
    },
  });

  return s;
}
