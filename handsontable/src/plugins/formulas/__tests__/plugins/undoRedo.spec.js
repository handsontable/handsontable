import HyperFormula from 'hyperformula';

describe('Formulas integration with undo/redo', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  const autofill = (endRow, endCol) => {
    const target = spec().$container.find(`tbody tr:eq(${endRow}) td:eq(${endCol})`);

    simulateFillHandleDrag(target);
  };

  it('should restore previous edited formula expression and recalculate table after that', async() => {
    handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: {
        engine: HyperFormula
      },
      width: 500,
      height: 300
    });

    await setDataAtCell(0, 5, '=B5');
    getPlugin('undoRedo').undo();

    expect(getSourceDataAtCell(0, 5)).toBe('=A$1');
    expect(getDataAtCell(0, 5)).toBe(0);

    getPlugin('undoRedo').redo();

    expect(getSourceDataAtCell(0, 5)).toBe('=B5');
    expect(getDataAtCell(0, 5)).toBe(8042);
  });

  it('should restore previous state and recalculate formula again after trying changing readOnly cell (#dev-2136)', async() => {
    handsontable({
      data: [
        ['1'],
        ['1'],
        ['=A1+A2'],
      ],
      cell: [{ row: 2, col: 0, readOnly: true }],
      formulas: {
        engine: HyperFormula
      },
    });

    await populateFromArray(0, 0, [[5]]);
    await populateFromArray(2, 0, [[10]]);

    getPlugin('undoRedo').undo();

    expect(getDataAtCell(2, 0)).toBe(2);
  });

  it('should restore previous state after alter table (mixed insert operations)', async() => {
    handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: {
        engine: HyperFormula
      },
      width: 500,
      height: 300,
      contextMenu: true,
    });

    await alter('insert_row_above', 1, 3);
    await alter('insert_col_start', 1);
    await alter('insert_col_start', 4, 2);
    await alter('insert_row_above', 5);
    getPlugin('undoRedo').undo();

    expect(getSourceDataAtRow(0))
      .toEqual(['=$C$5', null, 'Maserati', 'Mazda', null, null, 'Mercedes', 'Mini', '=A$1']);
    expect(getSourceDataAtRow(1)).toEqual([null, null, null, null, null, null, null, null, null]);
    expect(getSourceDataAtRow(2)).toEqual([null, null, null, null, null, null, null, null, null]);
    expect(getSourceDataAtRow(3)).toEqual([null, null, null, null, null, null, null, null, null]);
    expect(getSourceDataAtRow(4)).toEqual([2009, null, 0, 2941, null, null, 4303, 354, 5814]);
    expect(getSourceDataAtRow(5)).toEqual([2010, null, 5, 2905, null, null, 2867, '=SUM(A7,2,3)', '=$C1']);
    expect(getSourceDataAtRow(6)).toEqual([2011, null, 4, 2517, null, null, 4822, 552, 6127]);
    expect(getSourceDataAtRow(7))
      .toEqual([2012, null, '=SUM(A5:A8)', '=SUM(C8,H6)', null, null, '=A5/C5', 12, '\'=SUM(E5)']);

    getPlugin('undoRedo').undo();

    expect(getSourceDataAtRow(0)).toEqual(['=$C$5', null, 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
    expect(getSourceDataAtRow(1)).toEqual([null, null, null, null, null, null, null]);
    expect(getSourceDataAtRow(2)).toEqual([null, null, null, null, null, null, null]);
    expect(getSourceDataAtRow(3)).toEqual([null, null, null, null, null, null, null]);
    expect(getSourceDataAtRow(4)).toEqual([2009, null, 0, 2941, 4303, 354, 5814]);
    expect(getSourceDataAtRow(5)).toEqual([2010, null, 5, 2905, 2867, '=SUM(A7,2,3)', '=$C1']);
    expect(getSourceDataAtRow(6)).toEqual([2011, null, 4, 2517, 4822, 552, 6127]);
    expect(getSourceDataAtRow(7))
      .toEqual([2012, null, '=SUM(A5:A8)', '=SUM(C8,F6)', '=A5/C5', 12, '\'=SUM(E5)']);

    getPlugin('undoRedo').undo();

    expect(getSourceDataAtRow(0)).toEqual(['=$B$5', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
    expect(getSourceDataAtRow(1)).toEqual([null, null, null, null, null, null]);
    expect(getSourceDataAtRow(2)).toEqual([null, null, null, null, null, null]);
    expect(getSourceDataAtRow(3)).toEqual([null, null, null, null, null, null]);
    expect(getSourceDataAtRow(4)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(getSourceDataAtRow(5)).toEqual([2010, 5, 2905, 2867, '=SUM(A7,2,3)', '=$B1']);
    expect(getSourceDataAtRow(6)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(getSourceDataAtRow(7))
      .toEqual([2012, '=SUM(A5:A8)', '=SUM(B8,E6)', '=A5/B5', 12, '\'=SUM(E5)']);

    getPlugin('undoRedo').undo();

    expect(getSourceDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
    expect(getSourceDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(getSourceDataAtRow(2)).toEqual([2010, 5, 2905, 2867, '=SUM(A4,2,3)', '=$B1']);
    expect(getSourceDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(getSourceDataAtRow(4))
      .toEqual([2012, '=SUM(A2:A5)', '=SUM(B5,E3)', '=A2/B2', 12, '\'=SUM(E5)']);
  });

  it('should redo into the next state after alter table (mixed insert operations)', async() => {
    handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: {
        engine: HyperFormula
      },
      width: 500,
      height: 300,
      contextMenu: true,
    });

    await alter('insert_row_above', 1, 3);
    await alter('insert_col_start', 1);
    await alter('insert_col_start', 4, 2);
    await alter('insert_row_above', 5);
    getPlugin('undoRedo').undo();
    getPlugin('undoRedo').undo();
    getPlugin('undoRedo').undo();
    getPlugin('undoRedo').undo();

    expect(getSourceDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
    expect(getSourceDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(getSourceDataAtRow(2)).toEqual([2010, 5, 2905, 2867, '=SUM(A4,2,3)', '=$B1']);
    expect(getSourceDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(getSourceDataAtRow(4)).toEqual([2012, '=SUM(A2:A5)', '=SUM(B5,E3)', '=A2/B2', 12, '\'=SUM(E5)']);

    getPlugin('undoRedo').redo();

    expect(getSourceDataAtRow(0)).toEqual(['=$B$5', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
    expect(getSourceDataAtRow(1)).toEqual([null, null, null, null, null, null]);
    expect(getSourceDataAtRow(2)).toEqual([null, null, null, null, null, null]);
    expect(getSourceDataAtRow(3)).toEqual([null, null, null, null, null, null]);
    expect(getSourceDataAtRow(4)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(getSourceDataAtRow(5)).toEqual([2010, 5, 2905, 2867, '=SUM(A7,2,3)', '=$B1']);
    expect(getSourceDataAtRow(6)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(getSourceDataAtRow(7)).toEqual([2012, '=SUM(A5:A8)', '=SUM(B8,E6)', '=A5/B5', 12, '\'=SUM(E5)']);

    getPlugin('undoRedo').redo();

    expect(getSourceDataAtRow(0)).toEqual(['=$C$5', null, 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
    expect(getSourceDataAtRow(1)).toEqual([null, null, null, null, null, null, null]);
    expect(getSourceDataAtRow(2)).toEqual([null, null, null, null, null, null, null]);
    expect(getSourceDataAtRow(3)).toEqual([null, null, null, null, null, null, null]);
    expect(getSourceDataAtRow(4)).toEqual([2009, null, 0, 2941, 4303, 354, 5814]);
    expect(getSourceDataAtRow(5)).toEqual([2010, null, 5, 2905, 2867, '=SUM(A7,2,3)', '=$C1']);
    expect(getSourceDataAtRow(6)).toEqual([2011, null, 4, 2517, 4822, 552, 6127]);
    expect(getSourceDataAtRow(7)).toEqual([2012, null, '=SUM(A5:A8)', '=SUM(C8,F6)', '=A5/C5', 12, '\'=SUM(E5)']);

    getPlugin('undoRedo').redo();

    expect(getSourceDataAtRow(0))
      .toEqual(['=$C$5', null, 'Maserati', 'Mazda', null, null, 'Mercedes', 'Mini', '=A$1']);
    expect(getSourceDataAtRow(1)).toEqual([null, null, null, null, null, null, null, null, null]);
    expect(getSourceDataAtRow(2)).toEqual([null, null, null, null, null, null, null, null, null]);
    expect(getSourceDataAtRow(3)).toEqual([null, null, null, null, null, null, null, null, null]);
    expect(getSourceDataAtRow(4)).toEqual([2009, null, 0, 2941, null, null, 4303, 354, 5814]);
    expect(getSourceDataAtRow(5)).toEqual([2010, null, 5, 2905, null, null, 2867, '=SUM(A7,2,3)', '=$C1']);
    expect(getSourceDataAtRow(6)).toEqual([2011, null, 4, 2517, null, null, 4822, 552, 6127]);
    expect(getSourceDataAtRow(7))
      .toEqual([2012, null, '=SUM(A5:A8)', '=SUM(C8,H6)', null, null, '=A5/C5', 12, '\'=SUM(E5)']);
  });

  xit('should restore previous state after alter table (mixed remove operations)', async() => {
    handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: {
        engine: HyperFormula
      },
      width: 500,
      height: 300,
      contextMenu: true,
    });

    await alter('remove_row', 2);
    await alter('remove_col', 2, 2);
    await alter('remove_row', 0, 2);
    await alter('remove_col', 3);
    getPlugin('undoRedo').undo();

    expect(getSourceDataAtRow(0)).toEqual([2011, 4, 552, 6127]);
    expect(getSourceDataAtRow(1)).toEqual([2012, '=SUM(A1:A2)', 12, '=SUM(E5)']);

    getPlugin('undoRedo').undo();

    expect(getSourceDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mini', '=A$1']);
    expect(getSourceDataAtRow(1)).toEqual([2009, 0, 354, 5814]);
    expect(getSourceDataAtRow(2)).toEqual([2011, 4, 552, 6127]);
    expect(getSourceDataAtRow(3)).toEqual([2012, '=SUM(A2:A4)', 12, '=SUM(E5)']);

    getPlugin('undoRedo').undo();

    expect(getSourceDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
    expect(getSourceDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(getSourceDataAtRow(2)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(getSourceDataAtRow(3)).toEqual([2012, '=SUM(A2:A4)', '=SUM(B4,#REF!)', '=A2/B2', 12, '=SUM(E5)']);

    getPlugin('undoRedo').undo();

    expect(getSourceDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
    expect(getSourceDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(getSourceDataAtRow(2)).toEqual([2010, 5, 2905, 2867, '=SUM(A4,2,3)', '=$B1']);
    expect(getSourceDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(getSourceDataAtRow(4)).toEqual([2012, '=Sum(a2:a5)', '=SUM(B5,E3)', '=A2/B2', 12, '=SUM(E5)']);
  });

  xit('should redo into the next state after alter table (mixed remove operations)', async() => {
    handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: {
        engine: HyperFormula
      },
      width: 500,
      height: 300,
      contextMenu: true,
    });

    await alter('remove_row', 2);
    await alter('remove_col', 2, 2);
    await alter('remove_row', 0, 2);
    await alter('remove_col', 3);
    getPlugin('undoRedo').undo();
    getPlugin('undoRedo').undo();
    getPlugin('undoRedo').undo();
    getPlugin('undoRedo').undo();

    expect(getSourceDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
    expect(getSourceDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(getSourceDataAtRow(2)).toEqual([2010, 5, 2905, 2867, '=SUM(A4,2,3)', '=$B1']);
    expect(getSourceDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(getSourceDataAtRow(4)).toEqual([2012, '=Sum(a2:a5)', '=SUM(B5,E3)', '=A2/B2', 12, '=SUM(E5)']);

    getPlugin('undoRedo').redo();

    expect(getSourceDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
    expect(getSourceDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(getSourceDataAtRow(2)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(getSourceDataAtRow(3)).toEqual([2012, '=SUM(A2:A4)', '=SUM(B4,#REF!)', '=A2/B2', 12, '=SUM(E5)']);

    getPlugin('undoRedo').redo();

    expect(getSourceDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mini', '=A$1']);
    expect(getSourceDataAtRow(1)).toEqual([2009, 0, 354, 5814]);
    expect(getSourceDataAtRow(2)).toEqual([2011, 4, 552, 6127]);
    expect(getSourceDataAtRow(3)).toEqual([2012, '=SUM(A2:A4)', 12, '=SUM(E5)']);

    getPlugin('undoRedo').redo();

    expect(getSourceDataAtRow(0)).toEqual([2011, 4, 552, 6127]);
    expect(getSourceDataAtRow(1)).toEqual([2012, '=SUM(A1:A2)', 12, '=SUM(E5)']);
  });

  it('should work properly while doing cell used by some formula empty', async() => {
    handsontable({
      data: [
        [5, '=A1+1', '=B1+1'],
      ],
      contextMenu: true,
      colHeaders: true,
      formulas: {
        engine: HyperFormula
      }
    });

    await setDataAtCell(0, 0, null);

    expect(getSourceData()).toEqual([
      [null, '=A1+1', '=B1+1'],
    ]);
    expect(getData()).toEqual([
      [null, 1, 2],
    ]);

    getPlugin('undoRedo').undo();

    expect(getSourceData()).toEqual([
      [5, '=A1+1', '=B1+1'],
    ]);
    expect(getData()).toEqual([
      [5, 6, 7],
    ]);

    getPlugin('undoRedo').redo();

    expect(getSourceData()).toEqual([
      [null, '=A1+1', '=B1+1'],
    ]);
    expect(getData()).toEqual([
      [null, 1, 2],
    ]);
  });

  it('should cooperate properly with `setDataAtCell` action for multiple cells', async() => {
    handsontable({
      data: [
        [0, '=A1+1', '=B1+1'],
      ],
      contextMenu: true,
      colHeaders: true,
      formulas: {
        engine: HyperFormula
      }
    });

    await setDataAtCell([
      [0, 0, '=B1+2'],
      [0, 1, '=C1+2'],
      [0, 2, 10],
    ]);

    getPlugin('undoRedo').undo();

    expect(getSourceData()).toEqual([
      [0, '=A1+1', '=B1+1'],
    ]);
    expect(getData()).toEqual([
      [0, 1, 2],
    ]);

    getPlugin('undoRedo').redo();

    expect(getSourceData()).toEqual([
      ['=B1+2', '=C1+2', 10],
    ]);
    expect(getData()).toEqual([
      [14, 12, 10],
    ]);

    getPlugin('undoRedo').undo();

    expect(getSourceData()).toEqual([
      [0, '=A1+1', '=B1+1'],
    ]);
    expect(getData()).toEqual([
      [0, 1, 2],
    ]);
  });

  it('should show proper values when doing undo/redo after moving rows', async() => {
    handsontable({
      data: [
        [5],
        ['=A1+1'],
        ['=A2+1'],
      ],
      contextMenu: true,
      colHeaders: true,
      rowHeaders: true,
      formulas: {
        engine: HyperFormula
      },
      manualRowMove: true,
    });

    getPlugin('manualRowMove').moveRow(0, 1);

    await render();

    getPlugin('undoRedo').undo();

    expect(getSourceData()).toEqual([
      [5],
      ['=A1+1'],
      ['=A2+1'],
    ]);
    expect(getData()).toEqual([
      [5],
      [6],
      [7],
    ]);

    getPlugin('undoRedo').redo();

    expect(getSourceData()).toEqual([
      [5],
      ['=A2+1'],
      ['=A1+1'],
    ]);
    expect(getData()).toEqual([
      [6],
      [5],
      [7],
    ]);
  });

  it('should show proper values when doing undo/redo after changing sheet size', async() => {
    handsontable({
      data: [
        [0, '=A1+1', '=B1+1'],
      ],
      contextMenu: true,
      colHeaders: true,
      formulas: {
        engine: HyperFormula
      }
    });

    await alter('insert_col_start', 0);
    await alter('remove_col', 0);

    expect(getSourceData()).toEqual([
      [0, '=A1+1', '=B1+1'],
    ]);
    expect(getData()).toEqual([
      [0, 1, 2],
    ]);

    getPlugin('undoRedo').undo();

    expect(getSourceData()).toEqual([
      [null, 0, '=B1+1', '=C1+1'],
    ]);
    expect(getData()).toEqual([
      [null, 0, 1, 2],
    ]);

    getPlugin('undoRedo').undo();

    expect(getSourceData()).toEqual([
      [0, '=A1+1', '=B1+1'],
    ]);
    expect(getData()).toEqual([
      [0, 1, 2],
    ]);

    getPlugin('undoRedo').redo();

    expect(getSourceData()).toEqual([
      [null, 0, '=B1+1', '=C1+1'],
    ]);
    expect(getData()).toEqual([
      [null, 0, 1, 2],
    ]);

    getPlugin('undoRedo').redo();

    expect(getSourceData()).toEqual([
      [0, '=A1+1', '=B1+1'],
    ]);
    expect(getData()).toEqual([
      [0, 1, 2],
    ]);
  });

  describe('should show proper value when doing undo/redo after reducing sheet size', () => {
    it('(removing cell with value used by some formula)', async() => {
      handsontable({
        data: [
          [2],
          ['=A1*10']
        ],
        contextMenu: true,
        colHeaders: true,
        formulas: {
          engine: HyperFormula
        }
      });

      await alter('remove_row', 0);

      getPlugin('undoRedo').undo();

      expect(getSourceData()).toEqual([
        [2],
        ['=A1*10'],
      ]);
      expect(getData()).toEqual([
        [2],
        [20],
      ]);

      getPlugin('undoRedo').redo();

      expect(getSourceData()).toEqual([
        ['=#REF!*10'],
      ]);
      expect(getData()).toEqual([
        ['#REF!'],
      ]);
    });

    it('(removing formula using value from some cell)', async() => {
      handsontable({
        data: [
          [2],
          ['=A1*10']
        ],
        contextMenu: true,
        colHeaders: true,
        formulas: {
          engine: HyperFormula
        }
      });

      await alter('remove_row', 1);

      getPlugin('undoRedo').undo();

      expect(getSourceData()).toEqual([
        [2],
        ['=A1*10'],
      ]);
      expect(getData()).toEqual([
        [2],
        [20],
      ]);

      getPlugin('undoRedo').redo();

      expect(getSourceData()).toEqual([
        [2],
      ]);
      expect(getData()).toEqual([
        [2],
      ]);
    });
  });

  describe('should cooperate with the Autofill plugin properly', () => {
    it('(overwriting formula)', async() => {
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
      autofill(1, 0);

      await waitForNextAnimationFrames(2);

      expect(getSourceData()).toEqual([
        [2, 3, 4, 5],
        [2, null, '=A2*10', null],
      ]);
      expect(getData()).toEqual([
        [2, 3, 4, 5],
        [2, null, 20, null],
      ]);

      autofill(1, 1);

      await waitForNextAnimationFrames(2);

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

    it('(populating formula)', async() => {
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

      autofill(1, 3);

      await waitForNextAnimationFrames(2);

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

    it('(populating simple values)', async() => {
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

      autofill(0, 3);

      await waitForNextAnimationFrames(2);

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
});
