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
      expect(sourceDataValidator).toHaveBeenCalledWith('E5', getCellMeta(4, 4), 'init');
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
      expect(sourceDataValidator).toHaveBeenCalledWith('E5', getCellMeta(4, 4), 'loadData');
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
      expect(sourceDataValidator).toHaveBeenCalledWith('E5', getCellMeta(4, 4), 'updateData');
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

    it('should respect per-row `allowInvalid` set via `beforeGetCellMeta` (otherwise allowInvalid: false)', async() => {
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

      // Row 1 gets allowInvalid:true from the hook, so its invalid value survives; row 2 keeps the
      // global allowInvalid:false and is blanked. Row 0's meta must not be reused for the whole column.
      expect(getSourceData()).toEqual([
        ['2024-01-01'],
        ['bad'],
        [null],
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
