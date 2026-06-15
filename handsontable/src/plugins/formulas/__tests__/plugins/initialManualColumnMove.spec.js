import HyperFormula from 'hyperformula';

describe('Formulas: initial manualColumnMove configuration (issue #9952)', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should return correct values from getSourceData() and getData() when grid has initial column order set', async() => {
    handsontable({
      data: [
        ['A1', 'B1', '=SUM(1, 2)', 'D1'],
        ['A2', 'B2', '=SUM(1, 2)', 'D2'],
        ['A3', 'B3', '=SUM(1, 2)', 'D3'],
        ['A4', 'B4', '=SUM(1, 2)', 'D4'],
        ['A5', 'B5', '=SUM(1, 2)', 'D5'],
      ],
      manualColumnMove: [0, 2, 1, 3],
      formulas: {
        engine: HyperFormula,
      },
    });

    expect(getSourceData()).toEqual([
      ['A1', 'B1', '=SUM(1, 2)', 'D1'],
      ['A2', 'B2', '=SUM(1, 2)', 'D2'],
      ['A3', 'B3', '=SUM(1, 2)', 'D3'],
      ['A4', 'B4', '=SUM(1, 2)', 'D4'],
      ['A5', 'B5', '=SUM(1, 2)', 'D5'],
    ]);

    expect(getData()).toEqual([
      ['A1', 3, 'B1', 'D1'],
      ['A2', 3, 'B2', 'D2'],
      ['A3', 3, 'B3', 'D3'],
      ['A4', 3, 'B4', 'D4'],
      ['A5', 3, 'B5', 'D5'],
    ]);
  });

  it('should return correct values when formula references another column and initial column order is set', async() => {
    handsontable({
      data: [
        [1, '=A1+10', 100, 1000],
        [2, '=A2+10', 200, 2000],
      ],
      manualColumnMove: [0, 2, 1, 3],
      formulas: {
        engine: HyperFormula,
      },
    });

    // HF rewrites the formula text after the column order is applied because the formula's relative
    // references shift with the formula's new visual position. The original `=A1+10` at physical
    // column 1 moves to visual column 2, so the relative reference shifts from A1 to B1. This
    // matches HF behavior for runtime `moveColumns` calls.
    expect(getSourceData()).toEqual([
      [1, '=B1+10', 100, 1000],
      [2, '=B2+10', 200, 2000],
    ]);

    expect(getData()).toEqual([
      [1, 100, 110, 1000],
      [2, 200, 210, 2000],
    ]);
  });

  it('should keep getSourceData() consistent after performing a runtime move on top of an initial move config', async() => {
    handsontable({
      data: [
        ['A1', 'B1', '=SUM(1, 2)', 'D1'],
        ['A2', 'B2', '=SUM(1, 2)', 'D2'],
      ],
      manualColumnMove: [0, 2, 1, 3],
      formulas: {
        engine: HyperFormula,
      },
    });

    // Verify initial state is correct first.
    expect(getSourceData()).toEqual([
      ['A1', 'B1', '=SUM(1, 2)', 'D1'],
      ['A2', 'B2', '=SUM(1, 2)', 'D2'],
    ]);

    // Move column at visual index 0 to visual index 3.
    getPlugin('manualColumnMove').moveColumn(0, 3);
    await render();

    // After the runtime move, getData should follow new visual order.
    // Visual was [A, =SUM, B, D]; after moving visual 0 (=A) to position 3:
    //   visual = [=SUM, B, D, A] (in terms of original column labels)
    // So evaluated row: [3, 'B1', 'D1', 'A1'].
    expect(getData()).toEqual([
      [3, 'B1', 'D1', 'A1'],
      [3, 'B2', 'D2', 'A2'],
    ]);

    // getSourceData remains in physical order. Values stay the same because
    // SUM has no cell references to rewrite.
    expect(getSourceData()).toEqual([
      ['A1', 'B1', '=SUM(1, 2)', 'D1'],
      ['A2', 'B2', '=SUM(1, 2)', 'D2'],
    ]);
  });

  it('should handle initial manualRowMove combined with initial manualColumnMove', async() => {
    handsontable({
      data: [
        ['A1', 'B1', '=SUM(1, 2)', 'D1'],
        ['A2', 'B2', '=SUM(1, 2)', 'D2'],
        ['A3', 'B3', '=SUM(1, 2)', 'D3'],
      ],
      manualColumnMove: [0, 2, 1, 3],
      manualRowMove: [2, 0, 1],
      formulas: {
        engine: HyperFormula,
      },
    });

    expect(getSourceData()).toEqual([
      ['A1', 'B1', '=SUM(1, 2)', 'D1'],
      ['A2', 'B2', '=SUM(1, 2)', 'D2'],
      ['A3', 'B3', '=SUM(1, 2)', 'D3'],
    ]);

    expect(getData()).toEqual([
      ['A3', 3, 'B3', 'D3'],
      ['A1', 3, 'B1', 'D1'],
      ['A2', 3, 'B2', 'D2'],
    ]);
  });

  it('should handle initial manualColumnMove with column sorting', async() => {
    handsontable({
      data: [
        ['A3', 'B3', '=SUM(1, 2)', 'D3'],
        ['A1', 'B1', '=SUM(1, 2)', 'D1'],
        ['A2', 'B2', '=SUM(1, 2)', 'D2'],
      ],
      manualColumnMove: [0, 2, 1, 3],
      columnSorting: {
        initialConfig: { column: 0, sortOrder: 'asc' },
      },
      formulas: {
        engine: HyperFormula,
      },
    });

    expect(getSourceData()).toEqual([
      ['A3', 'B3', '=SUM(1, 2)', 'D3'],
      ['A1', 'B1', '=SUM(1, 2)', 'D1'],
      ['A2', 'B2', '=SUM(1, 2)', 'D2'],
    ]);

    expect(getData()).toEqual([
      ['A1', 3, 'B1', 'D1'],
      ['A2', 3, 'B2', 'D2'],
      ['A3', 3, 'B3', 'D3'],
    ]);
  });

  it('should handle initial manualColumnMove applied via updateSettings', async() => {
    handsontable({
      data: [
        ['A1', 'B1', '=SUM(1, 2)', 'D1'],
        ['A2', 'B2', '=SUM(1, 2)', 'D2'],
      ],
      manualColumnMove: true,
      formulas: {
        engine: HyperFormula,
      },
    });

    await updateSettings({
      data: [
        ['A1', 'B1', '=SUM(1, 2)', 'D1'],
        ['A2', 'B2', '=SUM(1, 2)', 'D2'],
      ],
      manualColumnMove: [0, 2, 1, 3],
    });

    expect(getSourceData()).toEqual([
      ['A1', 'B1', '=SUM(1, 2)', 'D1'],
      ['A2', 'B2', '=SUM(1, 2)', 'D2'],
    ]);

    expect(getData()).toEqual([
      ['A1', 3, 'B1', 'D1'],
      ['A2', 3, 'B2', 'D2'],
    ]);
  });
});
