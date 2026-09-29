import { HyperFormula } from 'hyperformula';
import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { Formulas } from '../formulas';
import { UndoRedo } from '../../undoRedo';
import { ManualRowMove } from '../../manualRowMove';

/**
 * The Formulas plugin observes undo and redo instead of driving them: the grid restores its own
 * state, and the plugin brings the engine in line with it - by writing the restored cells, or by
 * reloading its sheet when the rows or columns changed. The engine's own undo stack is never used, so
 * it cannot fall out of step with the grid's.
 */
describe('Formulas as an undo/redo observer', () => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(Formulas);
    registerPlugin(UndoRedo);
    registerPlugin(ManualRowMove);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  /**
   * Builds a small grid with the formulas and undoRedo plugins on.
   *
   * @param {Array[]} [data] The data.
   * @param {object} [settings] More settings.
   * @returns {object} The Handsontable instance.
   */
  function build(data = [[1, '=A1+10'], [2, null]], settings = {}) {
    hot = new Handsontable(container, {
      data,
      formulas: {
        engine: HyperFormula,
      },
      undoRedo: true,
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });

    return hot;
  }

  it('does not use the engine\'s own undo or redo', () => {
    build();

    const { engine } = hot.getPlugin('formulas');
    const engineUndo = jest.spyOn(engine, 'undo');
    const engineRedo = jest.spyOn(engine, 'redo');

    hot.setDataAtCell(0, 0, 5);
    hot.getPlugin('undoRedo').undo();
    hot.getPlugin('undoRedo').redo();

    expect(engineUndo).not.toHaveBeenCalled();
    expect(engineRedo).not.toHaveBeenCalled();
  });

  it('recalculates the dependent formulas after an undo and a redo of an edit', () => {
    build();

    hot.setDataAtCell(0, 0, 5);

    expect(hot.getDataAtCell(0, 1)).toBe(15);

    hot.getPlugin('undoRedo').undo();

    expect(hot.getDataAtCell(0, 0)).toBe(1);
    expect(hot.getDataAtCell(0, 1)).toBe(11);

    hot.getPlugin('undoRedo').redo();

    expect(hot.getDataAtCell(0, 0)).toBe(5);
    expect(hot.getDataAtCell(0, 1)).toBe(15);
  });

  it('restores a reference a row removal broke when the removal is undone', () => {
    build([[1, '=A2+10'], [2, null], [3, null]]);

    const { engine, sheetId } = hot.getPlugin('formulas');

    hot.alter('remove_row', 1, 1);

    expect(engine.getCellFormula({ sheet: sheetId, row: 0, col: 1 })).toBe('=#REF!+10');

    hot.getPlugin('undoRedo').undo();

    expect(hot.getSourceDataAtCol(0)).toEqual([1, 2, 3]);
    expect(engine.getCellFormula({ sheet: sheetId, row: 0, col: 1 })).toBe('=A2+10');
    expect(hot.getDataAtCell(0, 1)).toBe(12);
    expect(hot.getSourceDataAtCell(0, 1)).toBe('=A2+10');

    hot.getPlugin('undoRedo').redo();

    expect(hot.getSourceDataAtCol(0)).toEqual([1, 3]);
    expect(engine.getCellFormula({ sheet: sheetId, row: 0, col: 1 })).toBe('=#REF!+10');
  });

  it('keeps the shifted references right when a row insertion is undone', () => {
    build([[1, '=A3+10'], [2, null], [3, null]]);

    const { engine, sheetId } = hot.getPlugin('formulas');

    hot.alter('insert_row_above', 1, 1);

    expect(engine.getCellFormula({ sheet: sheetId, row: 0, col: 1 })).toBe('=A4+10');

    hot.getPlugin('undoRedo').undo();

    expect(hot.getSourceDataAtCol(0)).toEqual([1, 2, 3]);
    expect(engine.getCellFormula({ sheet: sheetId, row: 0, col: 1 })).toBe('=A3+10');
    expect(hot.getDataAtCell(0, 1)).toBe(13);
  });

  it('keeps a row move performed right after a redo synchronized with the engine', () => {
    build([[1, null], [2, null], [3, null]], { manualRowMove: true });

    hot.setDataAtCell(0, 1, 100);
    hot.getPlugin('undoRedo').undo();
    hot.getPlugin('undoRedo').redo();

    // Move the last row to the top: visual order is now 3, 1, 2.
    hot.getPlugin('manualRowMove').moveRow(2, 0);
    hot.render();

    // A formula referencing A1 written after the move must see the moved row's value.
    hot.setDataAtCell(1, 1, '=A1');

    expect(hot.getDataAtCell(1, 1)).toBe(3);
  });

  it('keeps the references a row move rewrote through an undo and a redo', () => {
    build([
      [1, 2],
      ['=A1+10', '=B1+10'],
      ['=A2+100', '=B2+100'],
      ['=A3+1000', '=B3+1000'],
      ['=A4+1000000', '=B4+1000000'],
    ], { manualRowMove: true });

    const { engine, sheetId } = hot.getPlugin('formulas');
    const movedValues = [[1111, 1112], [1001111, 1001112], [1, 2], [11, 12], [111, 112]];

    // The engine moves the rows and rewrites each reference so it keeps pointing at the same data.
    hot.getPlugin('manualRowMove').moveRows([0, 1, 2], 2);
    hot.render();

    expect(hot.getData()).toEqual(movedValues);
    expect(engine.getCellFormula({ sheet: sheetId, row: 0, col: 0 })).toBe('=A5+1000');

    hot.getPlugin('undoRedo').undo();

    expect(hot.getData()).toEqual([[1, 2], [11, 12], [111, 112], [1111, 1112], [1001111, 1001112]]);
    expect(engine.getCellFormula({ sheet: sheetId, row: 3, col: 0 })).toBe('=A3+1000');

    // Reapplying the order alone would break the references (`#REF!`): the redo has to bring back the
    // engine as the move left it.
    hot.getPlugin('undoRedo').redo();

    expect(hot.getData()).toEqual(movedValues);
    expect(engine.getCellFormula({ sheet: sheetId, row: 0, col: 0 })).toBe('=A5+1000');
  });

  it('keeps the engine in step with a row move that is undone', () => {
    build([[1, '=A1*2'], [2, '=A2*2'], [3, '=A3*2']], { manualRowMove: true });

    hot.getPlugin('manualRowMove').moveRow(2, 0);
    hot.render();

    expect(hot.getDataAtCol(1)).toEqual([6, 2, 4]);

    hot.getPlugin('undoRedo').undo();

    expect(hot.getDataAtCol(0)).toEqual([1, 2, 3]);
    expect(hot.getDataAtCol(1)).toEqual([2, 4, 6]);

    // A formula written after the undo addresses the rows in their restored order.
    hot.setDataAtCell(0, 1, '=A3');

    expect(hot.getDataAtCell(0, 1)).toBe(3);
  });
});
