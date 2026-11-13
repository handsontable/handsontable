import Handsontable from 'handsontable';

new Handsontable(document.querySelector('#grid'), { data: [[1]], colWidths: null });

// Other values are not reported.
new Handsontable(document.querySelector('#other'), { data: [[1]], colWidths: 50 });
new Handsontable(document.querySelector('#third'), { data: [[1]], colWidths: [50, null] });
