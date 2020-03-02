/* eslint-disable import/prefer-default-export */
import staticRegister from './../../../utils/staticRegister';

import activeHeaderHighlight from './activeHeader';
import areaHighlight, { defaultBorderStyle as areaBorderStyle } from './area';
import cellHighlight, { defaultBorderStyle as cellBorderStyle } from './cell';
import customSelection from './customSelection';
import fillHighlight, { defaultBorderStyle as fillBorderStyle } from './fill';
import headerHighlight from './header';

const defaultBorderStyles = new Map();
const {
  register,
  getItem,
} = staticRegister('highlight/types');

registerHighlight('active-header', activeHeaderHighlight);
registerHighlight('area', areaHighlight, areaBorderStyle);
registerHighlight('cell', cellHighlight, cellBorderStyle);
registerHighlight('custom-selection', customSelection);
registerHighlight('fill', fillHighlight, fillBorderStyle);
registerHighlight('header', headerHighlight);

/**
 * Registers highlight type into a static collection. When the default border
 * style class is passed, then it will be registered and stored as well.
 *
 * @param {string} highlightType The selection type.
 * @param {Function} functionFactory The factory function which produces selection instance on each call.
 * @param {BorderStyle} [borderStyle] Class prototype with border properties.
 */
function registerHighlight(highlightType, functionFactory, borderStyle) {
  if (borderStyle) {
    defaultBorderStyles.set(highlightType, borderStyle);
  }

  register(highlightType, functionFactory);
}

/**
 * @param {string} highlightType The selection type.
 * @param {object} options The selection options.
 * @returns {Selection}
 */
function createHighlight(highlightType, options) {
  return getItem(highlightType)(options);
}

/**
 * Gets default border properties for specific highlight type.
 *
 * @param {string} highlightType The selection type.
 * @returns {object}
 */
function getDefaultBorderStyle(highlightType) {
  return defaultBorderStyles.get(highlightType) || {};
}

export {
  createHighlight,
  getDefaultBorderStyle,
};
