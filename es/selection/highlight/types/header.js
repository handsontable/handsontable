import { Selection } from './../../../3rdparty/walkontable/src';

/**
 * Creates the new instance of Selection, responsible for highlighting row and column headers. This type of selection
 * can occur multiple times.
 *
 * @return {Selection}
 */
function createHighlight(_ref) {
  var headerClassName = _ref.headerClassName,
      rowClassName = _ref.rowClassName,
      columnClassName = _ref.columnClassName;

  var s = new Selection({
    className: 'highlight',
    highlightHeaderClassName: headerClassName,
    highlightRowClassName: rowClassName,
    highlightColumnClassName: columnClassName
  });

  return s;
}

export default createHighlight;