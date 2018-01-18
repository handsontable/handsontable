import {Selection} from './../../../3rdparty/walkontable/src';

/**
 * Creates the new instance of Selection responsible for highlighting area of the selected multiple cells.
 *
 * @return {Selection}
 */
function createHighlight({cornerVisible, multipleSelectionHandlesVisible, areaCornerVisible}) {
  const s = new Selection({
    className: 'area',
    border: {
      width: 1,
      color: '#89AFF9',
      cornerVisible: areaCornerVisible,
      multipleSelectionHandlesVisible,
    },
  });

  return s;
}

export default createHighlight;
