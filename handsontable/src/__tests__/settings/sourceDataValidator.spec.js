describe('settings', () => {
  describe('sourceDataValidator', () => {
    const id = 'testContainer';

    beforeEach(function() {
      this.$container = $(`<div id="${id}"></div>`).appendTo('body');
    });

    afterEach(function() {
      if (this.$container) {
        destroy();
        this.$container.remove();
      }
    });

    it('should have defined default value', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      expect(getCellMeta(0, 0).sourceDataValidator).toBeUndefined();
    });

    it('should be called on table initialization', async() => {
      const sourceDataValidator = jasmine.createSpy('sourceDataValidator');

      handsontable({
        data: createSpreadsheetData(5, 5),
        sourceDataValidator,
      });

      expect(sourceDataValidator).toHaveBeenCalledTimes(25);
      // Source-data validation resolves meta uncached, so the validator receives a meta object that
      // carries the cascade (including its coordinates) but not the render-time extensions.
      expect(sourceDataValidator).toHaveBeenCalledWith('E5', jasmine.objectContaining({ row: 4, col: 4 }), 'init');
    });

    it('should be called when calling `loadData`', async() => {
      const sourceDataValidator = jasmine.createSpy('sourceDataValidator');

      handsontable({
        data: [[]],
        sourceDataValidator,
      });

      sourceDataValidator.calls.reset();

      await loadData(createSpreadsheetData(5, 5));

      expect(sourceDataValidator).toHaveBeenCalledTimes(25);
      expect(sourceDataValidator).toHaveBeenCalledWith('E5', jasmine.objectContaining({ row: 4, col: 4 }), 'loadData');
    });

    it('should be called when calling `updateData`', async() => {
      const sourceDataValidator = jasmine.createSpy('sourceDataValidator');

      handsontable({
        data: [[]],
        sourceDataValidator,
      });

      sourceDataValidator.calls.reset();

      await updateData(createSpreadsheetData(5, 5));

      expect(sourceDataValidator).toHaveBeenCalledTimes(25);
      expect(sourceDataValidator)
        .toHaveBeenCalledWith('E5', jasmine.objectContaining({ row: 4, col: 4 }), 'updateData');
    });

    it('should be called when calling `setSourceDataAtCell`', async() => {
      const sourceDataValidator = jasmine.createSpy('sourceDataValidator');

      handsontable({
        data: createSpreadsheetData(5, 5),
        sourceDataValidator,
      });

      sourceDataValidator.calls.reset();

      await setSourceDataAtCell(0, 0, 'test');

      expect(sourceDataValidator).toHaveBeenCalledTimes(1);
      expect(sourceDataValidator).toHaveBeenCalledWith('test', getCellMeta(0, 0), 'setSourceDataAtCell');
    });

    it('should nullify the value if the validator returns false and allowInvalid is false (table initialization)', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        sourceDataValidator(value, cellMeta) {
          if (cellMeta.row === 1 && cellMeta.col === 1) {
            return false;
          }

          return true;
        },
        allowInvalid: false,
      });

      expect(getSourceData()).toEqual([
        ['A1', 'B1', 'C1'],
        ['A2', null, 'C2'],
        ['A3', 'B3', 'C3']
      ]);
    });

    it('should nullify the value if the validator returns false and allowInvalid is false (`loadData`)', async() => {
      handsontable({
        data: [[]],
        sourceDataValidator(value, cellMeta) {
          if (cellMeta.row === 1 && cellMeta.col === 1) {
            return false;
          }

          return true;
        },
        allowInvalid: false,
      });

      await loadData(createSpreadsheetData(3, 3));

      expect(getSourceData()).toEqual([
        ['A1', 'B1', 'C1'],
        ['A2', null, 'C2'],
        ['A3', 'B3', 'C3']
      ]);
    });

    it('should nullify the value if the validator returns false and allowInvalid is false (`updateData`)', async() => {
      handsontable({
        data: [[]],
        sourceDataValidator(value, cellMeta) {
          if (cellMeta.row === 1 && cellMeta.col === 1) {
            return false;
          }

          return true;
        },
        allowInvalid: false,
      });

      await loadData(createSpreadsheetData(3, 3));

      expect(getSourceData()).toEqual([
        ['A1', 'B1', 'C1'],
        ['A2', null, 'C2'],
        ['A3', 'B3', 'C3']
      ]);
    });

    it('should not nullify the value if the validator returns false and allowInvalid is false (`setSourceDataAtCell`)', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        sourceDataValidator(value) {
          if (value === 'test') {
            return false;
          }

          return true;
        },
        allowInvalid: false,
      });

      await setSourceDataAtCell(1, 1, 'test');

      expect(getSourceData()).toEqual([
        ['A1', 'B1', 'C1'],
        ['A2', 'B2', 'C2'],
        ['A3', 'B3', 'C3']
      ]);
    });

    it('should validate and nullify invalid source values for a fully `date`-typed table (allowInvalid: false)', async() => {
      handsontable({
        data: [['2024-01-01'], ['not-a-date'], ['2024-03-15']],
        columns: [{ type: 'date', dateFormat: 'YYYY-MM-DD' }],
        allowInvalid: false,
      });

      // The built-in date source validator runs for every row even though only one column meta is
      // materialized (batched validation), so invalid source values are still blanked.
      expect(getSourceData()).toEqual([
        ['2024-01-01'],
        [null],
        ['2024-03-15'],
      ]);
    });

    it('should validate and nullify invalid source values for a fully `time`-typed table (allowInvalid: false)', async() => {
      handsontable({
        data: [['12:30'], ['25:99'], ['08:00']],
        columns: [{ type: 'time', timeFormat: 'HH:mm' }],
        allowInvalid: false,
      });

      expect(getSourceData()).toEqual([
        ['12:30'],
        [null],
        ['08:00'],
      ]);
    });

    it('should not validate or nullify source values of trimmed rows in the batched path (allowInvalid: false)', async() => {
      handsontable({
        data: [['2024-01-01'], ['not-a-date'], ['also-bad'], ['2024-03-15']],
        columns: [{ type: 'date', dateFormat: 'YYYY-MM-DD' }],
        // Physical row 1 is trimmed; row 0 stays visible so the batched (column-reuse) path is used.
        trimRows: [1],
        allowInvalid: false,
      });

      // The invalid value in the trimmed row 1 must survive untouched, while the invalid value in the
      // visible row 2 is still blanked.
      expect(getSourceData()).toEqual([
        ['2024-01-01'],
        ['not-a-date'],
        [null],
        ['2024-03-15'],
      ]);
    });

    it('should NOT apply per-row `allowInvalid` set via `beforeGetCellMeta` (hook not run during validation)', async() => {
      handsontable({
        data: [['2024-01-01'], ['bad'], ['also-bad']],
        columns: [{ type: 'date', dateFormat: 'YYYY-MM-DD' }],
        allowInvalid: false,
        beforeGetCellMeta(row, col, cellMeta) {
          if (row === 1) {
            cellMeta.allowInvalid = true;
          }
        },
      });

      // Source-data validation resolves meta uncached and never runs `beforeGetCellMeta`, so the
      // hook's per-row `allowInvalid` is ignored: both invalid rows keep the global allowInvalid:false
      // and are blanked.
      expect(getSourceData()).toEqual([
        ['2024-01-01'],
        [null],
        [null],
      ]);
    });

    it('should NOT apply a `sourceDataValidator` returned from a `cells` function', async() => {
      const cellsValidator = jasmine.createSpy('cellsValidator').and.returnValue(false);

      handsontable({
        data: createSpreadsheetData(3, 3),
        allowInvalid: false,
        cells() {
          return { sourceDataValidator: cellsValidator, sourceDataWarningMessage: 'invalid' };
        },
      });

      // The validator is injected only through `cells`, which uncached resolution ignores — so it is
      // never called and no value is blanked.
      expect(cellsValidator).not.toHaveBeenCalled();
      expect(getSourceData()).toEqual([
        ['A1', 'B1', 'C1'],
        ['A2', 'B2', 'C2'],
        ['A3', 'B3', 'C3'],
      ]);
    });

    it('should not run any validation on load when a `cells` function is set but no validator is defined', async() => {
      const cells = jasmine.createSpy('cells').and.returnValue({ className: 'x' });

      handsontable({
        data: createSpreadsheetData(5, 5),
        cells,
      });

      // The presence of a `cells` function must not trigger source-data validation. Nothing is
      // blanked and the data is untouched.
      expect(getSourceData()).toEqual(createSpreadsheetData(5, 5));
    });

    it('should still validate a `date`-typed column when a `cells` function is also configured', async() => {
      handsontable({
        data: [['2024-01-01'], ['not-a-date'], ['2024-03-15']],
        columns: [{ type: 'date', dateFormat: 'YYYY-MM-DD' }],
        allowInvalid: false,
        cells() {
          return { className: 'x' };
        },
      });

      // The column-level (declarative) date validator still runs through the batched path even though
      // a `cells` function is present, so the invalid source value is blanked.
      expect(getSourceData()).toEqual([
        ['2024-01-01'],
        [null],
        ['2024-03-15'],
      ]);
    });

    it('should respect per-row `allowInvalid` set imperatively via `setCellMeta` after `updateData`', async() => {
      handsontable({
        data: [['2024-01-01'], ['2024-02-02'], ['2024-03-03']],
        columns: [{ type: 'date', dateFormat: 'YYYY-MM-DD' }],
        allowInvalid: true,
      });

      // `setCellMeta` survives `updateData` (it keeps cell states), so row 2 keeps allowInvalid:false.
      await setCellMeta(2, 0, 'allowInvalid', false);
      await updateData([['2024-01-01'], ['bad'], ['also-bad']]);

      // Row 2 (allowInvalid:false) is blanked; row 1 keeps the global allowInvalid:true and survives.
      expect(getSourceData()).toEqual([
        ['2024-01-01'],
        ['bad'],
        [null],
      ]);
    });
  });
});
