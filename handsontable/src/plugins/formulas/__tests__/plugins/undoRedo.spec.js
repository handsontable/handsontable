import HyperFormula from 'hyperformula';

describe('Formulas with Undo/Redo integration', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should properly undo/redo when overwriting a formula', async() => {
    handsontable({
      data: [
        [2, 3, 4, 5],
        ['=A1*10', null, '=A2*10', null],
      ],
      contextMenu: true,
      colHeaders: true,
      formulas: {
        engine: HyperFormula
      }
    });

    await selectCell(0, 0);
    // Overwritten formula
    simulateFillHandleDrag(getCell(1, 0));

    await sleep(100);

    expect(getSourceData()).toEqual([
      [2, 3, 4, 5],
      [2, null, '=A2*10', null],
    ]);
    expect(getData()).toEqual([
      [2, 3, 4, 5],
      [2, null, 20, null],
    ]);

    simulateFillHandleDrag(getCell(1, 1));

    await sleep(100);

    expect(getSourceData()).toEqual([
      [2, 2, 4, 5],
      [2, 2, '=A2*10', null],
    ]);
    expect(getData()).toEqual([
      [2, 2, 4, 5],
      [2, 2, 20, null],
    ]);

    getPlugin('undoRedo').undo();

    expect(getSourceData()).toEqual([
      [2, 3, 4, 5],
      [2, null, '=A2*10', null],
    ]);
    expect(getData()).toEqual([
      [2, 3, 4, 5],
      [2, null, 20, null],
    ]);

    getPlugin('undoRedo').undo();

    expect(getSourceData()).toEqual([
      [2, 3, 4, 5],
      ['=A1*10', null, '=A2*10', null],
    ]);
    expect(getData()).toEqual([
      [2, 3, 4, 5],
      [20, null, 200, null],
    ]);

    getPlugin('undoRedo').redo();

    expect(getSourceData()).toEqual([
      [2, 3, 4, 5],
      [2, null, '=A2*10', null],
    ]);
    expect(getData()).toEqual([
      [2, 3, 4, 5],
      [2, null, 20, null],
    ]);

    getPlugin('undoRedo').redo();

    expect(getSourceData()).toEqual([
      [2, 2, 4, 5],
      [2, 2, '=A2*10', null],
    ]);
    expect(getData()).toEqual([
      [2, 2, 4, 5],
      [2, 2, 20, null],
    ]);

    getPlugin('undoRedo').undo();

    expect(getSourceData()).toEqual([
      [2, 3, 4, 5],
      [2, null, '=A2*10', null],
    ]);
    expect(getData()).toEqual([
      [2, 3, 4, 5],
      [2, null, 20, null],
    ]);
  });

  it('should properly undo/redo when populating a formula', async() => {
    handsontable({
      data: [
        [2, 3, 4, 5],
        ['=A1*10', null, '=A2*10', null],
      ],
      contextMenu: true,
      colHeaders: true,
      formulas: {
        engine: HyperFormula
      }
    });

    await selectCell(1, 2);

    simulateFillHandleDrag(getCell(1, 3));

    await sleep(100);

    getPlugin('undoRedo').undo();

    expect(getSourceData()).toEqual([
      [2, 3, 4, 5],
      ['=A1*10', null, '=A2*10', null],
    ]);
    expect(getData()).toEqual([
      [2, 3, 4, 5],
      [20, null, 200, null],
    ]);

    getPlugin('undoRedo').redo();

    expect(getSourceData()).toEqual([
      [2, 3, 4, 5],
      ['=A1*10', null, '=A2*10', '=B2*10'],
    ]);
    expect(getData()).toEqual([
      [2, 3, 4, 5],
      [20, null, 200, 0],
    ]);

    getPlugin('undoRedo').undo();

    expect(getSourceData()).toEqual([
      [2, 3, 4, 5],
      ['=A1*10', null, '=A2*10', null],
    ]);
    expect(getData()).toEqual([
      [2, 3, 4, 5],
      [20, null, 200, null],
    ]);
  });

  it('should properly undo/redo when populating simple values', async() => {
    handsontable({
      data: [
        [2, 3, 4, 5],
        ['=A1*10', null, '=A2*10', null],
      ],
      contextMenu: true,
      colHeaders: true,
      formulas: {
        engine: HyperFormula
      }
    });

    await selectCell(0, 0);

    simulateFillHandleDrag(getCell(0, 3));

    await sleep(100);

    getPlugin('undoRedo').undo();

    expect(getSourceData()).toEqual([
      [2, 3, 4, 5],
      ['=A1*10', null, '=A2*10', null],
    ]);
    expect(getData()).toEqual([
      [2, 3, 4, 5],
      [20, null, 200, null],
    ]);

    getPlugin('undoRedo').redo();

    expect(getSourceData()).toEqual([
      [2, 2, 2, 2],
      ['=A1*10', null, '=A2*10', null],
    ]);
    expect(getData()).toEqual([
      [2, 2, 2, 2],
      [20, null, 200, null],
    ]);

    getPlugin('undoRedo').undo();

    expect(getSourceData()).toEqual([
      [2, 3, 4, 5],
      ['=A1*10', null, '=A2*10', null],
    ]);
    expect(getData()).toEqual([
      [2, 3, 4, 5],
      [20, null, 200, null],
    ]);
  });
});
