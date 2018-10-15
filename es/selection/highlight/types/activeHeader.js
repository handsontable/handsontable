import { Selection } from './../../../3rdparty/walkontable/src';

/**
 * @return {Selection}
 */
function createHighlight(_ref) {
  var activeHeaderClassName = _ref.activeHeaderClassName;

  var s = new Selection({
    highlightHeaderClassName: activeHeaderClassName
  });

  return s;
}

export default createHighlight;