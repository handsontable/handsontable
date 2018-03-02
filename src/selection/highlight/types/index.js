/* eslint-disable import/prefer-default-export */
import staticRegister from './../../../utils/staticRegister';

import areaHighlight from './area';
import cellHighlight from './cell';
import fillHighlight from './fill';
import headerHighlight from './header';

const {
  register,
  getItem,
  hasItem,
  getNames,
  getValues,
} = staticRegister('highlight/types');

register('area', areaHighlight);
register('cell', cellHighlight);
register('fill', fillHighlight);
register('header', headerHighlight);

function createHighlight(highlightType, options) {
  return getItem(highlightType)(options);
}

export {
  createHighlight,
};
