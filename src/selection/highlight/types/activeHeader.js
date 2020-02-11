import { Selection } from './../../../3rdparty/walkontable/src';

/**
 * @returns {Selection}
 */
function createHighlight({ activeHeaderClassName }) {
  const s = new Selection({
    highlightHeaderClassName: activeHeaderClassName,
  });

  return s;
}

export default createHighlight;
