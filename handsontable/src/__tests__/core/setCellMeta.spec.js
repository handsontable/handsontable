describe('Core.setCellMeta', () => {
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

  it('should set correct meta className for cell', async() => {

    const className = 'htCenter htMiddle';

    handsontable({
      afterCellMetaReset() {
        this.setCellMeta(0, 0, 'className', className);
      }
    });

    const cellMeta = getCellMeta(0, 0);

    expect(cellMeta.className).not.toBeUndefined();
    expect(cellMeta.className).toEqual(className);
  });

  it('should set proper cell meta when indexes was modified', async() => {
    handsontable({
      minRows: 5,
      minCols: 5
    });

    rowIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);
    columnIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);

    await setCellMeta(0, 1, 'key', 'value');

    expect(getCellMeta(0, 1).key).toEqual('value');
  });

  it('should set correct meta className for non existed cell', async() => {
    const className = 'htCenter htMiddle';

    handsontable({
      data: createSpreadsheetData(5, 5),
      afterCellMetaReset() {
        this.setCellMeta(100, 100, 'className', className);
      }
    });

    const cellMeta = getCellMeta(100, 100);

    expect(cellMeta.className).not.toBeUndefined();
    expect(cellMeta.className).toEqual(className);
  });

  it('should set correct meta classNames for cells using cell in configuration', async() => {
    const classNames = [
      'htCenter htTop',
      'htRight htBottom'
    ];

    handsontable({
      cell: [
        { row: 0, col: 0, className: classNames[0] },
        { row: 1, col: 1, className: classNames[1] }
      ]
    });

    expect(spec().$container.find('tbody tr:eq(0) td:eq(0)')[0].className).toEqual(classNames[0]);
    expect(spec().$container.find('tbody tr:eq(1) td:eq(1)')[0].className).toEqual(classNames[1]);
  });

  it('should change cell meta data with updateSettings when the cell option is defined', async() => {
    const classNames = [
      'htCenter htTop',
      'htRight htBottom'
    ];

    handsontable({
      cell: [
        { row: 0, col: 0, className: classNames[0] },
        { row: 1, col: 1, className: classNames[1] }
      ]
    });

    expect(spec().$container.find('tbody tr:eq(0) td:eq(0)')[0].className).toEqual(classNames[0]);
    expect(spec().$container.find('tbody tr:eq(1) td:eq(1)')[0].className).toEqual(classNames[1]);

    await updateSettings({
      cell: []
    });

    expect(spec().$container.find('tbody tr:eq(0) td:eq(0)')[0].className).toEqual('');
    expect(spec().$container.find('tbody tr:eq(1) td:eq(1)')[0].className).toEqual('');

    await updateSettings({
      cell: [
        { row: 0, col: 0, className: classNames[1] },
        { row: 1, col: 1, className: classNames[0] }
      ]
    });

    expect(spec().$container.find('tbody tr:eq(0) td:eq(0)')[0].className).toEqual(classNames[1]);
    expect(spec().$container.find('tbody tr:eq(1) td:eq(1)')[0].className).toEqual(classNames[0]);
  });

  it('should call `beforeSetCellMeta` and `afterSetCellMeta` plugin hook with visual indexes as parameters', async() => {
    const className = 'htCenter htMiddle';
    const beforeSetCellMeta = jasmine.createSpy('beforeSetCellMeta');
    const afterSetCellMeta = jasmine.createSpy('afterSetCellMeta');

    handsontable({
      minRows: 5,
      minCols: 5,
      beforeSetCellMeta,
      afterSetCellMeta
    });

    rowIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);
    columnIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);

    setCellMeta(0, 1, 'className', className);

    expect(beforeSetCellMeta).toHaveBeenCalledWith(0, 1, 'className', className);
    expect(afterSetCellMeta).toHaveBeenCalledWith(0, 1, 'className', className);
  });

  it('should NOT call the `afterSetCellMeta` hook, if the `beforeSetCellMeta` returned false', async() => {
    const className = 'htCenter htMiddle';
    const afterSetCellMeta = jasmine.createSpy('afterSetCellMeta');

    handsontable({
      minRows: 5,
      minCols: 5,
      beforeSetCellMeta: () => false,
      afterSetCellMeta
    });

    rowIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);
    columnIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);

    setCellMeta(0, 1, 'className', className);

    expect(afterSetCellMeta).not.toHaveBeenCalled();
  });

  it('should extend the the meta object with `type` setting', async() => {
    const { getCellType } = Handsontable.cellTypes;

    handsontable();

    expect(getCellMeta(0, 0).type).toBe('text');
    expect(getCellMeta(0, 0).renderer).toBe(getCellType('text').renderer);
    expect(getCellMeta(0, 0).editor).toBe(getCellType('text').editor);

    await setCellMeta(0, 0, 'type', 'autocomplete');
    await render();

    expect(getCellMeta(0, 0).type).toBe(getCellType('autocomplete').CELL_TYPE);
    expect(getCellMeta(0, 0).renderer).toBe(getCellType('autocomplete').renderer);
    expect(getCellMeta(0, 0).editor).toBe(getCellType('autocomplete').editor);

    await setCellMeta(0, 0, 'type', 'password');
    await render();

    expect(getCellMeta(0, 0).type).toBe(getCellType('password').CELL_TYPE);
    expect(getCellMeta(0, 0).renderer).toBe(getCellType('password').renderer);
    expect(getCellMeta(0, 0).editor).toBe(getCellType('password').editor);

    await setCellMeta(0, 0, 'type', 'numeric');
    await render();

    expect(getCellMeta(0, 0).type).toBe(getCellType('numeric').CELL_TYPE);
    expect(getCellMeta(0, 0).renderer).toBe(getCellType('numeric').renderer);
    expect(getCellMeta(0, 0).editor).toBe(getCellType('numeric').editor);
  });

  it('should not overwrite the manually defined `renderer` and `editor` props by setting a `type` meta prop', async() => {
    const mockRenderer = () => {};
    const mockEditor = () => {};
    const { getCellType } = Handsontable.cellTypes;

    handsontable();

    expect(getCellMeta(0, 0).type).toBe('text');
    expect(getCellMeta(0, 0).renderer).toBe(getCellType('text').renderer);
    expect(getCellMeta(0, 0).editor).toBe(getCellType('text').editor);

    await setCellMeta(0, 0, 'renderer', mockRenderer);
    await setCellMeta(0, 0, 'type', 'autocomplete');
    await render();

    expect(getCellMeta(0, 0).type).toBe(getCellType('autocomplete').CELL_TYPE);
    expect(getCellMeta(0, 0).renderer).toBe(mockRenderer);
    expect(getCellMeta(0, 0).editor).toBe(getCellType('autocomplete').editor);

    await setCellMeta(0, 0, 'editor', mockEditor);
    await setCellMeta(0, 0, 'type', 'password');
    await render();

    expect(getCellMeta(0, 0).type).toBe(getCellType('password').CELL_TYPE);
    expect(getCellMeta(0, 0).renderer).toBe(mockRenderer);
    expect(getCellMeta(0, 0).editor).toBe(mockEditor);
  });

  describe('preserving imperative cell meta across updateSettings (#4446)', () => {
    it('should preserve a `setCellMeta` value after `updateSettings` with the `columns` option', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      await setCellMeta(0, 0, 'readOnly', true);

      expect(getCellMeta(0, 0).readOnly).toBe(true);

      await updateSettings({
        columns: [{}, {}, {}, {}, {}],
      });

      expect(getCellMeta(0, 0).readOnly).toBe(true);
    });

    it('should preserve a `setCellMeta` value after `updateSettings` with the `cells` option', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      await setCellMeta(0, 0, 'readOnly', true);

      await updateSettings({
        cells() {
          return {};
        },
      });

      expect(getCellMeta(0, 0).readOnly).toBe(true);
    });

    it('should preserve a `setCellMeta` value after `updateSettings` with the `cell` option for other cells', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      await setCellMeta(0, 0, 'readOnly', true);

      await updateSettings({
        cell: [
          { row: 1, col: 1, className: 'htRight' },
        ],
      });

      expect(getCellMeta(0, 0).readOnly).toBe(true);
      expect(getCellMeta(1, 1).className).toBe('htRight');
    });

    it('should let the declarative `cell` option win over a preserved imperative value on a direct conflict', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      await setCellMeta(0, 0, 'className', 'from-set-cell-meta');

      await updateSettings({
        cell: [
          { row: 0, col: 0, className: 'from-cell-option' },
        ],
      });

      expect(getCellMeta(0, 0).className).toBe('from-cell-option');
    });

    it('should preserve a `setCellMeta` value across multiple consecutive `updateSettings` calls', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      await setCellMeta(0, 0, 'readOnly', true);

      await updateSettings({ columns: [{}, {}, {}, {}, {}] });
      await updateSettings({ columns: [{}, {}, {}, {}, {}] });

      expect(getCellMeta(0, 0).readOnly).toBe(true);
    });

    it('should preserve a `setCellMeta` value at its shifted position after inserting a row and then calling `updateSettings`', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      await setCellMeta(2, 0, 'readOnly', true);
      await alter('insert_row_above', 0, 1);

      expect(getCellMeta(3, 0).readOnly).toBe(true);

      await updateSettings({ columns: [{}, {}, {}, {}, {}] });

      expect(getCellMeta(3, 0).readOnly).toBe(true);
    });

    it('should still fire the `afterCellMetaReset` hook on `updateSettings`', async() => {
      const afterCellMetaReset = jasmine.createSpy('afterCellMetaReset');

      handsontable({
        data: createSpreadsheetData(5, 5),
        afterCellMetaReset,
      });

      afterCellMetaReset.calls.reset();

      await updateSettings({ columns: [{}, {}, {}, {}, {}] });

      expect(afterCellMetaReset).toHaveBeenCalled();
    });
  });

  describe('preserving failed validation results across updateSettings (#7553)', () => {
    // The validation flow writes `valid` straight onto the cell meta, so the #4446 snapshot above
    // cannot see it. Without a dedicated snapshot, an `updateSettings` call that merely re-states
    // `cells`, `cell` or `columns` drops the invalid-cell highlight while the cell keeps the bad
    // value.
    const settingsWithFailingValidator = {
      data: createSpreadsheetData(5, 5),
      validator(value, callback) {
        callback(value !== 'nope');
      },
    };

    const markCellInvalid = async(row = 0, column = 0) => {
      await setDataAtCell(row, column, 'nope');
      await waitForNextAnimationFrames(7); // wait for async validation
    };

    it('should keep the invalid mark after `updateSettings` with the `cells` option', async() => {
      handsontable({ ...settingsWithFailingValidator });

      await markCellInvalid();

      expect(getCellMeta(0, 0).valid).toBe(false);

      await updateSettings({
        cells() {
          return {};
        },
      });

      expect(getCellMeta(0, 0).valid).toBe(false);
      expect(getCell(0, 0).classList.contains('htInvalid')).toBe(true);
    });

    it('should keep the invalid mark after `updateSettings` with the `cell` option', async() => {
      handsontable({ ...settingsWithFailingValidator });

      await markCellInvalid();

      await updateSettings({ cell: [] });

      expect(getCellMeta(0, 0).valid).toBe(false);
      expect(getCell(0, 0).classList.contains('htInvalid')).toBe(true);
    });

    it('should keep the invalid mark after `updateSettings` with the `columns` option', async() => {
      handsontable({ ...settingsWithFailingValidator });

      await markCellInvalid();

      await updateSettings({ columns: [{}, {}, {}, {}, {}] });

      expect(getCellMeta(0, 0).valid).toBe(false);
      expect(getCell(0, 0).classList.contains('htInvalid')).toBe(true);
    });

    it('should not mark any other cell as invalid', async() => {
      handsontable({ ...settingsWithFailingValidator });

      await markCellInvalid();

      await updateSettings({ columns: [{}, {}, {}, {}, {}] });

      expect(spec().$container.find('td.htInvalid').length).toBe(1);
      expect(getCellMeta(0, 1).valid).toBeUndefined();
      expect(getCellMeta(1, 0).valid).toBeUndefined();
    });

    it('should keep the invalid mark across multiple consecutive `updateSettings` calls', async() => {
      handsontable({ ...settingsWithFailingValidator });

      await markCellInvalid();

      await updateSettings({ columns: [{}, {}, {}, {}, {}] });
      await updateSettings({ columns: [{}, {}, {}, {}, {}] });

      expect(getCellMeta(0, 0).valid).toBe(false);
      expect(getCell(0, 0).classList.contains('htInvalid')).toBe(true);
    });

    it('should keep the invalid mark at its shifted position after inserting a row', async() => {
      handsontable({ ...settingsWithFailingValidator });

      await markCellInvalid();
      await alter('insert_row_above', 0, 1);

      await updateSettings({ columns: [{}, {}, {}, {}, {}] });

      // The row above the inserted one must not inherit the mark - the snapshot stores physical
      // coordinates, so the flag has to travel with the cell rather than stay at row 0.
      expect(getCellMeta(1, 0).valid).toBe(false);
      expect(getCellMeta(0, 0).valid).toBeUndefined();
    });

    it('should treat a mark in a column the update removes the same way as a `setCellMeta` value', async() => {
      // Narrowing `columns` puts the flagged cell out of range. The restore keeps it, exactly as the
      // #4446 replay keeps an imperative value there - same materialized meta count, and both come
      // back when the columns grow again. Asserted side by side so the two paths cannot drift.
      handsontable({ ...settingsWithFailingValidator });

      await markCellInvalid(0, 4);
      await setCellMeta(0, 4, 'className', 'marker');

      await updateSettings({ columns: [{}, {}, {}] });

      expect(countCols()).toBe(3);

      await updateSettings({ columns: [{}, {}, {}, {}, {}] });

      expect(getCellMeta(0, 4).valid).toBe(false);
      expect(getCellMeta(0, 4).className).toBe('marker');
    });

    it('should drop the mark once the cell validates again', async() => {
      handsontable({ ...settingsWithFailingValidator });

      await markCellInvalid();

      await updateSettings({ columns: [{}, {}, {}, {}, {}] });

      await setDataAtCell(0, 0, 'fine');
      await waitForNextAnimationFrames(7); // wait for async validation

      expect(getCellMeta(0, 0).valid).toBe(true);
      expect(getCell(0, 0).classList.contains('htInvalid')).toBe(false);

      // A restored value must not be replayed on the next cache clear - the preserved `valid` is a
      // direct meta write, never a user-defined property. The cache clear re-mints the cell, so the
      // flag reads back as `undefined` rather than `true`; asserting that exactly would also catch a
      // change that started preserving passing results.
      await updateSettings({ columns: [{}, {}, {}, {}, {}] });

      expect(getCellMeta(0, 0).valid).toBeUndefined();
      expect(getCell(0, 0).classList.contains('htInvalid')).toBe(false);
    });

    it('should keep the mark when an async validator resolves after the cache was cleared', async() => {
      // The stored meta object is handed to `validateCell` by reference. An `updateSettings` landing
      // while the validator is still in flight detaches it, so the result has to be written through
      // the re-resolved meta or the mark never appears.
      // The validator hands its callback to the test instead of resolving on a timer, so the
      // ordering is exact: the cache clear provably happens while validation is still pending.
      let resolveValidation;

      handsontable({
        data: createSpreadsheetData(5, 5),
        validator(value, callback) {
          resolveValidation = () => callback(value !== 'nope');
        },
      });

      await setDataAtCell(0, 0, 'nope');

      await updateSettings({ columns: [{}, {}, {}, {}, {}] });

      resolveValidation();

      await waitForNextAnimationFrames(7); // wait for async validation

      expect(getCellMeta(0, 0).valid).toBe(false);
      expect(getCell(0, 0).classList.contains('htInvalid')).toBe(true);
    });

    it('should clear the mark when an async correction resolves after the cache was cleared', async() => {
      // The cell is already invalid, so the cache clear re-applies `valid === false` to the fresh
      // meta. The passing result then has to reach that same object, or a corrected value keeps its
      // red mark forever.
      let resolveValidation;

      handsontable({
        data: createSpreadsheetData(5, 5),
        validator(value, callback) {
          resolveValidation = () => callback(value !== 'nope');
        },
      });

      await setDataAtCell(0, 0, 'nope');
      resolveValidation();
      await waitForNextAnimationFrames(7); // wait for async validation

      expect(getCellMeta(0, 0).valid).toBe(false);

      await setDataAtCell(0, 0, 42);
      await updateSettings({ columns: [{}, {}, {}, {}, {}] });

      resolveValidation();

      await waitForNextAnimationFrames(7); // wait for async validation

      expect(getDataAtCell(0, 0)).toBe(42);
      expect(getCellMeta(0, 0).valid).toBe(true);
      expect(getCell(0, 0).classList.contains('htInvalid')).toBe(false);
    });

    it('should not mark a rejected `allowInvalid: false` edit when the cache was cleared mid-flight', async() => {
      // The change is cancelled, so the cell keeps its previous - valid - value. The cancel path
      // writes `valid = true` on the object the validator was handed, which the clear detached.
      let resolveValidation;

      handsontable({
        data: createSpreadsheetData(5, 5),
        allowInvalid: false,
        validator(value, callback) {
          resolveValidation = () => callback(value !== 'nope');
        },
      });

      const originalValue = getDataAtCell(0, 0);

      await setDataAtCell(0, 0, 'nope');
      await updateSettings({ columns: [{}, {}, {}, {}, {}] });

      resolveValidation();

      await waitForNextAnimationFrames(7); // wait for async validation

      expect(getDataAtCell(0, 0)).toBe(originalValue);
      expect(getCellMeta(0, 0).valid).not.toBe(false);
      expect(getCell(0, 0).classList.contains('htInvalid')).toBe(false);
    });

    it('should ignore a `valid` flag inherited from the column or grid layer', async() => {
      // `valid` is an ordinary meta key, so it can be declared above the cell layer. Reading it
      // through the prototype chain would report every materialized cell as invalid and stamp the
      // flag on as an own property, which then outlives the setting that produced it.
      handsontable({
        data: createSpreadsheetData(5, 5),
        columns: [{ valid: false }, {}, {}, {}, {}],
      });

      await updateSettings({ columns: [{ valid: false }, {}, {}, {}, {}] });
      await updateSettings({ columns: [{}, {}, {}, {}, {}] });

      expect(getCellMeta(0, 0).valid).toBeUndefined();
      expect(getCell(0, 0).classList.contains('htInvalid')).toBe(false);
      expect(spec().$container.find('td.htInvalid').length).toBe(0);
    });
  });
});
