import { Selection } from './../../3rdparty/walkontable/src';

class VisualSelection extends Selection {
  add(coords) {
    return super.add(this.settings.translateCoords(coords));
  }

  getVisualCorners() {
    const topLeft = this.settings.untranslateCoords(this.cellRange.getTopLeftCorner());
    const bottomRight = this.settings.untranslateCoords(this.cellRange.getBottomRightCorner());

    return [
      topLeft.row,
      topLeft.col,
      bottomRight.row,
      bottomRight.col,
    ];
  }
}

export default VisualSelection;
