import { Selection } from './../../../3rdparty/walkontable/src';

/**
 * Creates the new instance of Selection responsible for highlighting currently selected cell. This type of selection
 * can present on the table only one at the time.
 *
 * @return {Selection}
 */
function createHighlight(_ref) {
  var border = _ref.border,
      cellRange = _ref.cellRange;

  var s = new Selection(border, cellRange);

  return s;
}

export default createHighlight;