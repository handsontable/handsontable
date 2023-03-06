import { HIGHLIGHT_ACTIVE_HEADER_TYPE } from '../../../3rdparty/walkontable/src';
import VisualSelection from '../visualSelection';

/**
 * @param {object} highlightParams A configuration object to create a highlight.
 * @param {string} highlightParams.activeHeaderClassName Highlighted headers' class name.
 * @returns {Selection}
 */
function createHighlight({ activeHeaderClassName, ...restOptions }) {
  const s = new VisualSelection({
    className: activeHeaderClassName,
    ...restOptions,
    selectionType: HIGHLIGHT_ACTIVE_HEADER_TYPE,
  });

  return s;
}

export default createHighlight;
