import Handsontable from 'handsontable';

const hot = new Handsontable(document.querySelector('#grid'), {
  data: [[1, 2], [3, 4]],
  autoRowSize: true,
  autoColumnSize: { useHeaders: true },
});
const autoRowSize = hot.getPlugin('autoRowSize');

const direct = hot.getPlugin('autoRowSize').getSetting('useHeaders');
const named = autoRowSize.getSetting('useHeaders');

// The autoColumnSize plugin keeps the key, and the other settings of autoRowSize are not reported.
const columns = hot.getPlugin('autoColumnSize').getSetting('useHeaders');
const syncLimit = autoRowSize.getSetting('syncLimit');
const other = { getSetting() { return true; } };

other.getSetting('useHeaders');
