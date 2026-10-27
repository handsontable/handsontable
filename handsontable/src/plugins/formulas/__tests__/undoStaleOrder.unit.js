import HyperFormula from 'hyperformula';
import Handsontable from '../../../base';
import { registerAllModules } from '../../../registry';

registerAllModules();

describe('Formulas undo and redo of an edit followed by a reorder', () => {
  let container;
  let hot;
  let engine;

  const create = (settings) => {
    engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
    hot = new Handsontable(container, {
      formulas: { engine, sheetName: 'Sheet1' },
      undoRedo: true,
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });
  };
  const undo = () => hot.getPlugin('undoRedo').undo();
  const redo = () => hot.getPlugin('undoRedo').redo();
  const engineValues = () => engine.getSheetValues(engine.getSheetId('Sheet1'));
  const rowData = () => [[10, '=A1*2'], [20, '=A2*2'], [30, '=A3*2']];

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot.destroy();
    container.remove();
  });

  it('should keep the grid order when an edit made in physical order is undone after a row reorder', () => {
    create({ data: rowData() });
    hot.setDataAtCell(0, 0, 7);
    hot.rowIndexMapper.setIndexesSequence([1, 2, 0]);

    expect(hot.getData()).toEqual([[20, 40], [30, 60], [7, 14]]);

    undo();

    expect(hot.getData()).toEqual([[20, 40], [30, 60], [10, 20]]);
    expect(engineValues()).toEqual([[20, 40], [30, 60], [10, 20]]);

    redo();

    expect(hot.getData()).toEqual([[20, 40], [30, 60], [7, 14]]);
    expect(engineValues()).toEqual([[20, 40], [30, 60], [7, 14]]);
  });

  it('should keep the grid order when an edit made in a reordered grid is undone after another row reorder', () => {
    create({ data: rowData() });
    hot.rowIndexMapper.setIndexesSequence([2, 0, 1]);
    hot.setDataAtCell(0, 0, 7);
    hot.rowIndexMapper.setIndexesSequence([1, 2, 0]);

    expect(hot.getData()).toEqual([[20, 40], [7, 14], [10, 20]]);

    undo();

    expect(hot.getData()).toEqual([[20, 40], [30, 60], [10, 20]]);
    expect(engineValues()).toEqual([[20, 40], [30, 60], [10, 20]]);

    redo();

    expect(hot.getData()).toEqual([[20, 40], [7, 14], [10, 20]]);
    expect(engineValues()).toEqual([[20, 40], [7, 14], [10, 20]]);
  });

  it('should keep the grid order when an edit made in a reordered grid is undone after a column reorder', () => {
    create({ data: [[10, 20, 30], ['=A1*2', '=B1*2', '=C1*2']] });
    hot.columnIndexMapper.setIndexesSequence([2, 0, 1]);
    hot.setDataAtCell(0, 0, 7);
    hot.columnIndexMapper.setIndexesSequence([1, 2, 0]);

    expect(hot.getData()).toEqual([[20, 7, 10], [40, 14, 20]]);

    undo();

    expect(hot.getData()).toEqual([[20, 30, 10], [40, 60, 20]]);
    expect(engineValues()).toEqual([[20, 30, 10], [40, 60, 20]]);

    redo();

    expect(hot.getData()).toEqual([[20, 7, 10], [40, 14, 20]]);
    expect(engineValues()).toEqual([[20, 7, 10], [40, 14, 20]]);
  });

  it('should apply a redo in the order the grid has now, not the one the edit was made in', () => {
    create({ data: rowData() });
    hot.rowIndexMapper.setIndexesSequence([2, 0, 1]);
    hot.setDataAtCell(0, 0, 7);
    undo();
    hot.rowIndexMapper.setIndexesSequence([0, 1, 2]);
    redo();

    expect(hot.getData()).toEqual([[10, 20], [20, 40], [7, 14]]);
    expect(engineValues()).toEqual([[10, 20], [20, 40], [7, 14]]);
  });

  it('should walk undo and redo through moves and an edit made between them', () => {
    create({ data: rowData(), manualRowMove: true });

    const moves = hot.getPlugin('manualRowMove');

    moves.moveRow(2, 0);
    hot.setDataAtCell(0, 0, 7);
    moves.moveRow(1, 2);

    expect(hot.getData()).toEqual([[7, 14], [20, 40], [10, 20]]);

    undo();

    expect(hot.getData()).toEqual([[7, 14], [10, 20], [20, 40]]);

    undo();

    expect(hot.getData()).toEqual([[30, 60], [10, 20], [20, 40]]);
    expect(engineValues()).toEqual([[30, 60], [10, 20], [20, 40]]);

    undo();

    expect(hot.getData()).toEqual([[10, 20], [20, 40], [30, 60]]);

    redo();
    redo();
    redo();

    expect(hot.getData()).toEqual([[7, 14], [20, 40], [10, 20]]);
    expect(engineValues()).toEqual([[7, 14], [20, 40], [10, 20]]);
  });
});
