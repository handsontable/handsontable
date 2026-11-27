import Handsontable from 'handsontable';

const hot = new Handsontable(document.querySelector('#grid'), {
  data: [{ id: 1 }],
  // TODO(handsontable-codemod 19.0.0/col-to-prop-null): Check this code for null before it uses the result. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#coltoprop-and-proptocol-return-null-for-an-unknown-column
  modifyData(row, column, valueHolder, ioMode) {},
});

// TODO(handsontable-codemod 19.0.0/col-to-prop-null): Check this code for null before it uses the result. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#coltoprop-and-proptocol-return-null-for-an-unknown-column
const column = hot.propToCol('id');
// TODO(handsontable-codemod 19.0.0/col-to-prop-null): Check this code for null before it uses the result. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#coltoprop-and-proptocol-return-null-for-an-unknown-column
const prop = hot.colToProp(0);
// TODO(handsontable-codemod 19.0.0/col-to-prop-null): Check this code for null before it uses the result. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#coltoprop-and-proptocol-return-null-for-an-unknown-column
const values = hot.getDataAtProp(99);

// Not a grid instance.
const mapper = { propToCol() {} };

mapper.propToCol('id');
