describe('TrimRows', () => {
  const id = 'testContainer';

  /**
   * @param rows
   * @param cols
   */
  function getMultilineData(rows, cols) {
    const data = createSpreadsheetData(rows, cols);

    // Column C
    data[0][2] += '\nline';
    data[1][2] += '\nline\nline';

    return data;
  }

  const dataWithoutEmptyCells = [
    ['A1', 'B1', 'C1'],
    ['A2', 'B2', 'C2'],
    ['A3', 'B3', 'C3'],
  ];

  const dataWithEmptyRow = [
    ['A1', 'B1', 'C1'],
    ['A2', 'B2', 'C2'],
    [null, null, null],
  ];

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should trim rows defined in `trimRows` property', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      trimRows: [2, 6, 7],
      cells(row) {
        const meta = {};

        if (row === 2) {
          meta.type = 'date';
        }

        return meta;
      },
      width: 500,
      height: 300
    });

    expect(getDataAtCell(0, 0)).toBe('A1');
    expect(getDataAtCell(1, 0)).toBe('A2');
    expect(getDataAtCell(2, 0)).toBe('A4');
    expect(getDataAtCell(3, 0)).toBe('A5');
    expect(getDataAtCell(4, 0)).toBe('A6');
    expect(getDataAtCell(5, 0)).toBe('A9');
    expect(getDataAtCell(6, 0)).toBe('A10');
    expect(getCellMeta(0, 0).type).toBe('text');
    expect(getCellMeta(1, 0).type).toBe('text');
    expect(getCellMeta(2, 0).type).toBe('text');
    expect(getCellMeta(3, 0).type).toBe('text');
    expect(getCellMeta(4, 0).type).toBe('text');
    expect(getCellMeta(5, 0).type).toBe('text');
    expect(getCellMeta(6, 0).type).toBe('text');
  });

  it('should not add more source rows than defined in maxRows when trimming rows using the TrimRows plugin', async() => {
    handsontable({
      data: createSpreadsheetData(10, 4),
      trimRows: [8, 9],
      maxRows: 10
    });

    expect(countRows()).toEqual(8);

    await populateFromArray(7, 0, [['a'], ['b'], ['c']]);

    expect(countSourceRows()).toEqual(10);
    expect(getDataAtCell(7, 0)).toEqual('a');
  });

  it('should trim rows after re-load data calling loadData method', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      trimRows: [0, 2],
      width: 500,
      height: 300
    });

    await loadData(createSpreadsheetData(5, 5));

    expect(getDataAtCell(0, 0)).toBe('A2');
    expect(getDataAtCell(1, 0)).toBe('A4');
    expect(getDataAtCell(2, 0)).toBe('A5');
    expect(getDataAtCell(3, 0)).toBe(null);
    expect(getDataAtCell(4, 0)).toBe(null);
  });

  it('should return to default state after call disablePlugin method', async() => {
    handsontable({
      data: getMultilineData(10, 10),
      trimRows: [2, 6, 7],
      width: 500,
      height: 300
    });

    getPlugin('trimRows').disablePlugin();
    await render();

    expect(getDataAtCell(0, 0)).toBe('A1');
    expect(getDataAtCell(1, 0)).toBe('A2');
    expect(getDataAtCell(2, 0)).toBe('A3');
    expect(getDataAtCell(3, 0)).toBe('A4');
    expect(getDataAtCell(4, 0)).toBe('A5');
    expect(getDataAtCell(5, 0)).toBe('A6');
    expect(getDataAtCell(6, 0)).toBe('A7');
  });

  it('should trim rows after call enablePlugin method', async() => {
    handsontable({
      data: getMultilineData(10, 10),
      trimRows: [2, 6, 7],
      width: 500,
      height: 300
    });

    getPlugin('hiddenRows').disablePlugin();
    getPlugin('hiddenRows').enablePlugin();
    await render();

    expect(getDataAtCell(0, 0)).toBe('A1');
    expect(getDataAtCell(1, 0)).toBe('A2');
    expect(getDataAtCell(2, 0)).toBe('A4');
    expect(getDataAtCell(3, 0)).toBe('A5');
    expect(getDataAtCell(4, 0)).toBe('A6');
    expect(getDataAtCell(5, 0)).toBe('A9');
    expect(getDataAtCell(6, 0)).toBe('A10');
  });

  it('should trim row after call trimRow method', async() => {
    handsontable({
      data: getMultilineData(5, 10),
      trimRows: true,
      width: 500,
      height: 300
    });

    expect(getDataAtCell(1, 0)).toBe('A2');

    getPlugin('trimRows').trimRow(1);
    await render();

    expect(getDataAtCell(1, 0)).toBe('A3');
  });

  it('should untrim row after call untrimRow method', async() => {
    handsontable({
      data: getMultilineData(5, 10),
      trimRows: [1],
      width: 500,
      height: 300
    });

    expect(getDataAtCell(1, 0)).toBe('A3');

    getPlugin('trimRows').untrimRow(1);
    await render();

    expect(getDataAtCell(1, 0)).toBe('A2');
  });

  it('should trim big data set', async() => {
    handsontable({
      data: createSpreadsheetData(1000, 5),
      // leave first row and last 3 rows
      trimRows: Array(...Array(996)).map((v, i) => i + 1),
      width: 500,
      height: 300
    });

    expect(getDataAtCell(0, 0)).toBe('A1');
    expect(getDataAtCell(1, 0)).toBe('A998');
    expect(getDataAtCell(2, 0)).toBe('A999');
    expect(getDataAtCell(3, 0)).toBe('A1000');
    expect(getDataAtCell(4, 0)).toBe(null);
  });

  it('should remove correct rows', async() => {
    handsontable({
      data: getMultilineData(5, 10),
      trimRows: [1],
      width: 500,
      height: 300
    });

    await alter('remove_row', 0, 2);

    expect(getDataAtCell(0, 0)).toBe('A4');
    expect(getDataAtCell(1, 0)).toBe('A5');
    expect(getDataAtCell(2, 0)).toBe(null);
  });

  it('should remove correct rows after inserting new ones', async() => {
    handsontable({
      data: getMultilineData(6, 10),
      trimRows: [1, 4],
      width: 500,
      height: 300
    });

    await alter('insert_row_above', 1);
    await alter('insert_row_above', 3);
    await alter('remove_row', 0, 3);

    expect(getDataAtCell(0, 0)).toBe(null);
    expect(getDataAtCell(1, 0)).toBe('A4');
    expect(getDataAtCell(2, 0)).toBe('A6');
    expect(getDataAtCell(3, 0)).toBe(null);
  });

  it('should trim proper row when moved one using the `ManualRowMove` plugin #1', async() => {
    handsontable({
      data: createSpreadsheetData(10, 1),
      trimRows: true,
      manualRowMove: [7]
    });

    getPlugin('trimRows').trimRow(0);

    expect(getDataAtCol(0)).toEqual(['A8', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A9', 'A10']);
  });

  it('should trim proper row when moved one using the `ManualRowMove` plugin #2', async() => {
    handsontable({
      data: createSpreadsheetData(10, 1),
      trimRows: true,
      manualRowMove: [9]
    });

    getPlugin('trimRows').trimRow(0);

    expect(getDataAtCol(0)).toEqual(['A10', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9']);
  });

  it('should update trimmed row indexes after rows removal', async() => {
    handsontable({
      data: createSpreadsheetData(10, 1),
      trimRows: true,
      manualRowMove: [4, 0, 8, 5, 2, 6, 1, 7, 3, 9]
    });

    const plugin = getPlugin('trimRows');

    plugin.trimRows([1, 7, 3]); // physical row indexes after move
    await alter('remove_row', 2, 3); // visual row indexes

    expect(plugin.isTrimmed(1)).toBeTruthy();
    expect(plugin.isTrimmed(5)).toBeTruthy(); // 7 -> 5
    expect(plugin.isTrimmed(2)).toBeTruthy(); // 3 -> 2

    expect(plugin.isTrimmed(7)).toBeFalsy();
    expect(plugin.isTrimmed(3)).toBeFalsy();
  });

  it('should update trimmed row indexes after insertion', async() => {
    handsontable({
      data: createSpreadsheetData(10, 1),
      trimRows: true,
      manualRowMove: [4, 0, 8, 5, 2, 6, 1, 7, 3, 9]
    });

    const plugin = getPlugin('trimRows');

    plugin.trimRows([1, 7, 3]); // physical row indexes after move
    await alter('insert_row_above', 0, 3); // visual row indexes

    expect(plugin.isTrimmed(1)).toBeTruthy();
    expect(plugin.isTrimmed(3)).toBeTruthy();

    expect(plugin.isTrimmed(7)).toBeFalsy();
    expect(plugin.isTrimmed(10)).toBeTruthy(); // 7 -> 10
  });

  it('should clear cache after loading new data by `loadData` function, when plugin `trimRows` is enabled #92', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      trimRows: true
    });

    await loadData(createSpreadsheetData(10, 10));
    await sleep(100);

    expect(spec().$container.find('td').length).toEqual(100);
  });

  describe('plugin hooks', () => {
    it('should not affect `afterValidate` hook #11', async() => {
      handsontable({
        data: createSpreadsheetData(5, 2),
        trimRows: true,
        cells() {
          return { type: 'numeric' };
        }
      });

      await populateFromArray(5, 1, [
        ['A1', 'A2'],
        ['B1', 'B2'],
        ['C1', 'C2'],
        ['D1', 'D2'],
        ['E1', 'E2'],
      ]);

      await sleep(150);
      const $addedCell = $(getCell(5, 1));

      expect($addedCell.hasClass('htInvalid')).toEqual(true);
    });

    describe('beforeTrimRow', () => {
      it('should fire the `beforeTrimRow` hook before trimming a single row by plugin API', async() => {
        const beforeTrimRowHookCallback = jasmine.createSpy('beforeTrimRowHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          trimRows: [0],
          beforeTrimRow: beforeTrimRowHookCallback
        });

        getPlugin('trimRows').trimRow(2);

        expect(beforeTrimRowHookCallback).toHaveBeenCalledWith([0], [0, 2], true);
      });

      it('should fire the `beforeTrimRow` hook before hiding multiple rows by plugin API', async() => {
        const beforeTrimRowHookCallback = jasmine.createSpy('beforeTrimRowHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          trimRows: [0],
          beforeTrimRow: beforeTrimRowHookCallback
        });

        getPlugin('trimRows').trimRows([2, 3, 4]);

        expect(beforeTrimRowHookCallback).toHaveBeenCalledWith([0], [0, 2, 3, 4], true);
      });

      it('should be possible to cancel the trimming action by returning `false` from the `beforeTrimRow` hook', async() => {
        handsontable({
          data: createSpreadsheetData(10, 10),
          trimRows: true,
          beforeTrimRow: () => false
        });

        getPlugin('trimRows').trimRow(2);

        expect(getPlugin('trimRows').isTrimmed(2)).toBeFalsy();
      });

      it('should not perform trimming and return `false` as the third parameter of the `beforeTrimRow` hook' +
        ' if any of the provided rows is out of scope of the table', async() => {
        const beforeTrimRowHookCallback = jasmine.createSpy('beforeTrimRowHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          trimRows: true,
          beforeTrimRow: beforeTrimRowHookCallback
        });

        const plugin = getPlugin('trimRows');

        plugin.trimRows([0, 5, 10, 15]);

        expect(beforeTrimRowHookCallback).toHaveBeenCalledWith([], [], false);
        expect(plugin.isTrimmed(0)).toBeFalsy();
        expect(plugin.isTrimmed(5)).toBeFalsy();
        expect(plugin.isTrimmed(10)).toBeFalsy();
      });

      it('should not perform trimming and return `false` as the third parameter of the `beforeTrimRow` hook' +
        ' if any of the provided rows is not integer', async() => {
        const beforeTrimRowHookCallback = jasmine.createSpy('beforeTrimRowHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          trimRows: true,
          beforeTrimRow: beforeTrimRowHookCallback
        });

        const plugin = getPlugin('trimRows');

        plugin.trimRows([0, 5, 1.1]);

        expect(beforeTrimRowHookCallback).toHaveBeenCalledWith([], [], false);
        expect(plugin.isTrimmed(0)).toBeFalsy();
        expect(plugin.isTrimmed(5)).toBeFalsy();
      });
    });

    describe('afterTrimRow', () => {
      it('should fire the `afterTrimRow` hook after trimming a single row by plugin API', async() => {
        const afterTrimRowHookCallback = jasmine.createSpy('afterTrimRowHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          trimRows: true,
          afterTrimRow: afterTrimRowHookCallback
        });

        getPlugin('trimRows').trimRow(2);

        expect(afterTrimRowHookCallback).toHaveBeenCalledWith([], [2], true, true);
      });

      it('should fire the `afterTrimRow` hook after trimming multiple rows by plugin API', async() => {
        const afterTrimRowHookCallback = jasmine.createSpy('afterTrimRowHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          trimRows: true,
          afterTrimRow: afterTrimRowHookCallback
        });

        getPlugin('trimRows').trimRows([2, 3, 4]);

        expect(afterTrimRowHookCallback).toHaveBeenCalledWith([], [2, 3, 4], true, true);
      });

      it('it should NOT fire the `afterTrimRow` hook, if the `beforeTrimRow` hook returned false', async() => {
        const afterTrimRowHookCallback = jasmine.createSpy('afterTrimRowHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          trimRows: true,
          beforeTrimRow: () => false,
          afterTrimRow: afterTrimRowHookCallback
        });

        getPlugin('trimRows').trimRows([2, 3, 4]);

        expect(afterTrimRowHookCallback).not.toHaveBeenCalled();
      });

      it('should return `false` as the fourth parameter, if the trimming action did not change the state of the trimRows plugin', async() => {
        const afterTrimRowHookCallback = jasmine.createSpy('afterTrimRowHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          trimRows: [0, 5],
          afterTrimRow: afterTrimRowHookCallback
        });

        const plugin = getPlugin('trimRows');

        plugin.trimRows([0, 5]);

        expect(afterTrimRowHookCallback).toHaveBeenCalledWith([0, 5], [0, 5], true, false);
      });

      it('should return `true` as the third and fourth parameter, if the trimming action changed the state of the trimRows plugin', async() => {
        const afterTrimRowHookCallback = jasmine.createSpy('afterTrimRowHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          trimRows: [0, 5],
          afterTrimRow: afterTrimRowHookCallback
        });

        const plugin = getPlugin('trimRows');

        plugin.trimRows([0, 5, 6]);

        expect(afterTrimRowHookCallback).toHaveBeenCalledWith([0, 5], [0, 5, 6], true, true);
      });

      it('should not perform trimming and return `false` as the third and fourth parameter of the `afterTrimRow` hook' +
        ' if any of the provided rows is out of scope of the table', async() => {
        const afterTrimRowHookCallback = jasmine.createSpy('afterTrimRowHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          trimRows: true,
          afterTrimRow: afterTrimRowHookCallback
        });

        const plugin = getPlugin('trimRows');

        plugin.trimRows([0, 5, 10, 15]);

        expect(afterTrimRowHookCallback).toHaveBeenCalledWith([], [], false, false);
        expect(plugin.isTrimmed(0)).toBeFalsy();
        expect(plugin.isTrimmed(5)).toBeFalsy();
        expect(plugin.isTrimmed(10)).toBeFalsy();
      });

      it('should not perform trimming and return `false` as the third and fourth parameter of the `afterTrimRow` hook' +
        ' if any of the provided rows is not integer', async() => {
        const afterTrimRowHookCallback = jasmine.createSpy('afterTrimRowHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          trimRows: true,
          afterTrimRow: afterTrimRowHookCallback
        });

        const plugin = getPlugin('trimRows');

        plugin.trimRows([0, 5, 1.1]);

        expect(afterTrimRowHookCallback).toHaveBeenCalledWith([], [], false, false);
        expect(plugin.isTrimmed(0)).toBeFalsy();
        expect(plugin.isTrimmed(5)).toBeFalsy();
      });
    });

    describe('beforeUntrimRow', () => {
      it('should fire the `beforeUntrimRow` hook before untrimming a single, previously trimmed row', async() => {
        const beforeUntrimRowHookCallback = jasmine.createSpy('beforeUntrimRowHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          trimRows: [0, 2],
          beforeUntrimRow: beforeUntrimRowHookCallback
        });

        getPlugin('trimRows').untrimRow(2);

        expect(beforeUntrimRowHookCallback).toHaveBeenCalledWith([0, 2], [0], true);
      });

      it('should fire the `beforeUntrimRow` hook before untrimming the multiple, previously trimmed rows ', async() => {
        const beforeUntrimRowHookCallback = jasmine.createSpy('beforeUntrimRowHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          trimRows: [0, 2, 3, 4],
          beforeUntrimRow: beforeUntrimRowHookCallback
        });

        getPlugin('trimRows').untrimRows([2, 3, 4]);

        expect(beforeUntrimRowHookCallback).toHaveBeenCalledWith([0, 2, 3, 4], [0], true);
      });

      it('should be possible to cancel the untrimming action by returning `false` from the `beforeUntrimRow` hook', async() => {
        handsontable({
          data: createSpreadsheetData(10, 10),
          trimRows: [2, 3, 4],
          beforeUntrimRow: () => false
        });

        getPlugin('trimRows').untrimRow(2);

        expect(getPlugin('trimRows').isTrimmed(2)).toBeTruthy();
      });

      it('should not perform untrimming and return `false` as the third parameter of the `beforeUntrimRow` hook' +
        ' if any of the provided rows is out of scope of the table', async() => {
        const beforeUntrimRowHookCallback = jasmine.createSpy('beforeUntrimRowHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          trimRows: [0, 5],
          beforeUntrimRow: beforeUntrimRowHookCallback
        });

        const plugin = getPlugin('trimRows');

        plugin.untrimRows([0, 5, 10, 15]);

        expect(beforeUntrimRowHookCallback).toHaveBeenCalledWith([0, 5], [0, 5], false);
        expect(plugin.isTrimmed(0)).toBeTruthy();
        expect(plugin.isTrimmed(5)).toBeTruthy();
      });

      it('should not perform untrimming and return `false` as the third parameter of the `beforeUntrimRow` hook' +
        ' if any of the provided rows is out of scope of the table', async() => {
        const beforeUntrimRowHookCallback = jasmine.createSpy('beforeUntrimRowHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          trimRows: [0, 5],
          beforeUntrimRow: beforeUntrimRowHookCallback
        });

        const plugin = getPlugin('trimRows');

        plugin.untrimRows([0, 5, 10, 15]);

        expect(beforeUntrimRowHookCallback).toHaveBeenCalledWith([0, 5], [0, 5], false);
        expect(plugin.isTrimmed(0)).toBeTruthy();
        expect(plugin.isTrimmed(5)).toBeTruthy();
      });
    });

    describe('afterUntrimRow', () => {
      it('should fire the `afterUntrimRow` hook after untrimming a previously trimmed single row', async() => {
        const afterUntrimRowHookCallback = jasmine.createSpy('afterUntrimRowHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          trimRows: [2],
          afterUntrimRow: afterUntrimRowHookCallback
        });

        getPlugin('trimRows').untrimRow(2);

        expect(afterUntrimRowHookCallback).toHaveBeenCalledWith([2], [], true, true);
      });

      it('should fire the `afterUntrimRow` hook after untrimming a multiple, previously trimmed rows', async() => {
        const afterUntrimRowHookCallback = jasmine.createSpy('afterUntrimRowHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          trimRows: [2, 3, 4],
          afterUntrimRow: afterUntrimRowHookCallback
        });

        getPlugin('trimRows').untrimRows([2, 3, 4]);

        expect(afterUntrimRowHookCallback).toHaveBeenCalledWith([2, 3, 4], [], true, true);
      });

      it('it should NOT fire the `afterUntrimRow` hook, if the `beforeUntrimRow` hook returned false', async() => {
        const afterUntrimRowHookCallback = jasmine.createSpy('afterUntrimRowHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          trimRows: true,
          beforeUntrimRow: () => false,
          afterUntrimRow: afterUntrimRowHookCallback
        });

        getPlugin('trimRows').untrimRows([2, 3, 4]);

        expect(afterUntrimRowHookCallback).not.toHaveBeenCalled();
      });

      it('should return `false` as the fourth parameter, if the untrimming action did not change the state of the trimRows plugin', async() => {
        const afterUntrimRowHookCallback = jasmine.createSpy('afterUntrimRowHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          trimRows: true,
          afterUntrimRow: afterUntrimRowHookCallback
        });

        const plugin = getPlugin('trimRows');

        plugin.untrimRows([0, 5]);

        expect(afterUntrimRowHookCallback).toHaveBeenCalledWith([], [], true, false);
      });

      it('should return `true` as the fourth parameter, if the untrimming action changed the state of the trimRows plugin', async() => {
        const afterUntrimRowHookCallback = jasmine.createSpy('afterUntrimRowHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          trimRows: [0, 5],
          afterUntrimRow: afterUntrimRowHookCallback
        });

        const plugin = getPlugin('trimRows');

        plugin.untrimRows([0, 5, 6]);

        expect(afterUntrimRowHookCallback).toHaveBeenCalledWith([0, 5], [], true, true);
      });

      it('should not perform hiding and return `false` as the third and fourth parameter of the `afterUntrimRow` hook' +
        ' if any of the provided rows is not integer', async() => {
        const afterUntrimRowHookCallback = jasmine.createSpy('afterUntrimRowHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 7),
          trimRows: [0, 5],
          afterUntrimRow: afterUntrimRowHookCallback
        });

        const plugin = getPlugin('trimRows');

        plugin.untrimRows([0, 5, 1.1]);

        expect(afterUntrimRowHookCallback).toHaveBeenCalledWith([0, 5], [0, 5], false, false);
        expect(plugin.isTrimmed(0)).toBeTruthy();
        expect(plugin.isTrimmed(5)).toBeTruthy();
      });
    });

    it('should not override the `index` parameter of the `beforeCreateRow` hook', async() => {
      const onBeforeCreateRowCallback = jasmine.createSpy('beforeCreateRow');

      handsontable({
        data: createSpreadsheetData(3, 3),
        trimRows: true,
        beforeCreateRow: onBeforeCreateRowCallback
      });

      await alter('insert_row_above', 1);

      expect(onBeforeCreateRowCallback).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('copy-paste functionality', () => {
    it('should skip trimmed rows, while copying data', async() => {
      handsontable({
        data: getMultilineData(10, 10),
        trimRows: [1, 5, 6, 7, 8],
        width: 500,
        height: 300
      });

      const copyEvent = getClipboardEvent('copy');
      const plugin = getPlugin('CopyPaste');

      await selectCell(0, 0, 4, 9);

      plugin.setCopyableText();
      plugin.onCopy(copyEvent);

      /* eslint-disable no-tabs */
      expect(copyEvent.clipboardData.getData('text/plain')).toEqual('A1	B1	"C1\n' +
        'line"	D1	E1	F1	G1	H1	I1	J1\n' +
        'A3	B3	C3	D3	E3	F3	G3	H3	I3	J3\n' +
        'A4	B4	C4	D4	E4	F4	G4	H4	I4	J4\n' +
        'A5	B5	C5	D5	E5	F5	G5	H5	I5	J5\n' +
        'A10	B10	C10	D10	E10	F10	G10	H10	I10	J10'
      );
    });
  });

  describe('navigation', () => {
    it('should ignore trimmed rows while navigating by arrow keys', async() => {
      handsontable({
        data: getMultilineData(50, 10),
        trimRows: [1, 5, 6, 7, 8],
        width: 500,
        height: 300
      });

      await selectCell(0, 0, 0, 0);

      expect(getValue()).toEqual('A1');

      await keyDownUp('arrowdown');

      expect(getValue()).toEqual('A3');

      await keyDownUp('arrowdown');

      expect(getValue()).toEqual('A4');

      await keyDownUp('arrowdown');

      expect(getValue()).toEqual('A5');

      await keyDownUp('arrowdown');

      expect(getValue()).toEqual('A10');
    });
  });

  describe('column sorting', () => {
    it('should remove correct rows after sorting', async() => {
      handsontable({
        data: getMultilineData(5, 10),
        columnSorting: {
          initialConfig: {
            column: 0,
            sortOrder: 'desc'
          }
        },
        trimRows: [1],
        width: 500,
        height: 300
      });
      await alter('remove_row', 2, 1);

      expect(getDataAtCell(0, 0)).toBe('A5');
      expect(getDataAtCell(1, 0)).toBe('A4');
      expect(getDataAtCell(2, 0)).toBe('A1');
    });

    it('should remove correct rows after insert new rows in sorted column', async() => {
      handsontable({
        data: getMultilineData(5, 10),
        colHeaders: true,
        columnSorting: {
          initialConfig: {
            column: 0,
            sortOrder: 'desc'
          }
        },
        trimRows: [1],
        width: 500,
        height: 300
      });

      await sleep(100);

      await alter('insert_row_above', 2, 1);

      getHtCore().find('th span.columnSorting:eq(2)').simulate('mousedown');
      getHtCore().find('th span.columnSorting:eq(2)').simulate('mouseup');
      getHtCore().find('th span.columnSorting:eq(2)').simulate('click');

      await alter('remove_row', 2, 1);

      expect(getDataAtCell(0, 0)).toBe('A1');
      expect(getDataAtCell(1, 0)).toBe('A3');
      expect(getDataAtCell(2, 0)).toBe('A5');
      expect(getDataAtCell(3, 0)).toBe(null);
    });

    it('should remove correct rows after insert new rows in sorted column (multiple sort click)', async() => {
      handsontable({
        data: getMultilineData(5, 10),
        colHeaders: true,
        columnSorting: {
          initialConfig: {
            column: 0,
            sortOrder: 'desc'
          }
        },
        trimRows: [1],
        width: 500,
        height: 300
      });

      await sleep(100);

      await alter('insert_row_above', 2, 1);

      getHtCore().find('th span.columnSorting:eq(2)').simulate('mousedown');
      getHtCore().find('th span.columnSorting:eq(2)').simulate('mouseup');
      getHtCore().find('th span.columnSorting:eq(2)').simulate('click');

      await alter('insert_row_above', 0, 1);

      getHtCore().find('th span.columnSorting:eq(2)').simulate('mousedown');
      getHtCore().find('th span.columnSorting:eq(2)').simulate('mouseup');
      getHtCore().find('th span.columnSorting:eq(2)').simulate('click');

      await alter('remove_row', 0, 3);

      expect(getDataAtCell(0, 0)).toBe('A1');
      expect(getDataAtCell(1, 0)).toBe(null);
      expect(getDataAtCell(2, 0)).toBe(null);
      expect(getDataAtCell(3, 0)).toBe(null);
    });

    it('should correctly solve toVisualRow calculations after sort', async() => {
      handsontable({
        data: createSpreadsheetData(2, 1),
        trimRows: [0],
        columnSorting: true,
      });

      getPlugin('columnSorting').sort({
        column: 0,
        sortOrder: 'desc'
      });

      expect(toVisualRow(1)).toBe(0);
    });
  });

  describe('maxRows option set', () => {
    it('should return properly data after trimming', async() => {
      handsontable({
        data: createSpreadsheetData(10, 3),
        maxRows: 3,
        trimRows: [2, 3]
      });

      await sleep(100);

      expect(getData()).toEqual([
        ['A1', 'B1', 'C1'],
        ['A2', 'B2', 'C2'],
        ['A5', 'B5', 'C5']
      ]);
    });
  });

  describe('should display data properly when minSpareRow or / and minRows or / and startRows options are set', () => {
    it('minRows is set', async() => {
      handsontable({
        data: createSpreadsheetData(10, 3),
        minRows: 10,
        trimRows: [1, 2, 3, 4, 5, 6, 7, 8, 9]
      });

      expect(getData()).toEqual([
        ['A1', 'B1', 'C1'],
        [null, null, null],
        [null, null, null],
        [null, null, null],
        [null, null, null],
        [null, null, null],
        [null, null, null],
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ]);

      await setDataAtCell(9, 0, 'test');

      await sleep(100);

      expect(getData()).toEqual([
        ['A1', 'B1', 'C1'],
        [null, null, null],
        [null, null, null],
        [null, null, null],
        [null, null, null],
        [null, null, null],
        [null, null, null],
        [null, null, null],
        [null, null, null],
        ['test', null, null],
      ]);
    });

    it('minSpareRows is set', async() => {
      handsontable({
        data: createSpreadsheetData(10, 3),
        minSpareRows: 4,
        trimRows: [1, 2, 3, 4, 5, 6, 7, 8, 9]
      });

      expect(getData()).toEqual([
        ['A1', 'B1', 'C1'],
        [null, null, null],
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ]);

      await setDataAtCell(0, 0, 'test');

      await sleep(100);

      expect(getData()).toEqual([
        ['test', 'B1', 'C1'],
        [null, null, null],
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ]);

      await setDataAtCell(4, 0, 'test');

      await sleep(100);

      expect(getData()).toEqual([
        ['test', 'B1', 'C1'],
        [null, null, null],
        [null, null, null],
        [null, null, null],
        ['test', null, null],
        [null, null, null],
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ]);
    });

    it('data.length < minRows; no empty cells in dataset, minSpareRows set', async() => {
      handsontable({
        data: dataWithoutEmptyCells,
        trimRows: [0, 1],
        minRows: 5,
        minSpareRows: 2
      });

      expect(getData()).toEqual([
        ['A3', 'B3', 'C3'],
        [null, null, null],
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ]);

      await setDataAtCell(3, 0, 'test');

      await sleep(100);

      expect(getData()).toEqual([
        ['A3', 'B3', 'C3'],
        [null, null, null],
        [null, null, null],
        ['test', null, null],
        [null, null, null],
        [null, null, null],
      ]);
    });

    it('data.length < minRows; empty cells in dataset, minSpareRows set', async() => {
      handsontable({
        data: dataWithEmptyRow,
        trimRows: [0, 1],
        minRows: 5,
        minSpareRows: 2
      });

      expect(getData()).toEqual([
        [null, null, null],
        [null, null, null],
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ]);

      await setDataAtCell(3, 0, 'test');

      await sleep(100);

      expect(getData()).toEqual([
        [null, null, null],
        [null, null, null],
        [null, null, null],
        ['test', null, null],
        [null, null, null],
        [null, null, null],
      ]);
    });

    it('just the plugin is enabled and we load data #5707', async() => {
      handsontable({
        minSpareRows: 3,
        trimRows: true,
      });

      await loadData(createSpreadsheetData(5, 2));

      expect(getData()).toEqual([
        ['A1', 'B1'],
        ['A2', 'B2'],
        ['A3', 'B3'],
        ['A4', 'B4'],
        ['A5', 'B5'],
        [null, null],
        [null, null],
        [null, null],
      ]);
    });
  });

  describe('updateSettings', () => {
    it('should update list of trimmed rows when array of indexes is passed to the method - test no. 1', async() => {
      handsontable({
        data: getMultilineData(10, 10),
        trimRows: [2, 6, 7],
        width: 500,
        height: 300
      });

      await updateSettings({
        trimRows: [1, 2, 3, 4, 5]
      });

      expect(getDataAtCell(0, 0)).toBe('A1');
      expect(getDataAtCell(1, 0)).toBe('A7');
      expect(getDataAtCell(2, 0)).toBe('A8');
      expect(getDataAtCell(3, 0)).toBe('A9');
      expect(getDataAtCell(4, 0)).toBe('A10');
    });

    it('should update list of trimmed rows when array of indexes is passed to the method - test no. 2', async() => {
      handsontable({
        data: getMultilineData(10, 10),
        trimRows: true,
        width: 500,
        height: 300
      });

      getPlugin('trimRows').trimRows([2, 6, 7]);
      await render();

      await updateSettings({
        trimRows: [1, 2, 3, 4, 5]
      });

      expect(getDataAtCell(0, 0)).toBe('A1');
      expect(getDataAtCell(1, 0)).toBe('A7');
      expect(getDataAtCell(2, 0)).toBe('A8');
      expect(getDataAtCell(3, 0)).toBe('A9');
      expect(getDataAtCell(4, 0)).toBe('A10');
    });

    it('should clear list of trimmed rows when empty array is passed to the method - test no. 1', async() => {
      handsontable({
        data: getMultilineData(10, 10),
        trimRows: [2, 6, 7],
        width: 500,
        height: 300
      });

      await updateSettings({
        trimRows: []
      });

      expect(spec().$container.find('td').length).toEqual(100);
    });

    it('should clear list of trimmed rows when empty array is passed to the method - test no. 2', async() => {
      handsontable({
        data: getMultilineData(10, 10),
        trimRows: true,
        width: 500,
        height: 300
      });

      getPlugin('trimRows').trimRows([2, 6, 7]);

      await render();
      await updateSettings({
        trimRows: []
      });

      expect(spec().$container.find('td').length).toEqual(100);
    });

    it('should clear list of trimmed rows when handled setting object has key `trimRows` with value ' +
      'set to `false` - test no. 1', async() => {
      handsontable({
        data: getMultilineData(10, 10),
        trimRows: [2, 6, 7],
        width: 500,
        height: 300
      });

      await updateSettings({
        trimRows: false
      });

      expect(spec().$container.find('td').length).toEqual(100);
    });

    it('should clear list of trimmed rows when handled setting object has key `trimRows` with value ' +
      'set to `false` - test no. 2', async() => {
      handsontable({
        data: getMultilineData(10, 10),
        trimRows: true,
        width: 500,
        height: 300
      });

      getPlugin('trimRows').trimRows([2, 6, 7]);

      await render();
      await updateSettings({
        trimRows: false
      });

      expect(spec().$container.find('td').length).toEqual(100);
    });

    it('shouldn\'t clear list of trimmed rows when handled setting object has key `trimRows` with value ' +
      'set to `true` - test no. 1', async() => {
      handsontable({
        data: getMultilineData(10, 10),
        trimRows: [2, 6, 7],
        width: 500,
        height: 300
      });

      await updateSettings({
        trimRows: true
      });

      expect(getData().length).toEqual(7);
    });

    it('shouldn\'t clear list of trimmed rows when handled setting object has key `trimRows` with value ' +
      'set to `true` - test no. 2', async() => {
      handsontable({
        data: getMultilineData(10, 10),
        trimRows: true,
        width: 500,
        height: 300
      });

      getPlugin('trimRows').trimRows([2, 6, 7]);
      await render();

      await updateSettings({
        trimRows: true
      });

      expect(getData().length).toEqual(7);
    });

    it('shouldn\'t change list of trimmed rows when handled setting object don\'t have `trimRows` key - test no. 1', async() => {
      handsontable({
        data: getMultilineData(10, 10),
        trimRows: [2, 6, 7],
        width: 500,
        height: 300
      });

      await updateSettings({});

      await render();

      expect(getData().length).toEqual(7);
    });

    it('shouldn\'t change list of trimmed rows when handled setting object don\'t have `trimRows` key - test no. 2', async() => {
      handsontable({
        data: getMultilineData(10, 10),
        trimRows: true,
        width: 500,
        height: 300
      });

      getPlugin('trimRows').trimRows([2, 6, 7]);
      await render();
      await updateSettings({});

      expect(getData().length).toEqual(7);
    });
  });

  describe('regression check - headers resizing', () => {
    const DEFAULT_ROW_HEIGHT = 23;

    it.forTheme('classic')('should resize container for headers properly after insertion (pixel perfect)', async() => {
      const insertedRows = 6;

      handsontable({
        rowHeaders: true,
        colHeaders: true,
        trimRows: [0],
        startCols: 4,
        startRows: 3
      });

      const rowHeadersHeightAtStart = spec().$container.find('.ht_clone_inline_start').eq(0).height();

      await render(); // Extra `render` needed.

      expect(spec().$container.find('.ht_clone_inline_start').eq(0).height()).toBe(rowHeadersHeightAtStart);

      await alter('insert_row_above', 0, insertedRows);

      const newRowHeadersHeight = spec().$container.find('.ht_clone_inline_start').eq(0).height();

      expect(newRowHeadersHeight).toEqual(rowHeadersHeightAtStart + (insertedRows * DEFAULT_ROW_HEIGHT));
    });

    it.forTheme('main')('should resize container for headers properly after insertion (pixel perfect)', async() => {
      const THEME_ROW_HEIGHT = 29;
      const insertedRows = 6;

      handsontable({
        rowHeaders: true,
        colHeaders: true,
        trimRows: [0],
        startCols: 4,
        startRows: 3
      });

      const rowHeadersHeightAtStart = spec().$container.find('.ht_clone_inline_start').eq(0).height();

      await render(); // Extra `render` needed.

      expect(spec().$container.find('.ht_clone_inline_start').eq(0).height()).toBe(rowHeadersHeightAtStart);

      await alter('insert_row_above', 0, insertedRows);

      const newRowHeadersHeight = spec().$container.find('.ht_clone_inline_start').eq(0).height();

      expect(newRowHeadersHeight).toEqual(rowHeadersHeightAtStart + (insertedRows * THEME_ROW_HEIGHT));
    });

    it.forTheme('horizon')('should resize container for headers properly after insertion (pixel perfect)', async() => {
      const THEME_ROW_HEIGHT = 37;
      const insertedRows = 6;

      handsontable({
        rowHeaders: true,
        colHeaders: true,
        trimRows: [0],
        startCols: 4,
        startRows: 3
      });

      const rowHeadersHeightAtStart = spec().$container.find('.ht_clone_inline_start').eq(0).height();

      await render(); // Extra `render` needed.

      expect(spec().$container.find('.ht_clone_inline_start').eq(0).height()).toBe(rowHeadersHeightAtStart);

      await alter('insert_row_above', 0, insertedRows);

      const newRowHeadersHeight = spec().$container.find('.ht_clone_inline_start').eq(0).height();

      expect(newRowHeadersHeight).toEqual(rowHeadersHeightAtStart + (insertedRows * THEME_ROW_HEIGHT));
    });

    it.forTheme('classic')('should resize container for headers properly after removal (pixel perfect)', async() => {
      const removedRows = 6;

      handsontable({
        rowHeaders: true,
        colHeaders: true,
        trimRows: [0],
        startCols: 4,
        startRows: 10
      });

      const rowHeadersHeightAtStart = spec().$container.find('.ht_clone_inline_start').eq(0).height();

      await render(); // Extra `render` needed.

      expect(spec().$container.find('.ht_clone_inline_start').eq(0).height()).toBe(rowHeadersHeightAtStart);

      await alter('remove_row', 0, removedRows);

      const newRowHeadersHeight = spec().$container.find('.ht_clone_inline_start').eq(0).height();

      expect(newRowHeadersHeight).toEqual(rowHeadersHeightAtStart - (removedRows * DEFAULT_ROW_HEIGHT));
    });

    it.forTheme('main')('should resize container for headers properly after removal (pixel perfect)', async() => {
      const THEME_ROW_HEIGHT = 29;
      const removedRows = 6;

      handsontable({
        rowHeaders: true,
        colHeaders: true,
        trimRows: [0],
        startCols: 4,
        startRows: 10
      });

      const rowHeadersHeightAtStart = spec().$container.find('.ht_clone_inline_start').eq(0).height();

      await render(); // Extra `render` needed.

      expect(spec().$container.find('.ht_clone_inline_start').eq(0).height()).toBe(rowHeadersHeightAtStart);

      await alter('remove_row', 0, removedRows);

      const newRowHeadersHeight = spec().$container.find('.ht_clone_inline_start').eq(0).height();

      expect(newRowHeadersHeight).toEqual(rowHeadersHeightAtStart - (removedRows * THEME_ROW_HEIGHT));
    });

    it.forTheme('horizon')('should resize container for headers properly after removal (pixel perfect)', async() => {
      const THEME_ROW_HEIGHT = 37;
      const removedRows = 6;

      handsontable({
        rowHeaders: true,
        colHeaders: true,
        trimRows: [0],
        startCols: 4,
        startRows: 10
      });

      const rowHeadersHeightAtStart = spec().$container.find('.ht_clone_inline_start').eq(0).height();

      await render(); // Extra `render` needed.

      expect(spec().$container.find('.ht_clone_inline_start').eq(0).height()).toBe(rowHeadersHeightAtStart);

      await alter('remove_row', 0, removedRows);

      const newRowHeadersHeight = spec().$container.find('.ht_clone_inline_start').eq(0).height();

      expect(newRowHeadersHeight).toEqual(rowHeadersHeightAtStart - (removedRows * THEME_ROW_HEIGHT));
    });

    it.forTheme('classic')('should resize container for headers properly after untrimming row ' +
      '(pixel perfect) #6276', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        trimRows: [0],
        startCols: 4,
        startRows: 10
      });

      const rowHeadersHeightAtStart = spec().$container.find('.ht_clone_inline_start').eq(0).height();

      await render(); // Extra `render` needed.

      expect(spec().$container.find('.ht_clone_inline_start').eq(0).height()).toBe(rowHeadersHeightAtStart);

      getPlugin('trimRows').untrimAll();
      await render();

      const newRowHeadersHeight = spec().$container.find('.ht_clone_inline_start').eq(0).height();

      expect(newRowHeadersHeight).toEqual(rowHeadersHeightAtStart + DEFAULT_ROW_HEIGHT);
    });

    it.forTheme('main')('should resize container for headers properly after untrimming row ' +
      '(pixel perfect) #6276', async() => {
      const THEME_ROW_HEIGHT = 29;

      handsontable({
        rowHeaders: true,
        colHeaders: true,
        trimRows: [0],
        startCols: 4,
        startRows: 10
      });

      const rowHeadersHeightAtStart = spec().$container.find('.ht_clone_inline_start').eq(0).height();

      await render(); // Extra `render` needed.

      expect(spec().$container.find('.ht_clone_inline_start').eq(0).height()).toBe(rowHeadersHeightAtStart);

      getPlugin('trimRows').untrimAll();
      await render();

      const newRowHeadersHeight = spec().$container.find('.ht_clone_inline_start').eq(0).height();

      expect(newRowHeadersHeight).toEqual(rowHeadersHeightAtStart + THEME_ROW_HEIGHT);
    });

    it.forTheme('horizon')('should resize container for headers properly after untrimming row ' +
      '(pixel perfect) #6276', async() => {
      const THEME_ROW_HEIGHT = 37;

      handsontable({
        rowHeaders: true,
        colHeaders: true,
        trimRows: [0],
        startCols: 4,
        startRows: 10
      });

      const rowHeadersHeightAtStart = spec().$container.find('.ht_clone_inline_start').eq(0).height();

      await render(); // Extra `render` needed.

      expect(spec().$container.find('.ht_clone_inline_start').eq(0).height()).toBe(rowHeadersHeightAtStart);

      getPlugin('trimRows').untrimAll();
      await render();

      const newRowHeadersHeight = spec().$container.find('.ht_clone_inline_start').eq(0).height();

      expect(newRowHeadersHeight).toEqual(rowHeadersHeightAtStart + THEME_ROW_HEIGHT);
    });
  });
});
