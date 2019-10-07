describe('HiddenRows', () => {
  const id = 'testContainer';

  function getMultilineData(rows, cols) {
    const data = Handsontable.helper.createSpreadsheetData(rows, cols);

    // Column C
    data[0][2] += '\nline';
    data[1][2] += '\nline\nline';

    return data;
  }

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should hide rows if "hiddenRows" property is set as `true`', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 10),
      hiddenRows: {
        rows: [2, 4]
      },
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

    expect(hot.getRowHeight(1)).not.toBeDefined();
    expect(hot.getRowHeight(2)).toEqual(0.1);
    expect(hot.getRowHeight(4)).toEqual(0.1);
    expect(hot.getRowHeight(5)).not.toBeDefined();
  });

  it('should hide rows if "hiddenRows" property is set as `true` and rowHeaders is set as `false`', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 10),
      hiddenRows: {
        rows: [2, 4]
      },
      rowHeaders: false,
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

    expect(hot.getRowHeight(1)).not.toBeDefined();
    expect(hot.getRowHeight(2)).toEqual(0.1);
    expect(hot.getRowHeight(4)).toEqual(0.1);
    expect(hot.getRowHeight(5)).not.toBeDefined();
  });

  it('should return to default state after call disablePlugin method', () => {
    const hot = handsontable({
      data: getMultilineData(10, 10),
      hiddenRows: {
        rows: [2, 4]
      },
      cells(row, col) {
        const meta = {};

        if (col === 2) {
          meta.type = 'date';
        }

        return meta;
      },
      width: 500,
      height: 300
    });
    hot.getPlugin('hiddenRows').disablePlugin();

    // undefined as default value - not hidden
    expect(hot.getRowHeight(1)).not.toBeDefined();
    expect(hot.getRowHeight(2)).not.toBeDefined();
    expect(hot.getRowHeight(4)).not.toBeDefined();
    expect(hot.getRowHeight(5)).not.toBeDefined();
  });

  it('should hide rows after call enablePlugin method', () => {
    const hot = handsontable({
      data: getMultilineData(5, 10),
      hiddenRows: {
        rows: [2, 4]
      },
      cells(row, col) {
        const meta = {};

        if (col === 2) {
          meta.type = 'date';
        }

        return meta;
      },
      width: 500,
      height: 300
    });
    hot.getPlugin('hiddenRows').disablePlugin();
    hot.getPlugin('hiddenRows').enablePlugin();

    expect(hot.getRowHeight(1)).not.toBeDefined();
    expect(hot.getRowHeight(2)).toBe(0.1);
    expect(hot.getRowHeight(4)).toBe(0.1);
    expect(hot.getRowHeight(5)).not.toBeDefined();
  });

  it('should update settings after call updateSettings method', () => {
    const hot = handsontable({
      data: getMultilineData(10, 10),
      hiddenRows: {
        rows: [2, 4]
      },
      cells(row, col) {
        const meta = {};

        if (col === 2) {
          meta.type = 'date';
        }

        return meta;
      },
      width: 500,
      height: 300
    });
    hot.updateSettings({
      hiddenRows: { rows: [1] }
    });

    // undefined as default value - not hidden
    expect(hot.getRowHeight(0)).not.toBeDefined();
    expect(hot.getRowHeight(1)).toBe(0.1);
    expect(hot.getRowHeight(2)).not.toBeDefined();
    expect(hot.getRowHeight(4)).not.toBeDefined();
    expect(hot.getRowHeight(5)).not.toBeDefined();
  });

  it('should hide row after call hideRow method', () => {
    const hot = handsontable({
      data: getMultilineData(5, 10),
      hiddenRows: true,
      width: 500,
      height: 300
    });

    expect(hot.getRowHeight(2)).not.toBeDefined();

    hot.getPlugin('hiddenRows').hideRow(2);
    hot.render();

    expect(hot.getRowHeight(2)).toBe(0.1);
  });

  it('should change hiding position following the hidden row position', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      hiddenRows: {
        rows: [0],
        indicators: true
      },
      width: 500,
      height: 300
    });

    expect(getPlugin('hiddenRows').isHidden(0, true)).toBeTruthy();
    expect(getPlugin('hiddenRows').isHidden(0)).toBeTruthy();

    // changing row sequence: 0 <-> 4
    updateSettings({ columnSorting: { initialConfig: { column: 0, sortOrder: 'desc' } } });

    expect(getPlugin('hiddenRows').isHidden(4, true)).toBeTruthy();
    expect(getPlugin('hiddenRows').isHidden(0)).toBeTruthy();
  });

  it('should show row after call showRow method', () => {
    const hot = handsontable({
      data: getMultilineData(5, 10),
      hiddenRows: {
        rows: [2]
      },
      width: 500,
      height: 300
    });

    expect(hot.getRowHeight(2)).toBe(0.1);

    hot.getPlugin('hiddenRows').showRow(2);
    hot.render();

    expect(hot.getRowHeight(2)).not.toBeDefined();
  });

  it('should show the hidden row indicators if "indicators" property is set to `true`', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 10),
      hiddenRows: {
        rows: [2, 4],
        indicators: true
      },
      rowHeaders: true,
      width: 500,
      height: 300
    });
    const trs = hot.view.wt.wtTable.TBODY.childNodes;

    expect(Handsontable.dom.hasClass(trs[1].firstChild, 'beforeHiddenRow')).toBe(true);
    expect(Handsontable.dom.hasClass(trs[2], 'hide')).toBe(true);
    expect(Handsontable.dom.hasClass(trs[3].firstChild, 'beforeHiddenRow')).toBe(true);
    expect(Handsontable.dom.hasClass(trs[3].firstChild, 'afterHiddenRow')).toBe(true);
    expect(Handsontable.dom.hasClass(trs[4], 'hide')).toBe(true);
    expect(Handsontable.dom.hasClass(trs[5].firstChild, 'afterHiddenRow')).toBe(true);
  });

  it('should not throw any errors, when selecting a whole column with the last row hidden', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      hiddenRows: {
        rows: [3]
      },
      colHeaders: true
    });

    let errorThrown = false;

    try {
      hot.selectCell(0, 2, 3, 2);

    } catch (err) {
      errorThrown = true;
    }

    expect(errorThrown).toBe(false);
  });

  describe('alter table', () => {
    it('should recalculate index of the hidden rows after insert rows', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 10),
        hiddenRows: {
          rows: [3]
        },
        width: 500,
        height: 300
      });

      const plugin = hot.getPlugin('hiddenRows');
      hot.alter('insert_row', 0, 2);

      expect(plugin.hiddenRows[0]).toEqual(5);
    });

    it('should recalculate index of the hidden rows after remove rows', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 10),
        hiddenRows: {
          rows: [3]
        },
        width: 500,
        height: 300
      });

      const plugin = hot.getPlugin('hiddenRows');
      hot.alter('remove_row', 0, 2);

      expect(plugin.hiddenRows[0]).toEqual(1);
    });
  });

  describe('copy-paste functionality', () => {
    class DataTransferObject {
      constructor() {
        this.data = {
          'text/plain': '',
          'text/html': ''
        };
      }
      getData(type) {
        return this.data[type];
      }
      setData(type, value) {
        this.data[type] = value;
      }
    }

    function getClipboardEventMock() {
      const event = {};
      event.clipboardData = new DataTransferObject();
      event.preventDefault = () => {};
      return event;
    }

    it('should allow to copy hidden rows, when "copyPasteEnabled" property is not set', () => {
      const hot = handsontable({
        data: getMultilineData(10, 10),
        hiddenRows: {
          rows: [
            2,
            4]
        },
        width: 500,
        height: 300
      });

      const copyEvent = getClipboardEventMock('copy');
      const plugin = hot.getPlugin('CopyPaste');

      selectCell(0, 0, 4, 9);

      plugin.setCopyableText();
      plugin.onCopy(copyEvent);

      /* eslint-disable no-tabs */
      expect(copyEvent.clipboardData.getData('text/plain')).toEqual('A1	B1	"C1\n' +
        'line"	D1	E1	F1	G1	H1	I1	J1\n' +
        'A2	B2	"C2\n' +
        'line\n' +
        'line"	D2	E2	F2	G2	H2	I2	J2\n' +
        'A3	B3	C3	D3	E3	F3	G3	H3	I3	J3\n' +
        'A4	B4	C4	D4	E4	F4	G4	H4	I4	J4\n' +
        'A5	B5	C5	D5	E5	F5	G5	H5	I5	J5\n' +
        'A6	B6	C6	D6	E6	F6	G6	H6	I6	J6'
      );
    });

    it('should allow to copy hidden rows, when "copyPasteEnabled" property is set to `true`', () => {
      const hot = handsontable({
        data: getMultilineData(10, 10),
        hiddenRows: {
          rows: [2, 4],
          copyPasteEnabled: true
        },
        width: 500,
        height: 300
      });

      const copyEvent = getClipboardEventMock('copy');
      const plugin = hot.getPlugin('CopyPaste');

      selectCell(0, 0, 4, 9);

      plugin.setCopyableText();
      plugin.onCopy(copyEvent);

      /* eslint-disable no-tabs */
      expect(copyEvent.clipboardData.getData('text/plain')).toEqual('A1	B1	"C1\n' +
        'line"	D1	E1	F1	G1	H1	I1	J1\n' +
        'A2	B2	"C2\n' +
        'line\n' +
        'line"	D2	E2	F2	G2	H2	I2	J2\n' +
        'A3	B3	C3	D3	E3	F3	G3	H3	I3	J3\n' +
        'A4	B4	C4	D4	E4	F4	G4	H4	I4	J4\n' +
        'A5	B5	C5	D5	E5	F5	G5	H5	I5	J5\n' +
        'A6	B6	C6	D6	E6	F6	G6	H6	I6	J6'
      );
    });

    it('should skip hidden rows, while copying data, when "copyPasteEnabled" property is set to `false`', () => {
      const hot = handsontable({
        data: getMultilineData(10, 10),
        hiddenRows: {
          rows: [2, 4],
          copyPasteEnabled: false
        },
        width: 500,
        height: 300
      });

      const copyEvent = getClipboardEventMock('copy');
      const plugin = hot.getPlugin('CopyPaste');

      selectCell(0, 0, 4, 9);

      plugin.setCopyableText();
      plugin.onCopy(copyEvent);

      /* eslint-disable no-tabs */
      expect(copyEvent.clipboardData.getData('text/plain')).toEqual('A1	B1	"C1\n' +
        'line"	D1	E1	F1	G1	H1	I1	J1\n' +
        'A2	B2	"C2\n' +
        'line\n' +
        'line"	D2	E2	F2	G2	H2	I2	J2\n' +
        'A4	B4	C4	D4	E4	F4	G4	H4	I4	J4\n' +
        'A6	B6	C6	D6	E6	F6	G6	H6	I6	J6'
      );
    });

    it('should skip hidden rows, while pasting data, when "copyPasteEnabled" property is set to `false`', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 5),
        hiddenRows: {
          rows: [2, 4],
          copyPasteEnabled: false
        },
        width: 500,
        height: 300
      });

      selectCell(0, 0);

      const plugin = hot.getPlugin('CopyPaste');

      plugin.paste('a\tb\nc\td\ne\tf\ng\th\ni\tj');

      expect(getDataAtRow(0)).toEqual(['a', 'b', 'C1', 'D1', 'E1']);
      expect(getDataAtRow(1)).toEqual(['c', 'd', 'C2', 'D2', 'E2']);
      expect(getDataAtRow(2)).toEqual(['A3', 'B3', 'C3', 'D3', 'E3']);
      expect(getDataAtRow(3)).toEqual(['e', 'f', 'C4', 'D4', 'E4']);
      expect(getDataAtRow(4)).toEqual(['A5', 'B5', 'C5', 'D5', 'E5']);
      expect(getDataAtRow(5)).toEqual(['g', 'h', 'C6', 'D6', 'E6']);
    });
  });

  describe('navigation', () => {
    it('should ignore hidden rows while navigating by arrow keys', () => {
      handsontable({
        data: getMultilineData(10, 10),
        hiddenRows: {
          rows: [2, 4]
        },
        width: 500,
        height: 300
      });

      selectCell(0, 0, 0, 0);
      keyDownUp(Handsontable.helper.KEY_CODES.ARROW_DOWN);

      expect(getSelected()).toEqual([[1, 0, 1, 0]]);

      keyDownUp(Handsontable.helper.KEY_CODES.ARROW_DOWN);

      expect(getSelected()).toEqual([[3, 0, 3, 0]]);

      keyDownUp(Handsontable.helper.KEY_CODES.ARROW_DOWN);

      expect(getSelected()).toEqual([[5, 0, 5, 0]]);
    });

    it('should properly highlight selected cell', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        hiddenRows: {
          rows: [0]
        },
        mergeCells: [
          { row: 1, col: 1, colspan: 2, rowspan: 2 }
        ],
        colHeaders: true
      });

      selectCell(3, 1, 3, 1);
      keyDownUp(Handsontable.helper.KEY_CODES.ARROW_UP);
      keyDownUp(Handsontable.helper.KEY_CODES.ARROW_UP);
      keyDownUp(Handsontable.helper.KEY_CODES.ARROW_UP);

      expect(hot.getSelectedRange()[0].highlight.row).toBe(1);
    });
  });

  describe('context-menu', () => {
    it('should be visible "Hide row" on context menu when row is selected by header', () => {
      handsontable({
        data: getMultilineData(10, 10),
        hiddenRows: true,
        width: 500,
        height: 300,
        contextMenu: ['hidden_rows_hide', 'hidden_rows_show'],
        rowHeaders: true
      });

      const header = $('.ht_clone_left tr:eq(0) th:eq(0)');
      header.simulate('mousedown');
      header.simulate('mouseup');
      contextMenu();

      const items = $('.htContextMenu tbody td');
      const actions = items.not('.htSeparator');

      expect(actions.text()).toEqual('Hide row');
    });

    it('should be NOT visible "Hide row" on context menu when row is selected by header', () => {
      handsontable({
        data: getMultilineData(5, 10),
        hiddenRows: true,
        width: 500,
        height: 300,
        contextMenu: ['hidden_rows_hide', 'hidden_rows_show'],
        rowHeaders: true
      });

      selectCell(0, 0);
      contextMenu();

      const items = $('.htContextMenu tbody td');
      const actions = items.not('.htSeparator');

      expect(actions.length).toEqual(1);
      expect(actions.text()).toEqual([
        'No available options',
      ].join(''));
    });

    it('should hide selected columns by "Hide row" in context menu', () => {
      const hot = handsontable({
        data: getMultilineData(10, 10),
        hiddenRows: true,
        width: 500,
        height: 300,
        contextMenu: ['hidden_rows_hide', 'hidden_rows_show'],
        rowHeaders: true
      });

      const header = $('.ht_clone_left');

      header.find('tr:eq(3) th:eq(0)').simulate('mousedown');
      header.find('tr:eq(4) th:eq(0)').simulate('mouseover');
      header.find('tr:eq(4) th:eq(0)').simulate('mouseup');

      contextMenu();

      const items = $('.htContextMenu tbody td');
      const actions = items.not('.htSeparator');

      actions.simulate('mousedown').simulate('mouseup');

      expect(hot.getRowHeight(3)).toBe(0.1);
      expect(hot.getRowHeight(4)).toBe(0.1);
    });

    it('should show hidden rows by context menu', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenRows: {
          rows: [2, 3]
        },
        width: 500,
        height: 300,
        rowHeights: 30,
        contextMenu: ['hidden_rows_show'],
        rowHeaders: true
      });

      const header = $('.ht_clone_left');

      header.find('tr:eq(1) th:eq(0)').simulate('mousedown');
      header.find('tr:eq(4) th:eq(0)').simulate('mouseover');
      header.find('tr:eq(4) th:eq(0)').simulate('mouseup');

      contextMenu();

      const items = $('.htContextMenu tbody td');
      const actions = items.not('.htSeparator');

      actions.simulate('mousedown').simulate('mouseup');

      expect(hot.getRowHeight(2)).toBe(30);
      expect(hot.getRowHeight(3)).toBe(30);
    });
  });

  describe('manualRowMove', () => {
    it('should properly render hidden ranges after moving action', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 10),
        hiddenRows: {
          rows: [3]
        },
        width: 500,
        height: 300,
        manualRowMove: true
      });
      const hiddenRows = hot.getPlugin('hiddenRows');
      const manualRowMove = hot.getPlugin('manualRowMove');

      manualRowMove.moveRows([0, 1], 4);
      hot.render();

      expect(hiddenRows.hiddenRows[0]).toEqual(3);
      expect(hot.getRowHeight(1)).toEqual(0.1);
    });
  });

  describe('maxRows option set', () => {
    it('should return properly data after hiding', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        maxRows: 5,
        hiddenRows: {
          rows: [1, 2]
        }
      });

      expect(getData().length).toEqual(5);
      expect(getDataAtCell(3, 1)).toEqual('B4');
    });
  });

  describe('plugin hooks', () => {
    describe('beforeHideRows', () => {
      it('should fire the `beforeHideRows` hook before hiding a single row by plugin API', () => {
        const beforeHideRowsHookCallback = jasmine.createSpy('beforeHideRowsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: true,
          beforeHideRows: beforeHideRowsHookCallback
        });

        getPlugin('hiddenRows').hideRow(2);

        expect(beforeHideRowsHookCallback).toHaveBeenCalledWith([], [2], true, void 0, void 0, void 0);
      });

      it('should fire the `beforeHideRows` hook before hiding multiple rows by plugin API', () => {
        const beforeHideRowsHookCallback = jasmine.createSpy('beforeHideRowsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: true,
          beforeHideRows: beforeHideRowsHookCallback
        });

        getPlugin('hiddenRows').hideRows([2, 3, 4]);

        expect(beforeHideRowsHookCallback).toHaveBeenCalledWith([], [2, 3, 4], true, void 0, void 0, void 0);
      });

      it('should be possible to cancel the hiding action by returning `false` from the `beforeHideRows` hook', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: true,
          beforeHideRows: () => false
        });

        getPlugin('hiddenRows').hideRow(2);

        expect(getPlugin('hiddenRows').isHidden(2)).toBeFalsy();
      });

      it('should not perform hiding and return `false` as the third parameter of the `beforeHideRows` hook' +
        ' if any of the provided rows is out of scope of the table', () => {
        const beforeHideRowsHookCallback = jasmine.createSpy('beforeHideRowsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: true,
          beforeHideRows: beforeHideRowsHookCallback
        });

        const plugin = getPlugin('hiddenRows');
        plugin.hideRows([0, 5, 10, 15]);

        expect(beforeHideRowsHookCallback).toHaveBeenCalledWith([], [], false, void 0, void 0, void 0);
        expect(plugin.isHidden(0)).toBeFalsy();
        expect(plugin.isHidden(5)).toBeFalsy();
        expect(plugin.isHidden(10)).toBeFalsy();
      });

      it('should not perform hiding and return `false` as the third parameter of the `beforeHideRows` hook' +
        ' if any of the provided rows is not integer', () => {
        const beforeHideRowsHookCallback = jasmine.createSpy('beforeHideRowsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: true,
          beforeHideRows: beforeHideRowsHookCallback
        });

        const plugin = getPlugin('hiddenRows');
        plugin.hideRows([0, 5, 1.1]);

        expect(beforeHideRowsHookCallback).toHaveBeenCalledWith([], [], false, void 0, void 0, void 0);
        expect(plugin.isHidden(0)).toBeFalsy();
        expect(plugin.isHidden(5)).toBeFalsy();
      });
    });

    describe('afterHideRows', () => {
      it('should fire the `afterHideRows` hook after hiding a single row by plugin API', () => {
        const afterHideRowsHookCallback = jasmine.createSpy('afterHideRowsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: true,
          afterHideRows: afterHideRowsHookCallback
        });

        getPlugin('hiddenRows').hideRow(2);

        expect(afterHideRowsHookCallback).toHaveBeenCalledWith([], [2], true, true, void 0, void 0);
      });

      it('should fire the `afterHideRows` hook after hiding multiple rows by plugin API', () => {
        const afterHideRowsHookCallback = jasmine.createSpy('afterHideRowsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: true,
          afterHideRows: afterHideRowsHookCallback
        });

        getPlugin('hiddenRows').hideRows([2, 3, 4]);

        expect(afterHideRowsHookCallback).toHaveBeenCalledWith([], [2, 3, 4], true, true, void 0, void 0);
      });

      it('it should NOT fire the `afterHideRows` hook, if the `beforeHideRows` hook returned false', () => {
        const afterHideRowsHookCallback = jasmine.createSpy('afterHideRowsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: true,
          beforeHideRows: () => false,
          afterHideRows: afterHideRowsHookCallback
        });

        getPlugin('hiddenRows').hideRows([2, 3, 4]);

        expect(afterHideRowsHookCallback).not.toHaveBeenCalled();
      });

      it('should return `false` as the fourth parameter, if the hiding action did not change the state of the hiddenRows plugin', () => {
        const afterHideRowsHookCallback = jasmine.createSpy('afterHideRowsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: {
            rows: [0, 5]
          },
          afterHideRows: afterHideRowsHookCallback
        });

        const plugin = getPlugin('hiddenRows');
        plugin.hideRows([0, 5]);

        expect(afterHideRowsHookCallback).toHaveBeenCalledWith([0, 5], [0, 5], true, false, void 0, void 0);
      });

      it('should return `true` as the third and fourth parameter, if the hiding action changed the state of the hiddenRows plugin', () => {
        const afterHideRowsHookCallback = jasmine.createSpy('afterHideRowsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: {
            rows: [0, 5]
          },
          afterHideRows: afterHideRowsHookCallback
        });

        const plugin = getPlugin('hiddenRows');
        plugin.hideRows([0, 5, 6]);

        expect(afterHideRowsHookCallback).toHaveBeenCalledWith([0, 5], [0, 5, 6], true, true, void 0, void 0);
      });

      it('should not perform hiding and return `false` as the third and fourth parameter of the `afterHideRows` hook' +
        ' if any of the provided rows is out of scope of the table', () => {
        const afterHideRowsHookCallback = jasmine.createSpy('afterHideRowsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: true,
          afterHideRows: afterHideRowsHookCallback
        });

        const plugin = getPlugin('hiddenRows');
        plugin.hideRows([0, 5, 10, 15]);

        expect(afterHideRowsHookCallback).toHaveBeenCalledWith([], [], false, false, void 0, void 0);
        expect(plugin.isHidden(0)).toBeFalsy();
        expect(plugin.isHidden(5)).toBeFalsy();
        expect(plugin.isHidden(10)).toBeFalsy();
      });

      it('should not perform hiding and return `false` as the third and fourth parameter of the `afterHideRows` hook' +
        ' if any of the provided rows is not integer', () => {
        const afterHideRowsHookCallback = jasmine.createSpy('afterHideRowsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: true,
          afterHideRows: afterHideRowsHookCallback
        });

        const plugin = getPlugin('hiddenRows');
        plugin.hideRows([0, 5, 1.1]);

        expect(afterHideRowsHookCallback).toHaveBeenCalledWith([], [], false, false, void 0, void 0);
        expect(plugin.isHidden(0)).toBeFalsy();
        expect(plugin.isHidden(5)).toBeFalsy();
      });
    });

    describe('beforeUnhideRows', () => {
      it('should fire the `beforeUnhideRows` hook before unhiding a single, previously hidden row', () => {
        const beforeUnhideRowsHookCallback = jasmine.createSpy('beforeUnhideRowsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: {
            rows: [2]
          },
          beforeUnhideRows: beforeUnhideRowsHookCallback
        });

        getPlugin('hiddenRows').showRow(2);

        expect(beforeUnhideRowsHookCallback).toHaveBeenCalledWith([2], [], true, void 0, void 0, void 0);
      });

      it('should fire the `beforeUnhideRows` hook before unhiding the multiple, previously hidden rows ', () => {
        const beforeUnhideRowsHookCallback = jasmine.createSpy('beforeUnhideRowsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: {
            rows: [2, 3, 4]
          },
          beforeUnhideRows: beforeUnhideRowsHookCallback
        });

        getPlugin('hiddenRows').showRows([2, 3, 4]);

        expect(beforeUnhideRowsHookCallback).toHaveBeenCalledWith([2, 3, 4], [], true, void 0, void 0, void 0);
      });

      it('should be possible to cancel the unhiding action by returning `false` from the `beforeUnhideRows` hook', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: {
            rows: [2, 3, 4]
          },
          beforeUnhideRows: () => false
        });

        getPlugin('hiddenRows').showRow(2);

        expect(getPlugin('hiddenRows').isHidden(2)).toBeTruthy();
      });

      it('should not perform unhiding and return `false` as the third parameter of the `beforeUnhideRows` hook' +
        ' if any of the provided rows is out of scope of the table', () => {
        const beforeUnhideRowsHookCallback = jasmine.createSpy('beforeUnhideRowsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: {
            rows: [0, 5]
          },
          beforeUnhideRows: beforeUnhideRowsHookCallback
        });

        const plugin = getPlugin('hiddenRows');
        plugin.showRows([0, 5, 10, 15]);

        expect(beforeUnhideRowsHookCallback).toHaveBeenCalledWith([0, 5], [0, 5], false, void 0, void 0, void 0);
        expect(plugin.isHidden(0)).toBeTruthy();
        expect(plugin.isHidden(5)).toBeTruthy();
      });

      it('should not perform unhiding and return `false` as the third parameter of the `beforeUnhideRows` hook' +
        ' if any of the provided rows is out of scope of the table', () => {
        const beforeUnhideRowsHookCallback = jasmine.createSpy('beforeUnhideRowsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: {
            rows: [0, 5]
          },
          beforeUnhideRows: beforeUnhideRowsHookCallback
        });

        const plugin = getPlugin('hiddenRows');
        plugin.showRows([0, 5, 10, 15]);

        expect(beforeUnhideRowsHookCallback).toHaveBeenCalledWith([0, 5], [0, 5], false, void 0, void 0, void 0);
        expect(plugin.isHidden(0)).toBeTruthy();
        expect(plugin.isHidden(5)).toBeTruthy();
      });
    });

    describe('afterUnhideRows', () => {
      it('should fire the `afterUnhideRows` hook after unhiding a previously hidden single row', () => {
        const afterUnhideRowsHookCallback = jasmine.createSpy('afterUnhideRowsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: {
            rows: [2]
          },
          afterUnhideRows: afterUnhideRowsHookCallback
        });

        getPlugin('hiddenRows').showRow(2);

        expect(afterUnhideRowsHookCallback).toHaveBeenCalledWith([2], [], true, true, void 0, void 0);
      });

      it('should fire the `afterUnhideRows` hook after unhiding a multiple, previously hidden rows', () => {
        const afterUnhideRowsHookCallback = jasmine.createSpy('afterUnhideRowsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: {
            rows: [2, 3, 4]
          },
          afterUnhideRows: afterUnhideRowsHookCallback
        });

        getPlugin('hiddenRows').showRows([2, 3, 4]);

        expect(afterUnhideRowsHookCallback).toHaveBeenCalledWith([2, 3, 4], [], true, true, void 0, void 0);
      });

      it('it should NOT fire the `afterUnhideRows` hook, if the `beforeUnhideRows` hook returned false', () => {
        const afterUnhideRowsHookCallback = jasmine.createSpy('afterUnhideRowsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: true,
          beforeUnhideRows: () => false,
          afterUnhideRows: afterUnhideRowsHookCallback
        });

        getPlugin('hiddenRows').showRows([2, 3, 4]);

        expect(afterUnhideRowsHookCallback).not.toHaveBeenCalled();
      });

      it('should return `false` as the fourth parameter, if the unhiding action did not change the state of the hiddenRows plugin', () => {
        const afterUnhideRowsHookCallback = jasmine.createSpy('afterUnhideRowsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: true,
          afterUnhideRows: afterUnhideRowsHookCallback
        });

        const plugin = getPlugin('hiddenRows');
        plugin.showRows([0, 5]);

        expect(afterUnhideRowsHookCallback).toHaveBeenCalledWith([], [], true, false, void 0, void 0);
      });

      it('should return `true` as the fourth parameter, if the unhiding action changed the state of the hiddenRows plugin', () => {
        const afterUnhideRowsHookCallback = jasmine.createSpy('afterUnhideRowsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: {
            rows: [0, 5]
          },
          afterUnhideRows: afterUnhideRowsHookCallback
        });

        const plugin = getPlugin('hiddenRows');
        plugin.showRows([0, 5, 6]);

        expect(afterUnhideRowsHookCallback).toHaveBeenCalledWith([0, 5], [], true, true, void 0, void 0);
      });

      it('should not perform hiding and return `false` as the third and fourth parameter of the `afterUnhideRows` hook' +
        ' if any of the provided rows is not integer', () => {
        const afterUnhideRowsHookCallback = jasmine.createSpy('afterUnhideRowsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 7),
          hiddenRows: {
            rows: [0, 5]
          },
          afterUnhideRows: afterUnhideRowsHookCallback
        });

        const plugin = getPlugin('hiddenRows');
        plugin.showRows([0, 5, 1.1]);

        expect(afterUnhideRowsHookCallback).toHaveBeenCalledWith([0, 5], [0, 5], false, false, void 0, void 0);
        expect(plugin.isHidden(0)).toBeTruthy();
        expect(plugin.isHidden(5)).toBeTruthy();
      });
    });
  });
});
