import { ACTIVE_HEADER_TYPE } from '../constants';
import VisualSelection from '../visualSelection';

/**
 * @returns {Selection}
 */
function createHighlight({ activeHeaderClassName, ...restOptions }) {
  const s = new VisualSelection({
    highlightHeaderClassName: activeHeaderClassName,
    ...restOptions,
    selectionType: ACTIVE_HEADER_TYPE,
  });

  return s;
}

export default createHighlight;
