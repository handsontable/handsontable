import HyperFormula from 'hyperformula';
import Handsontable from '../../../index';

const LICENSE_KEY = 'non-commercial-and-evaluation';

describe('Formulas: an undo of a remove after an insert in a reordered grid', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  const undo = () => hot.getPlugin('undoRedo').undo();
  const redo = () => hot.getPlugin('undoRedo').redo();

  const build = (settings) => {
    hot = new Handsontable(container, {
      formulas: { engine: HyperFormula, sheetName: 'Sheet1' },
      undoRedo: true,
      licenseKey: LICENSE_KEY,
      ...settings,
    });
  };

  const restoreRows = () => {
    hot.rowIndexMapper.setIndexesSequence([3, 0, 1, 2]);
    hot.alter('insert_row_above', 1);
    hot.rowIndexMapper.setIndexesSequence([0, 1, 2, 3, 4]);
    hot.alter('remove_row', 4);
  };

  const restoreColumns = () => {
    hot.columnIndexMapper.setIndexesSequence([3, 0, 1, 2]);
    hot.alter('insert_col_start', 1);
    hot.columnIndexMapper.setIndexesSequence([0, 1, 2, 3, 4]);
    hot.alter('remove_col', 4);
  };

  const rowData = [[null, null], [10, 20], [20, 40], [null, null]];
  const rowDataRestored = [...rowData, [null, null]];

  it('should restore the values of the formulas in the rows', () => {
    build({ data: [[10, '=A1*2'], [20, '=A2*2'], [null, null], [null, null]] });
    restoreRows();

    expect(hot.getData()).toEqual(rowData);

    undo();

    expect(hot.getData()).toEqual(rowDataRestored);
  });

  it('should restore the values of the formulas in the columns', () => {
    build({ data: [[10, 20, null, null], ['=A1*2', '=B1*2', null, null]] });
    restoreColumns();

    expect(hot.getData()).toEqual([[null, 10, 20, null], [null, 20, 40, null]]);

    undo();

    expect(hot.getData()).toEqual([[null, 10, 20, null, null], [null, 20, 40, null, null]]);
  });

  it('should keep the values through a redo and a second undo', () => {
    build({ data: [[10, '=A1*2'], [20, '=A2*2'], [null, null], [null, null]] });
    restoreRows();
    undo();
    redo();

    expect(hot.getData()).toEqual(rowData);

    undo();

    expect(hot.getData()).toEqual(rowDataRestored);
  });

  it('should keep the values through a redo and a second undo on columns', () => {
    build({ data: [[10, 20, null, null], ['=A1*2', '=B1*2', null, null]] });
    restoreColumns();
    undo();
    redo();

    expect(hot.getData()).toEqual([[null, 10, 20, null], [null, 20, 40, null]]);

    undo();

    expect(hot.getData()).toEqual([[null, 10, 20, null, null], [null, 20, 40, null, null]]);
  });

  it('should restore the values of the formulas when the insert itself is undone after the order returned', () => {
    build({ data: [[10, '=A1*2'], [20, '=A2*2'], [null, null], [null, null]] });
    hot.rowIndexMapper.setIndexesSequence([3, 0, 1, 2]);
    hot.alter('insert_row_above', 1);
    hot.rowIndexMapper.setIndexesSequence([0, 1, 2, 3, 4]);
    undo();

    expect(hot.getData()).toEqual([[null, null], [10, 20], [20, 40], [null, null]]);
  });

  it('should keep the values a second sheet on the same engine reads', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
    const otherContainer = document.createElement('div');

    document.body.appendChild(otherContainer);
    build({
      data: [[10, '=A1*2'], [20, '=A2*2'], [null, null], [null, null]],
      formulas: { engine, sheetName: 'Sheet1' },
    });

    const other = new Handsontable(otherContainer, {
      data: [['=Sheet1!B2', '=Sheet1!B3']],
      formulas: { engine, sheetName: 'Sheet2' },
      licenseKey: LICENSE_KEY,
    });

    hot.rowIndexMapper.setIndexesSequence([3, 0, 1, 2]);
    hot.alter('insert_row_above', 1);
    hot.rowIndexMapper.setIndexesSequence([0, 1, 2, 3, 4]);

    const beforeRemove = other.getDataAtRow(0);

    hot.alter('remove_row', 4);

    const afterRemove = other.getDataAtRow(0);

    undo();

    expect(hot.getData()).toEqual(rowDataRestored);
    expect(other.getDataAtRow(0)).toEqual(beforeRemove);

    redo();

    expect(hot.getData()).toEqual(rowData);
    expect(other.getDataAtRow(0)).toEqual(afterRemove);

    other.destroy();
    otherContainer.remove();
  });
});
