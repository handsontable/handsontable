import Handsontable from 'handsontable';

const engine = createEngine();

new Handsontable(document.querySelector('#grid'), {
  data: [[1]],
  afterRender() {
    // TODO(handsontable-codemod 19.0.0/after-render-engine-write): Check that no afterRender hook calls this on every render. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#an-afterrender-hook-that-writes-to-the-engine-loops
    engine.setCellContents({ sheet: 0, row: 0, col: 1 }, 1);
  },
});
