import Walkontable from 'walkontable/core';
import Overlay from 'walkontable/overlay/_base';
import BottomLeftCornerOverlay from 'walkontable/overlay/bottomLeftCorner';
import TopLeftCornerOverlay from 'walkontable/overlay/topLeftCorner';

describe('bottomLeftCornerOverlay', () => {
  it('should have a horizontal translation', () => {
    const holder = document.createElement('div');
    const div = document.createElement('div');
    const wttable = document.createElement('table');

    holder.appendChild(wttable);
    div.appendChild(holder);
    const walkontable = new Walkontable({
      data: {},
      table: wttable,
      totalRows: {},
      totalColumns: {}
    });
    Overlay.registerOverlay('bottom_left_corner', BottomLeftCornerOverlay);
    Overlay.registerOverlay('top_left_corner', TopLeftCornerOverlay);
    const bottomLeftCornerOverlay = new BottomLeftCornerOverlay(walkontable);
    bottomLeftCornerOverlay.resetFixedPosition();

    expect(bottomLeftCornerOverlay.overlayRoot.style.transform).toBe('translate3d(0px,0px,0)');
  });
});
