describe('AutoFill', () => {
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

  it('should appear when fillHandle equals true', () => {
    handsontable({
      fillHandle: true
    });

    selectCell(2, 2);

    expect(isFillHandleVisible()).toBe(true);
  });

  it('should appear when fillHandle is enabled as `string` value', () => {
    handsontable({
      fillHandle: 'horizontal'
    });

    selectCell(2, 2);

    expect(isFillHandleVisible()).toBe(true);
  });

  it('should render selection borders with set proper z-indexes', () => {
    const hot = handsontable({
      width: 200,
      height: 200,
      startRows: 20,
      startCols: 20,
      colHeaders: true,
      rowHeaders: true
    });

    hot.selectCell(1, 1, 2, 2);

    expect(getComputedStyle(hot.rootElement.querySelector('.ht_master .htBorders .current')).zIndex)
      .toBe('10');
    expect(getComputedStyle(hot.rootElement.querySelector('.ht_master .htBorders .area')).zIndex)
      .toBe('8');
    expect(getComputedStyle(hot.rootElement.querySelector('.ht_master .htBorders .fill')).zIndex)
      .toBe('6');
  });

  it('should not change cell value (drag vertically when fillHandle option is set to `horizontal`)', () => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [7, 8, 9, 1, 2, 3],
        [4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: 'horizontal'
    });

    selectCell(0, 0);
    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tbody tr:eq(1) td:eq(0)').simulate('mouseover').simulate('mouseup');

    expect(getDataAtCell(1, 0)).toEqual(7);
  });

  it('should not change cell value (drag horizontally when fillHandle option is set to `vertical`)', () => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [7, 8, 9, 1, 2, 3],
        [4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: 'vertical'
    });

    selectCell(0, 0);
    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tbody tr:eq(0) td:eq(1)').simulate('mouseover').simulate('mouseup');

    expect(getDataAtCell(0, 1)).toEqual(2);
  });

  it('should work properly when fillHandle option is set to object with property `direction` set to `vertical`)', () => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [7, 8, 9, 1, 2, 3],
        [4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: {
        direction: 'vertical'
      }
    });

    selectCell(0, 0);
    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tbody tr:eq(0) td:eq(1)').simulate('mouseover').simulate('mouseup');

    expect(getDataAtCell(0, 1)).toEqual(2);

    selectCell(0, 0);
    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tbody tr:eq(1) td:eq(0)').simulate('mouseover').simulate('mouseup');

    expect(getDataAtCell(1, 0)).toEqual(1);
  });

  it('should work properly when fillHandle option is set to object with property `direction` set to `horizontal`)', () => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [7, 8, 9, 1, 2, 3],
        [4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: {
        direction: 'horizontal'
      }
    });

    selectCell(0, 0);
    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tbody tr:eq(0) td:eq(1)').simulate('mouseover').simulate('mouseup');

    expect(getDataAtCell(0, 1)).toEqual(1);

    selectCell(0, 0);
    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tbody tr:eq(1) td:eq(0)').simulate('mouseover').simulate('mouseup');

    expect(getDataAtCell(1, 0)).toEqual(7);
  });

  it('should fill the cells when dragging the handle triggered by row header selection', () => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [7, 8, 9, 1, 2, 3],
        [4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: true,
    });

    selectRows(1);
    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tbody tr:eq(3) td:eq(5)').simulate('mouseover').simulate('mouseup');

    expect(getData()).toEqual([
      [1, 2, 3, 4, 5, 6],
      [7, 8, 9, 1, 2, 3],
      [7, 8, 9, 1, 2, 3],
      [7, 8, 9, 1, 2, 3],
    ]);
    expect(getSelected()).toEqual([[1, 0, 3, 5]]);
  });

  it('should fill the cells when dragging the handle triggered by column header selection', () => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [7, 8, 9, 1, 2, 3],
        [4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: true,
    });

    selectColumns(1);
    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tbody tr:eq(3) td:eq(5)').simulate('mouseover').simulate('mouseup');

    expect(getData()).toEqual([
      [1, 2, 2, 2, 2, 2],
      [7, 8, 8, 8, 8, 8],
      [4, 5, 5, 5, 5, 5],
      [1, 2, 2, 2, 2, 2]
    ]);
    expect(getSelected()).toEqual([[0, 1, 3, 5]]);
  });

  it('should not change cell value (drag when fillHandle is set to `false`)', () => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [7, 8, 9, 1, 2, 3],
        [4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: false
    });

    // checking drag vertically - should not change cell value

    selectCell(0, 0);
    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tbody tr:eq(0) td:eq(1)').simulate('mouseover').simulate('mouseup');

    expect(getDataAtCell(0, 1)).toEqual(2);

    // checking drag horizontally - should not change cell value

    selectCell(0, 0);
    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tbody tr:eq(0) td:eq(1)').simulate('mouseover').simulate('mouseup');

    expect(getDataAtCell(0, 1)).toEqual(2);
  });

  it('should work properly when using updateSettings', () => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [7, 8, 9, 1, 2, 3],
        [4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: 'horizontal'
    });

    updateSettings({ fillHandle: 'vertical' });

    // checking drag vertically - should change cell value

    selectCell(0, 0);
    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tbody tr:eq(0) td:eq(1)').simulate('mouseover').simulate('mouseup');

    expect(getDataAtCell(0, 1)).toEqual(2);

    updateSettings({ fillHandle: false });

    // checking drag vertically - should not change cell value

    selectCell(0, 1);
    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tbody tr:eq(1) td:eq(1)').simulate('mouseover').simulate('mouseup');

    expect(getDataAtCell(1, 1)).toEqual(8);

    // checking drag horizontally - should not change cell value

    selectCell(0, 1);
    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tbody tr:eq(0) td:eq(2)').simulate('mouseover').simulate('mouseup');

    expect(getDataAtCell(0, 2)).toEqual(3);
  });

  it('should appear when fillHandle is enabled as `object` value', () => {
    handsontable({
      fillHandle: {
        allowInsertRow: true
      }
    });

    selectCell(2, 2);

    expect(isFillHandleVisible()).toBe(true);
  });

  it('should not appear when fillHandle equals false', () => {
    handsontable({
      fillHandle: false
    });
    selectCell(2, 2);

    expect(isFillHandleVisible()).toBe(false);
  });

  it('should disappear when beginediting is triggered', () => {
    handsontable({
      fillHandle: true
    });
    selectCell(2, 2);

    keyDownUp('enter');

    expect(isFillHandleVisible()).toBe(false);
  });

  it('should appear when finishediting is triggered', () => {
    handsontable({
      fillHandle: true
    });
    selectCell(2, 2);

    keyDownUp('enter');
    keyDownUp('enter');

    expect(isFillHandleVisible()).toBe(true);
  });

  it('should not appear when fillHandle equals false and finishediting is triggered', () => {
    handsontable({
      fillHandle: false
    });
    selectCell(2, 2);

    keyDownUp('enter');
    keyDownUp('enter');

    expect(isFillHandleVisible()).toBe(false);
  });

  it('should appear when editor is discarded using the ESC key', () => {
    handsontable({
      fillHandle: true
    });
    selectCell(2, 2);

    keyDownUp('enter');
    keyDownUp('escape');

    expect(isFillHandleVisible()).toBe(true);
  });

  describe('beforeAutofill hook autofill value overrides', () => {
    it('should use a custom value when mutating the selection data array', () => {
      handsontable({
        data: [
          [1, 2, 3, 4, 5, 6],
          [1, 2, 3, 4, 5, 6],
          [1, 2, 3, 4, 5, 6],
          [1, 2, 3, 4, 5, 6]
        ],
        beforeAutofill(selectionData) {
          selectionData[0][0] = 'test';
        }
      });
      selectCell(0, 0);

      spec().$container.find('.wtBorder.corner').simulate('mousedown');
      spec().$container.find('tr:eq(1) td:eq(0)').simulate('mouseover');
      spec().$container.find('tr:eq(2) td:eq(0)').simulate('mouseover');
      spec().$container.find('.wtBorder.corner').simulate('mouseup');

      expect(getSelected()).toEqual([[0, 0, 2, 0]]);
      expect(getDataAtCell(1, 0)).toEqual('test');
    });

    it('should pass correct arguments to `beforeAutofill`', () => {
      const beforeAutofill = jasmine.createSpy();

      const hot = handsontable({
        data: [
          [1, 2, 3, 4, 5, 6],
          ['x', 'x', 3, 4, 5, 6],
          ['x', 'x', 3, 4, 5, 6],
          [1, 2, 3, 4, 5, 6]
        ],
        beforeAutofill
      });

      hot.selectAll();
      const CellRange = hot.getSelectedRangeLast().constructor;

      hot.deselectCell();
      const CellCoords = hot.getCoords(hot.getCell(0, 0)).constructor;

      selectCell(0, 0, 0, 1);

      spec().$container.find('.wtBorder.corner').simulate('mousedown');
      spec().$container.find('tr:eq(2) td:eq(2)').simulate('mouseover');
      spec().$container.find('.wtBorder.corner').simulate('mouseup');

      const selectionData = [[1, 2]];

      const sourceRange = {
        from: {
          row: 0,
          col: 0
        },
        to: {
          row: 0,
          col: 1
        }
      };

      const targetRange = {
        from: {
          row: 1,
          col: 0
        },
        to: {
          row: 2,
          col: 1
        }
      };

      const direction = 'down';

      expect(beforeAutofill).toHaveBeenCalledWith(
        selectionData,
        new CellRange(
          new CellCoords(sourceRange.from.row, sourceRange.from.col),
          new CellCoords(sourceRange.from.row, sourceRange.from.col),
          new CellCoords(sourceRange.to.row, sourceRange.to.col),
        ),
        new CellRange(
          new CellCoords(targetRange.from.row, targetRange.from.col),
          new CellCoords(targetRange.from.row, targetRange.from.col),
          new CellCoords(targetRange.to.row, targetRange.to.col),
        ),
        direction,
      );
    });

    it('should clear the whole target range if `beforeAutofill` returns an empty array of arrays', () => {
      const hot = handsontable({
        data: [
          [1, 2, 3, 4, 5, 6],
          [1, 2, 3, 4, 5, 6],
          [1, 2, 3, 4, 5, 6],
          [1, 2, 3, 4, 5, 6]
        ],
        beforeAutofill() {
          return [[]];
        }
      });

      selectCell(0, 0, 0, 3);

      spec().$container.find('.wtBorder.corner').simulate('mousedown');
      spec().$container.find('tr:eq(3) td:eq(3)').simulate('mouseover');
      spec().$container.find('.wtBorder.corner').simulate('mouseup');

      expect(hot.getData()).toEqual([
        [1, 2, 3, 4, 5, 6],
        [undefined, undefined, undefined, undefined, 5, 6],
        [undefined, undefined, undefined, undefined, 5, 6],
        [undefined, undefined, undefined, undefined, 5, 6]
      ]);
    });

    it('should use input from `beforeAutofill` if data is returned', () => {
      const hot = handsontable({
        data: [
          [1, 2, 3, 4, 5, 6],
          [1, 2, 3, 4, 5, 6],
          [1, 2, 3, 4, 5, 6],
          [1, 2, 3, 4, 5, 6]
        ],
        beforeAutofill() {
          return [[7, 8], [9, 10]];
        }
      });

      selectCell(0, 0, 0, 3);

      spec().$container.find('.wtBorder.corner').simulate('mousedown');
      spec().$container.find('tr:eq(3) td:eq(3)').simulate('mouseover');
      spec().$container.find('.wtBorder.corner').simulate('mouseup');

      expect(hot.getData()).toEqual([
        [1, 2, 3, 4, 5, 6],
        [7, 8, 7, 8, 5, 6],
        [9, 10, 9, 10, 5, 6],
        [7, 8, 7, 8, 5, 6]
      ]);
    });

    it('should use input from `beforeAutofill` if data is returned, in the correct order, upwards', () => {
      const hot = handsontable({
        data: [
          ['x'],
          ['x'],
          ['x'],
          ['x'],
          ['x'],
          [1],
          [1]
        ],
        beforeAutofill() {
          return [
            ['a'],
            ['b'],
          ];
        }
      });

      selectCell(5, 0, 6, 0);

      spec().$container.find('.wtBorder.corner').simulate('mousedown');
      spec().$container.find('tr:eq(0) td:eq(0)').simulate('mouseover');
      spec().$container.find('.wtBorder.corner').simulate('mouseup');

      expect(hot.getData()).toEqual([
        ['b'],
        ['a'],
        ['b'],
        ['a'],
        ['b'],
        [1],
        [1]
      ]);
    });
  });

  describe('beforeChange hook autofill value overrides', () => {
    it('should use a custom value when introducing changes', () => {
      handsontable({
        data: [
          [1, 2, 3, 4, 5, 6],
          [1, 2, 3, 4, 5, 6],
          [1, 2, 3, 4, 5, 6],
          [1, 2, 3, 4, 5, 6],
        ],
        beforeChange(changes) {
          changes[0][3] = 'test2';
          changes[1][3] = 'test3';
          changes[2][3] = 'test4';
        }
      });
      selectCell(0, 0);

      spec().$container.find('.wtBorder.corner').simulate('mousedown');
      spec().$container.find('tr:eq(1) td:eq(0)').simulate('mouseover');
      spec().$container.find('tr:eq(3) td:eq(0)').simulate('mouseover');
      spec().$container.find('.wtBorder.corner').simulate('mouseup');

      expect(getSelected()).toEqual([[0, 0, 3, 0]]);
      expect(getData()).toEqual([
        [1, 2, 3, 4, 5, 6],
        ['test2', 2, 3, 4, 5, 6],
        ['test3', 2, 3, 4, 5, 6],
        ['test4', 2, 3, 4, 5, 6]
      ]);
    });
  });

  it('should pass correct arguments to `afterAutofill`', () => {
    const afterAutofill = jasmine.createSpy();

    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      afterAutofill
    });

    selectAll();

    const CellRange = getSelectedRangeLast().constructor;

    deselectCell();

    const CellCoords = getCoords(getCell(0, 0)).constructor;

    selectCell(0, 0, 0, 1);

    spec().$container.find('.wtBorder.corner').simulate('mousedown');
    spec().$container.find('tr:eq(1) td:eq(0)').simulate('mouseover');
    spec().$container.find('tr:eq(2) td:eq(1)').simulate('mouseover');
    spec().$container.find('.wtBorder.corner').simulate('mouseup');

    const fillData = [[1, 2]];

    const sourceRange = {
      from: {
        row: 0,
        col: 0
      },
      to: {
        row: 0,
        col: 1
      }
    };

    const targetRange = {
      from: {
        row: 1,
        col: 0
      },
      to: {
        row: 2,
        col: 1
      }
    };

    const direction = 'down';

    expect(afterAutofill).toHaveBeenCalledWith(
      fillData,
      new CellRange(
        new CellCoords(sourceRange.from.row, sourceRange.from.col),
        new CellCoords(sourceRange.from.row, sourceRange.from.col),
        new CellCoords(sourceRange.to.row, sourceRange.to.col),
      ),
      new CellRange(
        new CellCoords(targetRange.from.row, targetRange.from.col),
        new CellCoords(targetRange.from.row, targetRange.from.col),
        new CellCoords(targetRange.to.row, targetRange.to.col),
      ),
      direction,
    );
  });

  it('should detect custom input from `beforeAutofill` in `afterAutofill` arguments', () => {
    const afterAutofill = jasmine.createSpy();

    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      beforeAutofill() {
        return [['a']];
      },
      afterAutofill
    });

    selectAll();

    const CellRange = getSelectedRangeLast().constructor;

    deselectCell();

    const CellCoords = getCoords(getCell(0, 0)).constructor;

    selectCell(0, 0, 0, 1);

    spec().$container.find('.wtBorder.corner').simulate('mousedown');
    spec().$container.find('tr:eq(1) td:eq(0)').simulate('mouseover');
    spec().$container.find('tr:eq(2) td:eq(1)').simulate('mouseover');
    spec().$container.find('.wtBorder.corner').simulate('mouseup');

    const fillData = [['a']];
    const sourceRange = {
      from: {
        row: 0,
        col: 0
      },
      to: {
        row: 0,
        col: 1
      }
    };

    const targetRange = {
      from: {
        row: 1,
        col: 0
      },
      to: {
        row: 2,
        col: 1
      }
    };

    const direction = 'down';

    expect(afterAutofill).toHaveBeenCalledWith(
      fillData,
      new CellRange(
        new CellCoords(sourceRange.from.row, sourceRange.from.col),
        new CellCoords(sourceRange.from.row, sourceRange.from.col),
        new CellCoords(sourceRange.to.row, sourceRange.to.col),
      ),
      new CellRange(
        new CellCoords(targetRange.from.row, targetRange.from.col),
        new CellCoords(targetRange.from.row, targetRange.from.col),
        new CellCoords(targetRange.to.row, targetRange.to.col),
      ),
      direction,
    );
  });

  it('should cancel autofill if beforeAutofill returns false', () => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      beforeAutofill() {
        return false;
      }
    });
    selectCell(0, 0);

    spec().$container.find('.wtBorder.corner').simulate('mousedown');
    spec().$container.find('tr:eq(1) td:eq(0)').simulate('mouseover');
    spec().$container.find('tr:eq(2) td:eq(0)').simulate('mouseover');
    spec().$container.find('.wtBorder.corner').simulate('mouseup');

    expect(getSelected()).toEqual([[0, 0, 0, 0]]);
    expect(getDataAtCell(1, 0)).toEqual(1);
  });

  it('should use correct cell coordinates also when Handsontable is used inside a TABLE (#355)', () => {
    const $table = $('<table><tr><td></td></tr></table>').appendTo('body');

    spec().$container.appendTo($table.find('td'));

    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      beforeAutofill(selectionData) {
        selectionData[0][0] = 'test';
      }
    });
    selectCell(1, 1);

    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tr:eq(1) td:eq(0)').simulate('mouseover');
    spec().$container.find('tr:eq(2) td:eq(0)').simulate('mouseover');
    spec().$container.find('tr:eq(2) td:eq(0)').simulate('mouseup');

    expect(getSelected()).toEqual([[1, 1, 2, 1]]);
    expect(getDataAtCell(2, 1)).toEqual('test');

    document.body.removeChild($table[0]);
  });

  it('should fill empty cells below until the end of content in the neighbouring column with current cell\'s data', () => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, null, null, null, null],
        [1, 2, null, null, null, null]
      ]
    });

    selectCell(1, 3);
    const fillHandle = spec().$container.find('.wtBorder.current.corner')[0];

    mouseDoubleClick(fillHandle);

    expect(getDataAtCell(2, 3)).toEqual(null);
    expect(getDataAtCell(3, 3)).toEqual(null);

    selectCell(1, 2);
    mouseDoubleClick(fillHandle);

    expect(getDataAtCell(2, 2)).toEqual(3);
    expect(getDataAtCell(3, 2)).toEqual(3);
  });

  // https://github.com/handsontable/dev-handsontable/issues/1757
  it('should fill empty cells below until the end of content in the neighbouring column with current cell\'s data' +
    'and NOT treat cells filled with 0s as empty', () => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 0, 4, 5, 6],
        [1, 2, 0, null, null, null],
        [1, 2, 0, null, null, null],
        [1, 2, null, null, null, null]
      ]
    });

    selectCell(0, 2);
    const fillHandle = spec().$container.find('.wtBorder.current.corner')[0];

    mouseDoubleClick(fillHandle);

    expect(getDataAtCell(1, 2)).toEqual(0);
    expect(getDataAtCell(2, 2)).toEqual(0);
    expect(getDataAtCell(3, 2)).toEqual(0);
    expect(getDataAtCell(4, 2)).toEqual(null);

    selectCell(1, 3);
    mouseDoubleClick(fillHandle);

    expect(getDataAtCell(2, 3)).toEqual(4);
    expect(getDataAtCell(3, 3)).toEqual(4);
    expect(getDataAtCell(4, 3)).toEqual(null);
  });

  it('should fill cells below until the end of content in the neighbouring column with the currently selected area\'s data', () => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, null, null, null, null],
        [1, 2, null, null, null, null]
      ]
    });

    selectCell(1, 3, 1, 4);
    const fillHandle = spec().$container.find('.wtBorder.area.corner')[0];

    mouseDoubleClick(fillHandle);

    expect(getDataAtCell(2, 3)).toEqual(null);
    expect(getDataAtCell(3, 3)).toEqual(null);
    expect(getDataAtCell(2, 4)).toEqual(null);
    expect(getDataAtCell(3, 4)).toEqual(null);

    selectCell(1, 2, 1, 3);
    mouseDoubleClick(fillHandle);

    expect(getDataAtCell(2, 2)).toEqual(3);
    expect(getDataAtCell(3, 2)).toEqual(3);
    expect(getDataAtCell(2, 3)).toEqual(4);
    expect(getDataAtCell(3, 3)).toEqual(4);
  });

  it('shouldn\'t fill cells left #5023', () => {
    handsontable({
      data: [
        ['1', '2', '', '3', '4'],
        ['1', '', '', '', ''],
        ['1', '', '', '', ''],
        ['', '', '', '', ''],
        ['', '', '', '', '']
      ]
    });

    selectCell(0, 3);
    const fillHandle = spec().$container.find('.wtBorder.current.corner')[0];

    mouseDoubleClick(fillHandle);

    expect(getDataAtCell(0, 3)).toEqual('3');
    expect(getDataAtCell(0, 2)).toEqual('');
    expect(getDataAtCell(0, 1)).toEqual('2');
    expect(getDataAtCell(0, 0)).toEqual('1');
  });

  it('should add new row after dragging the handle to the last table row', async() => {
    handsontable({
      data: [
        [1, 2, 'test', 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: true
    });

    selectCell(0, 2);

    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tr:last-child td:eq(2)').simulate('mouseover');

    expect(countRows()).toBe(4);

    await sleep(300);
    expect(countRows()).toBe(5);

    spec().$container.find('tr:last-child td:eq(2)').simulate('mouseover');

    await sleep(300);
    expect(countRows()).toBe(6);

    expect(getData()).toEqual([
      [1, 2, 'test', 4, 5, 6],
      [1, 2, 3, 4, 5, 6],
      [1, 2, 3, 4, 5, 6],
      [1, 2, 3, 4, 5, 6],
      [null, null, null, null, null, null],
      [null, null, null, null, null, null],
    ]);
  });

  it('should add new row after dragging the handle to the last table row (autoInsertRow as true)', async() => {
    handsontable({
      data: [
        [1, 2, 'test', 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: {
        autoInsertRow: true,
      }
    });

    selectCell(0, 2);

    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tr:last-child td:eq(2)').simulate('mouseover');

    expect(countRows()).toBe(4);

    await sleep(300);
    expect(countRows()).toBe(5);

    spec().$container.find('tr:last-child td:eq(2)').simulate('mouseover');

    await sleep(300);
    expect(countRows()).toBe(6);

    expect(getData()).toEqual([
      [1, 2, 'test', 4, 5, 6],
      [1, 2, 3, 4, 5, 6],
      [1, 2, 3, 4, 5, 6],
      [1, 2, 3, 4, 5, 6],
      [null, null, null, null, null, null],
      [null, null, null, null, null, null],
    ]);
  });

  it('should add new row after dragging the handle to the last table row (autoInsertRow as true, vertical)', async() => {
    const hot = handsontable({
      data: [
        [1, 2, 'test', 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: {
        direction: 'vertical',
        autoInsertRow: true,
      }
    });

    selectCell(0, 2);

    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tr:last-child td:eq(2)').simulate('mouseover');

    expect(hot.countRows()).toBe(4);

    await sleep(300);
    expect(hot.countRows()).toBe(5);

    spec().$container.find('tr:last-child td:eq(2)').simulate('mouseover');

    await sleep(300);
    expect(hot.countRows()).toBe(6);
  });

  it('should not add new row after dragging the handle to the last table row (autoInsertRow as true, horizontal)', async() => {
    const hot = handsontable({
      data: [
        [1, 2, 'test', 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: {
        direction: 'horizontal',
        autoInsertRow: true,
      }
    });

    selectCell(0, 2);

    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tr:last-child td:eq(2)').simulate('mouseover');

    expect(hot.countRows()).toBe(4);

    await sleep(300);

    expect(hot.countRows()).toBe(4);

    spec().$container.find('tr:last-child td:eq(2)').simulate('mouseover');

    await sleep(300);

    expect(hot.countRows()).toBe(4);
  });

  it('should not add new row after dragging the handle below the viewport when `autoInsertRow` is disabled', async() => {
    const hot = handsontable({
      data: [
        [1, 2, 'test', 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: {
        autoInsertRow: false
      }
    });

    selectCell(0, 2);

    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    const ev = {};
    const $lastRow = spec().$container.find('tr:last-child td:eq(2)');

    expect(hot.countRows()).toBe(4);

    ev.clientX = $lastRow.offset().left / 2;
    ev.clientY = $lastRow.offset().top + 50;

    $(document.documentElement).simulate('mousemove', ev);

    await sleep(300);

    expect(hot.countRows()).toBe(4);

    ev.clientY = $lastRow.offset().top + 150;
    $(document.documentElement).simulate('mousemove', ev);

    await sleep(300);

    expect(hot.countRows()).toBe(4);
  });

  it('should not add new rows if the current number of rows reaches the maxRows setting', async() => {
    const hot = handsontable({
      data: [
        [1, 2, 'test', 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: {
        autoInsertRow: true
      },
      maxRows: 5
    });

    selectCell(0, 2);

    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tr:last-child td:eq(2)').simulate('mouseover');

    expect(hot.countRows()).toBe(4);

    await sleep(200);

    expect(hot.countRows()).toBe(5);

    spec().$container.find('tr:last-child td:eq(2)').simulate('mouseover');

    await sleep(200);

    expect(hot.countRows()).toBe(5);
  });

  it('should add new row after dragging the handle below the viewport', async() => {
    const hot = handsontable({
      data: [
        [1, 2, 'test', 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: {
        autoInsertRow: true
      },
    });

    selectCell(0, 2);

    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    const ev = {};
    const $lastRow = spec().$container.find('tr:last-child td:eq(2)');

    expect(hot.countRows()).toBe(4);

    ev.clientX = $lastRow.offset().left / 2;
    ev.clientY = $lastRow.offset().top + 50;

    $(document.documentElement).simulate('mousemove', ev);

    await sleep(300);

    expect(hot.countRows()).toBe(5);

    ev.clientY = $lastRow.offset().top + 150;
    $(document.documentElement).simulate('mousemove', ev);

    await sleep(300);

    expect(hot.countRows()).toBe(6);
  });

  it('should fill cells when dragging the handle to the headers', () => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 7, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      colHeaders: true,
      rowHeaders: true
    });

    // col headers:

    selectCell(2, 2);

    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');

    let errors = 0;

    try {
      spec().$container.find('thead tr:first-child th:eq(2)').simulate('mouseover').simulate('mouseup');
    } catch (err) {
      errors += 1;
    }

    expect(errors).toEqual(0);
    expect(getDataAtCell(1, 2)).toEqual(7);
    expect(getDataAtCell(0, 2)).toEqual(7);

    expect($('.fill').filter(function() { return $(this).css('display') !== 'none'; }).length).toEqual(0); // check if fill selection is refreshed

    // row headers:
    selectCell(2, 2);

    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');

    errors = 0;

    try {
      spec().$container.find('tbody tr:nth(2) th:first-child').simulate('mouseover').simulate('mouseup');
    } catch (err) {
      errors += 1;
    }

    expect(errors).toEqual(0);
    expect(getDataAtCell(2, 1)).toEqual(7);
    expect(getDataAtCell(2, 0)).toEqual(7);
    expect($('.fill').filter(function() { return $(this).css('display') !== 'none'; }).length).toEqual(0); // check if fill selection is refreshed
  });

  it('should not add a new row if dragging from the last row upwards or sideways', async() => {
    const mouseOverSpy = jasmine.createSpy('mouseOverSpy');
    const hot = handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 'test', 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      afterOnCellMouseOver: mouseOverSpy
    });

    selectCell(3, 2);

    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tr:nth-child(3) td:eq(2)').simulate('mouseover');

    await sleep(300);
    expect(hot.countRows()).toBe(4);

    selectCell(3, 2);
    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tr:nth-child(4) td:eq(3)').simulate('mouseover');

    await sleep(200);

    expect(hot.countRows()).toBe(4);

    selectCell(3, 2);
    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tr:nth-child(4) td:eq(1)').simulate('mouseover');

    await sleep(200);

    expect(hot.countRows()).toBe(4);
  });

  it('should add new row after dragging the handle below the viewport', async() => {
    const hot = handsontable({
      data: [
        [1, 2, 'test', 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: {
        autoInsertRow: true
      },
    });

    selectCell(0, 2);

    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    const ev = {};
    const $lastRow = spec().$container.find('tr:last-child td:eq(2)');

    expect(hot.countRows()).toBe(4);

    ev.clientX = $lastRow.offset().left / 2;
    ev.clientY = $lastRow.offset().top + 50;

    $(document.documentElement).simulate('mousemove', ev);

    await sleep(300);

    expect(hot.countRows()).toBe(5);

    ev.clientY = $lastRow.offset().top + 150;
    $(document.documentElement).simulate('mousemove', ev);

    await sleep(300);

    expect(hot.countRows()).toBe(6);
  });

  it('should not add new row after dragging the handle below the viewport (direction is set to horizontal)', async() => {
    const hot = handsontable({
      data: [
        [1, 2, 'test', 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: {
        direction: 'horizontal',
        autoInsertRow: true
      }
    });

    selectCell(0, 2);

    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    const ev = {};
    const $lastRow = spec().$container.find('tr:last-child td:eq(2)');

    expect(hot.countRows()).toBe(4);

    ev.clientX = $lastRow.offset().left / 2;
    ev.clientY = $lastRow.offset().top + 50;

    $(document.documentElement).simulate('mousemove', ev);

    await sleep(300);

    expect(hot.countRows()).toBe(4);
  });

  it('should populate the filled data in the correct order, when dragging the fill handle upwards (selection from left to right)', () => {
    handsontable({
      data: [
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, 2, 3, null],
        [null, 1, 4, null],
        [null, 0, 5, null],
        [null, null, null, null],
      ]
    });

    selectCell(4, 1, 6, 2);
    spec().$container.find('.wtBorder.area.corner').simulate('mousedown');
    $(getCell(0, 2)).simulate('mouseover').simulate('mouseup');

    expect(getData()).toEqual([
      [null, 0, 5, null],
      [null, 2, 3, null],
      [null, 1, 4, null],
      [null, 0, 5, null],
      [null, 2, 3, null],
      [null, 1, 4, null],
      [null, 0, 5, null],
      [null, null, null, null],
    ]);
  });

  it('should populate the filled data in the correct order, when dragging the fill handle upwards (selection from right to left)', () => {
    handsontable({
      data: [
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, 2, 3, null],
        [null, 1, 4, null],
        [null, 0, 5, null],
        [null, null, null, null],
      ]
    });

    selectCell(6, 2, 4, 1);
    spec().$container.find('.wtBorder.area.corner').simulate('mousedown');
    $(getCell(0, 2)).simulate('mouseover').simulate('mouseup');

    expect(getData()).toEqual([
      [null, 0, 5, null],
      [null, 2, 3, null],
      [null, 1, 4, null],
      [null, 0, 5, null],
      [null, 2, 3, null],
      [null, 1, 4, null],
      [null, 0, 5, null],
      [null, null, null, null],
    ]);
  });

  it('should populate the filled data in the correct order, when dragging the fill handle downward (selection from left to right)', () => {
    handsontable({
      data: [
        [null, null, null, null],
        [null, 2, 3, null],
        [null, 1, 4, null],
        [null, 0, 5, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
      ]
    });

    selectCell(1, 1, 3, 2);
    spec().$container.find('.wtBorder.area.corner').simulate('mousedown');
    $(getCell(7, 2)).simulate('mouseover').simulate('mouseup');

    expect(getData()).toEqual([
      [null, null, null, null],
      [null, 2, 3, null],
      [null, 1, 4, null],
      [null, 0, 5, null],
      [null, 2, 3, null],
      [null, 1, 4, null],
      [null, 0, 5, null],
      [null, 2, 3, null],
    ]);
  });

  it('should populate the filled data in the correct order, when dragging the fill handle downward (selection from right to left)', () => {
    handsontable({
      data: [
        [null, null, null, null],
        [null, 2, 3, null],
        [null, 1, 4, null],
        [null, 0, 5, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
      ]
    });

    selectCell(3, 2, 1, 1);
    spec().$container.find('.wtBorder.area.corner').simulate('mousedown');
    $(getCell(7, 2)).simulate('mouseover').simulate('mouseup');

    expect(getData()).toEqual([
      [null, null, null, null],
      [null, 2, 3, null],
      [null, 1, 4, null],
      [null, 0, 5, null],
      [null, 2, 3, null],
      [null, 1, 4, null],
      [null, 0, 5, null],
      [null, 2, 3, null],
    ]);
  });

  it('should populate the filled data in the correct order, when dragging the fill handle towards left (selection from left to right)', () => {
    handsontable({
      data: [
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, 0, 1, 2, null],
        [null, null, null, null, 3, 4, 5, null],
        [null, null, null, null, null, null, null, null],
      ]
    });

    selectCell(1, 4, 2, 6);
    spec().$container.find('.wtBorder.area.corner').simulate('mousedown');
    $(getCell(2, 0)).simulate('mouseover').simulate('mouseup');

    expect(getData()).toEqual([
      [null, null, null, null, null, null, null, null],
      [2, 0, 1, 2, 0, 1, 2, null],
      [5, 3, 4, 5, 3, 4, 5, null],
      [null, null, null, null, null, null, null, null],
    ]);
  });

  it('should populate the filled data in the correct order, when dragging the fill handle towards left (selection from right to left)', () => {
    handsontable({
      data: [
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, 0, 1, 2, null],
        [null, null, null, null, 3, 4, 5, null],
        [null, null, null, null, null, null, null, null],
      ]
    });

    selectCell(2, 6, 1, 4);
    spec().$container.find('.wtBorder.area.corner').simulate('mousedown');
    $(getCell(2, 0)).simulate('mouseover').simulate('mouseup');

    expect(getData()).toEqual([
      [null, null, null, null, null, null, null, null],
      [2, 0, 1, 2, 0, 1, 2, null],
      [5, 3, 4, 5, 3, 4, 5, null],
      [null, null, null, null, null, null, null, null],
    ]);
  });

  it('should populate the filled data in the correct order, when dragging the fill handle towards right (selection from left to right)', () => {
    handsontable({
      data: [
        [null, null, null, null, null, null, null, null],
        [null, 0, 1, 2, null, null, null, null],
        [null, 3, 4, 5, null, null, null, null],
        [null, null, null, null, null, null, null, null],
      ]
    });

    selectCell(1, 1, 2, 3);
    spec().$container.find('.wtBorder.area.corner').simulate('mousedown');
    $(getCell(2, 7)).simulate('mouseover').simulate('mouseup');

    expect(getData()).toEqual([
      [null, null, null, null, null, null, null, null],
      [null, 0, 1, 2, 0, 1, 2, 0],
      [null, 3, 4, 5, 3, 4, 5, 3],
      [null, null, null, null, null, null, null, null],
    ]);
  });

  it('should populate the filled data in the correct order, when dragging the fill handle towards right (selection from right to left)', () => {
    handsontable({
      data: [
        [null, null, null, null, null, null, null, null],
        [null, 0, 1, 2, null, null, null, null],
        [null, 3, 4, 5, null, null, null, null],
        [null, null, null, null, null, null, null, null],
      ]
    });

    selectCell(2, 3, 1, 1);
    spec().$container.find('.wtBorder.area.corner').simulate('mousedown');
    $(getCell(2, 7)).simulate('mouseover').simulate('mouseup');

    expect(getData()).toEqual([
      [null, null, null, null, null, null, null, null],
      [null, 0, 1, 2, 0, 1, 2, 0],
      [null, 3, 4, 5, 3, 4, 5, 3],
      [null, null, null, null, null, null, null, null],
    ]);
  });

  it('should omit data propagation for hidden cells - fill vertically (option `copyPasteEnabled` set to `false` for the both plugins)', () => {
    handsontable({
      data: [
        [0, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1],
        [2, 2, null, null, null, null],
        [3, 3, null, null, null, null]
      ],
      hiddenColumns: {
        copyPasteEnabled: false,
        indicators: true,
        columns: [1]
      },
      hiddenRows: {
        copyPasteEnabled: false,
        rows: [1],
        indicators: true
      },
    });

    selectCell(0, 0, 0, 2);

    spec().$container.find('.wtBorder.area.corner').simulate('mousedown');
    $(getCell(2, 2, true)).simulate('mouseover').simulate('mouseup');

    expect(getDataAtCell(0, 0)).toEqual(0);
    expect(getDataAtCell(0, 1)).toEqual(0);
    expect(getDataAtCell(0, 2)).toEqual(0);

    expect(getDataAtCell(1, 0)).toEqual(1); // Hidden row, no real change.
    expect(getDataAtCell(1, 1)).toEqual(1); // Hidden column and row, no real change.
    expect(getDataAtCell(1, 2)).toEqual(1); // Hidden row, no real change.

    expect(getDataAtCell(2, 0)).toEqual(0);
    expect(getDataAtCell(2, 1)).toEqual(2); // Hidden column, no real change.
    expect(getDataAtCell(2, 2)).toEqual(0);

    expect(getData()).toEqual([
      [0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1],
      [0, 2, 0, null, null, null],
      [3, 3, null, null, null, null]
    ]); // Extra test for checking wrong data propagation.
  });

  it('should propagate data for hidden cells - fill vertically (option `copyPasteEnabled` set to `true` for the both plugins)', () => {
    handsontable({
      data: [
        [0, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1],
        [2, 2, null, null, null, null],
        [3, 3, null, null, null, null]
      ],
      hiddenColumns: {
        copyPasteEnabled: true,
        indicators: true,
        columns: [1]
      },
      hiddenRows: {
        copyPasteEnabled: true,
        rows: [1],
        indicators: true
      },
    });

    selectCell(0, 0, 0, 2);

    spec().$container.find('.wtBorder.area.corner').simulate('mousedown');
    $(getCell(2, 2, true)).simulate('mouseover').simulate('mouseup');

    expect(getDataAtCell(0, 0)).toEqual(0);
    expect(getDataAtCell(0, 1)).toEqual(0);
    expect(getDataAtCell(0, 2)).toEqual(0);

    expect(getDataAtCell(1, 0)).toEqual(0); // Hidden row, there was change.
    expect(getDataAtCell(1, 1)).toEqual(0); // Hidden column and row, there was change.
    expect(getDataAtCell(1, 2)).toEqual(0); // Hidden row, there was change.

    expect(getDataAtCell(2, 0)).toEqual(0);
    expect(getDataAtCell(2, 1)).toEqual(0); // Hidden column, there was change.
    expect(getDataAtCell(2, 2)).toEqual(0);

    expect(getData()).toEqual([
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 1, 1],
      [0, 0, 0, null, null, null],
      [3, 3, null, null, null, null]
    ]); // Extra test for checking wrong data propagation.
  });

  it('should omit data propagation for hidden cells - fill horizontally (option `copyPasteEnabled` set to `false` for the both plugins)', () => {
    handsontable({
      data: [
        [0, 1, 2, 3, 4, 5],
        [0, 1, 2, 3, 4, 5],
        [0, 1, null, null, null, null],
        [0, 1, null, null, null, null]
      ],
      hiddenColumns: {
        copyPasteEnabled: false,
        indicators: true,
        columns: [1]
      },
      hiddenRows: {
        copyPasteEnabled: false,
        rows: [1],
        indicators: true
      },
    });

    selectCell(0, 0, 2, 0);

    spec().$container.find('.wtBorder.area.corner').simulate('mousedown');
    $(getCell(2, 2, true)).simulate('mouseover').simulate('mouseup');

    expect(getDataAtCell(0, 0)).toEqual(0);
    expect(getDataAtCell(1, 0)).toEqual(0);
    expect(getDataAtCell(2, 0)).toEqual(0);

    expect(getDataAtCell(0, 1)).toEqual(1); // Hidden column, no real change.
    expect(getDataAtCell(1, 1)).toEqual(1); // Hidden column and row, no real change.
    expect(getDataAtCell(2, 1)).toEqual(1); // Hidden column, no real change.

    expect(getDataAtCell(0, 2)).toEqual(0);
    expect(getDataAtCell(1, 2)).toEqual(2); // Hidden row, no real change.
    expect(getDataAtCell(2, 2)).toEqual(0);

    expect(getData()).toEqual([
      [0, 1, 0, 3, 4, 5],
      [0, 1, 2, 3, 4, 5],
      [0, 1, 0, null, null, null],
      [0, 1, null, null, null, null]
    ]); // Extra test for checking wrong data propagation.
  });

  it('should propagate data for hidden cells - fill horizontally (option `copyPasteEnabled` set to `true` for the both plugins)', () => {
    handsontable({
      data: [
        [0, 1, 2, 3, 4, 5],
        [0, 1, 2, 3, 4, 5],
        [0, 1, null, null, null, null],
        [0, 1, null, null, null, null]
      ],
      hiddenColumns: {
        copyPasteEnabled: true,
        indicators: true,
        columns: [1]
      },
      hiddenRows: {
        copyPasteEnabled: true,
        rows: [1],
        indicators: true
      },
    });

    selectCell(0, 0, 2, 0);

    spec().$container.find('.wtBorder.area.corner').simulate('mousedown');
    $(getCell(2, 2, true)).simulate('mouseover').simulate('mouseup');

    expect(getDataAtCell(0, 0)).toEqual(0);
    expect(getDataAtCell(1, 0)).toEqual(0);
    expect(getDataAtCell(2, 0)).toEqual(0);

    expect(getDataAtCell(0, 1)).toEqual(0); // Hidden column, there was change.
    expect(getDataAtCell(1, 1)).toEqual(0); // Hidden column and row, there was change.
    expect(getDataAtCell(2, 1)).toEqual(0); // Hidden column, there was change.

    expect(getDataAtCell(0, 2)).toEqual(0);
    expect(getDataAtCell(1, 2)).toEqual(0); // Hidden row, there was change.
    expect(getDataAtCell(2, 2)).toEqual(0);

    expect(getData()).toEqual([
      [0, 0, 0, 3, 4, 5],
      [0, 0, 0, 3, 4, 5],
      [0, 0, 0, null, null, null],
      [0, 1, null, null, null, null]
    ]); // Extra test for checking wrong data propagation.
  });

  describe('should works properly when two or more instances of Handsontable was initialized with ' +
           'other settings (#3257)', () => {
    let getData;
    let $container1;
    let $container2;

    beforeAll(() => {
      getData = () => [
        [1, 2, 3, 4, 5, 6],
        [7, 8, 9, 1, 2, 3],
        [4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 5, 6]
      ];

      $container1 = $('<div id="hot1"></div>').appendTo('body').handsontable({
        data: getData(),
        fillHandle: true
      });

      $container2 = $('<div id="hot2"></div>').appendTo('body').handsontable({
        data: getData(),
        fillHandle: 'horizontal'
      });
    });

    it('checking drag vertically on 1. instance of Handsontable - should change cell value', () => {
      $container1.handsontable('selectCell', 0, 0);
      $container1.find('.wtBorder.current.corner').simulate('mousedown');
      $container1.find('tbody tr:eq(1) td:eq(0)').simulate('mouseover').simulate('mouseup');

      expect($container1.handsontable('getDataAtCell', 1, 0)).toEqual(1);
    });

    describe('-> updating settings on 2. instance of Handsontable', () => {
      beforeAll(() => {
        $container2.handsontable('updateSettings', { fillHandle: 'vertical' });
      });

      it('checking drag vertically on 2. instance of Handsontable - should change cell value', () => {
        $container2.handsontable('selectCell', 0, 2);
        $container2.find('.wtBorder.current.corner').simulate('mousedown');
        $container2.find('tbody tr:eq(1) td:eq(2)').simulate('mouseover').simulate('mouseup');

        expect($container2.handsontable('getDataAtCell', 1, 2)).toEqual(3);
      });
    });

    afterAll(() => {
      // destroing containers

      $container1.handsontable('destroy');
      $container1.remove();

      $container2.handsontable('destroy');
      $container2.remove();
    });
  });

  it('should run afterAutofill once after each set of autofill changes have been applied', () => {
    const afterAutofill = jasmine.createSpy('afterAutofill');

    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [7, 8, 9, 1, 2, 3],
        [4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 5, 6]
      ],
      afterAutofill
    });

    selectCell(0, 0);
    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tbody tr:eq(0) td:eq(1)').simulate('mouseover').simulate('mouseup');

    expect(afterAutofill).toHaveBeenCalledTimes(1);

    selectCell(0, 0);
    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tbody tr:eq(1) td:eq(0)').simulate('mouseover').simulate('mouseup');

    expect(getDataAtCell(1, 0)).toEqual(1);

    expect(afterAutofill).toHaveBeenCalledTimes(2);
  });

  it('should not call afterAutofill if beforeAutofill returns false', () => {
    const afterAutofill = jasmine.createSpy('afterAutofill');

    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      beforeAutofill() {
        return false;
      },
      afterAutofill,
    });

    selectCell(0, 0);
    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tbody tr:eq(0) td:eq(1)').simulate('mouseover').simulate('mouseup');

    expect(afterAutofill).toHaveBeenCalledTimes(0);

    selectCell(0, 0);
    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tbody tr:eq(1) td:eq(0)').simulate('mouseover').simulate('mouseup');

    expect(afterAutofill).toHaveBeenCalledTimes(0);
  });

  it('should not call beforeAutofill and afterAutofill if we return to the cell from where we start', () => {
    const beforeAutofill = jasmine.createSpy('beforeAutofill');
    const afterAutofill = jasmine.createSpy('afterAutofill');

    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      beforeAutofill,
      afterAutofill,
      fillHandle: {
        direction: 'vertical'
      }
    });

    selectCell(0, 0);
    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tbody tr:eq(1) td:eq(0)').simulate('mouseover');
    spec().$container.find('tbody tr:eq(0) td:eq(0)').simulate('mouseover').simulate('mouseup');

    expect(beforeAutofill).toHaveBeenCalledTimes(0);
    expect(afterAutofill).toHaveBeenCalledTimes(0);
  });

  it('should not change cell value if we return to the cell from where we start (when fillHandle option is set to `vertical`)', () => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [7, 8, 9, 1, 2, 3],
        [4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: 'vertical'
    });

    selectCell(0, 0);
    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tbody tr:eq(1) td:eq(0)').simulate('mouseover');
    spec().$container.find('tbody tr:eq(0) td:eq(0)').simulate('mouseover').simulate('mouseup');

    expect(getDataAtCell(0, 0)).toEqual(1);
    expect(getDataAtCell(1, 0)).toEqual(7);
  });

  it('should autofill the appropriate cells, when performing the action over date-typed cells', async() => {
    const errorSpy = jasmine.createSpyObj('error', ['test']);
    const prevError = window.onerror;

    handsontable({
      data: [
        ['', '03/05/2020'],
        ['', '27/03/2020'],
        ['', '29/08/2020']
      ],
      columns: [
        {},
        { type: 'date' }
      ]
    });

    window.onerror = errorSpy.test;

    selectCell(0, 1);

    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');

    spec().$container.find(
      '.ht_master tbody tr:nth-child(3) td:nth-of-type(2)'
    ).simulate('mouseover').simulate('mouseup');

    await sleep(300);

    expect(errorSpy.test).not.toHaveBeenCalled();

    expect(getDataAtCell(1, 1)).toEqual('03/05/2020');
    expect(getDataAtCell(2, 1)).toEqual('03/05/2020');

    window.onerror = prevError;
  });

  describe('fill border position', () => {
    it('display the fill border in the correct position', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        fillHandle: true
      });

      selectCell(3, 3, 5, 5);

      spec().$container.find('.wtBorder.current.corner').simulate('mousedown');

      spec().$container.find('.ht_master tbody tr').eq(2).find('td').eq(3).simulate('mouseover');

      expect(Handsontable.dom.hasClass(getCell(2, 3), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(2, 4), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(2, 5), 'fill')).toBe(true);

      spec().$container.find('.ht_master tbody tr').eq(2).find('td').eq(4).simulate('mouseover');

      expect(Handsontable.dom.hasClass(getCell(2, 3), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(2, 4), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(2, 5), 'fill')).toBe(true);

      spec().$container.find('.ht_master tbody tr').eq(2).find('td').eq(5).simulate('mouseover');

      expect(Handsontable.dom.hasClass(getCell(2, 3), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(2, 4), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(2, 5), 'fill')).toBe(true);

      spec().$container.find('.ht_master tbody tr').eq(3).find('td').eq(2).simulate('mouseover');

      expect(Handsontable.dom.hasClass(getCell(3, 2), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(4, 2), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(5, 2), 'fill')).toBe(true);

      spec().$container.find('.ht_master tbody tr').eq(4).find('td').eq(2).simulate('mouseover');

      expect(Handsontable.dom.hasClass(getCell(3, 2), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(4, 2), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(5, 2), 'fill')).toBe(true);

      spec().$container.find('.ht_master tbody tr').eq(5).find('td').eq(2).simulate('mouseover');

      expect(Handsontable.dom.hasClass(getCell(3, 2), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(4, 2), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(5, 2), 'fill')).toBe(true);

      spec().$container.find('.ht_master tbody tr').eq(6).find('td').eq(3).simulate('mouseover');

      expect(Handsontable.dom.hasClass(getCell(6, 3), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(6, 4), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(6, 5), 'fill')).toBe(true);

      spec().$container.find('.ht_master tbody tr').eq(6).find('td').eq(4).simulate('mouseover');

      expect(Handsontable.dom.hasClass(getCell(5, 3), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(5, 4), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(6, 5), 'fill')).toBe(true);

      spec().$container.find('.ht_master tbody tr').eq(6).find('td').eq(5).simulate('mouseover');

      expect(Handsontable.dom.hasClass(getCell(5, 3), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(5, 4), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(6, 5), 'fill')).toBe(true);

      spec().$container.find('.ht_master tbody tr').eq(3).find('td').eq(6).simulate('mouseover');

      expect(Handsontable.dom.hasClass(getCell(3, 6), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(4, 6), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(5, 6), 'fill')).toBe(true);

      spec().$container.find('.ht_master tbody tr').eq(4).find('td').eq(6).simulate('mouseover');

      expect(Handsontable.dom.hasClass(getCell(3, 6), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(4, 6), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(5, 6), 'fill')).toBe(true);

      spec().$container.find('.ht_master tbody tr').eq(5).find('td').eq(6).simulate('mouseover');

      expect(Handsontable.dom.hasClass(getCell(3, 6), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(4, 6), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(5, 6), 'fill')).toBe(true);

      spec().$container.find('.ht_master tbody tr').eq(2).find('td').eq(2).simulate('mouseover');

      expect(Handsontable.dom.hasClass(getCell(2, 3), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(2, 4), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(2, 5), 'fill')).toBe(true);

      spec().$container.find('.ht_master tbody tr').eq(2).find('td').eq(6).simulate('mouseover');

      expect(Handsontable.dom.hasClass(getCell(2, 3), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(2, 4), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(2, 5), 'fill')).toBe(true);

      spec().$container.find('.ht_master tbody tr').eq(6).find('td').eq(2).simulate('mouseover');

      expect(Handsontable.dom.hasClass(getCell(6, 3), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(6, 4), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(6, 5), 'fill')).toBe(true);

      spec().$container.find('.ht_master tbody tr').eq(6).find('td').eq(6).simulate('mouseover');

      expect(Handsontable.dom.hasClass(getCell(6, 3), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(6, 4), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(6, 5), 'fill')).toBe(true);

      // Inside of the selection
      spec().$container.find('.ht_master tbody tr').eq(5).find('td').eq(4).simulate('mouseover');

      expect(Handsontable.dom.hasClass(getCell(3, 3), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(3, 4), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(4, 3), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(4, 4), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(5, 3), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(5, 4), 'fill')).toBe(true);
    });
  });
});
