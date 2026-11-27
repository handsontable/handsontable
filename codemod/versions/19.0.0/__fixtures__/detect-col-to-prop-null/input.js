import Handsontable from 'handsontable';

const hot = new Handsontable(document.querySelector('#grid'), {
  data: [{ id: 1 }],
  modifyData(row, column, valueHolder, ioMode) {},
});

const column = hot.propToCol('id');
const prop = hot.colToProp(0);
const values = hot.getDataAtProp(99);

// Not a grid instance.
const mapper = { propToCol() {} };

mapper.propToCol('id');
