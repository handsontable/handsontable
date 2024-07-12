import Handsontable from 'handsontable';
import { ComputedBorder } from 'handsontable/plugins/customBorders';

const hot = new Handsontable(document.createElement('div'), {
  customBorders: true,
});
// borders using range
new Handsontable(document.createElement('div'), {
  customBorders: [
    {
      range: {
        from: {
          row: 1,
          col: 1
        },
        to: {
          row: 3,
          col: 4
        },
      },
      start: {},
      end: {},
      top: {},
      bottom: {},
    },
  ],
});
// borders using coords
new Handsontable(document.createElement('div'), {
  customBorders: [
    {
      row: 2,
      col: 2,
      start: {
        width: 2,
        color: 'red',
      },
      end: {
        width: 1,
        color: 'green',
      },
      top: '',
      bottom: '',
    }
  ],
});
const customBorders = hot.getPlugin('customBorders');

customBorders.setBorders(hot.getSelected()!, {
  top: { width: 1 },
});
customBorders.setBorders(hot.getSelected()!, {
  bottom: { color: 'red' },
});
customBorders.setBorders(hot.getSelectedRange()!, {
  start: { hide: true },
});
customBorders.setBorders(hot.getSelectedRange()!, {
  end: { hide: true, width: 2, color: 'blue' },
});
customBorders.setBorders(hot.getSelectedRange()!, {
  top: { width: 1 },
  bottom: { color: 'red' },
  start: { hide: true },
  end: { hide: true, width: 2, color: 'blue' },
});
customBorders.clearBorders(hot.getSelected()!);
customBorders.clearBorders(hot.getSelectedRange()!);
customBorders.clearBorders();

const borders1: ComputedBorder[] = customBorders.getBorders(hot.getSelected()!);
const borders2: ComputedBorder[] = customBorders.getBorders(hot.getSelectedRange()!);
const borders3: ComputedBorder[] = customBorders.getBorders();
