import Handsontable from 'handsontable';

const engine = createEngine();

new Handsontable(document.querySelector('#grid'), {
  data: [[1]],
  afterRender() {
    engine.setCellContents({ sheet: 0, row: 0, col: 1 }, 1);
  },
});
