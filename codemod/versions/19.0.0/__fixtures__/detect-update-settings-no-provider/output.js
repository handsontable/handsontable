import Handsontable from 'handsontable';

// A grid with no dataProvider is not reported.
const hot = new Handsontable(document.querySelector('#grid'), { data: [[1]] });

hot.updateSettings({ data: [[2]] });
