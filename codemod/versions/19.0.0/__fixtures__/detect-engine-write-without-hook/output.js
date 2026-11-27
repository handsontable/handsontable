import Handsontable from 'handsontable';

const engine = createEngine();

// A write outside an afterRender hook is not reported.
engine.setCellContents({ sheet: 0, row: 0, col: 1 }, 1);

new Handsontable(document.querySelector('#grid'), { data: [[1]] });
