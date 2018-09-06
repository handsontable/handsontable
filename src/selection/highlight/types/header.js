import { Selection } from './../../../3rdparty/walkontable/src';

/**
 * Creates the new instance of Selection, responsible for highlighting row and column headers. This type of selection
 * can occur multiple times.
 *
 * @return {Selection}
 */
function createHighlight({ headerClassName, rowClassName, columnClassName }) {
  const s = new Selection({
    className: 'highlight',
    highlightHeaderClassName: headerClassName,
    highlightRowClassName: rowClassName,
    highlightColumnClassName: columnClassName,
  });

  return s;
}

export default createHighlight;
