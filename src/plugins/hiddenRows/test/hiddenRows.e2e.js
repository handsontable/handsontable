describe('HiddenRows', function() {
  var id = 'testContainer';

  function getMultilineData(rows, cols) {
    var data = Handsontable.helper.createSpreadsheetData(rows, cols);

    // Column C
    data[0][2] += '\nline';
    data[1][2] += '\nline\nline';

    return data;
  }

  beforeEach(function() {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should hide rows if "hiddenRows" property is set as `true`', function() {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 10),
      hiddenRows: {
        rows: [2, 4]
      },
      cells: function(row, col) {
        var meta = {};

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

  it('should hide rows if "hiddenRows" property is set as `true` and rowHeaders is set as `false`', function() {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 10),
      hiddenRows: {
        rows: [2, 4]
      },
      rowHeaders: false,
      cells: function(row, col) {
        var meta = {};

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

  it('should return to default state after call disablePlugin method', function() {
    var hot = handsontable({
      data: getMultilineData(10, 10),
      hiddenRows: {
        rows: [2, 4]
      },
      cells: function(row, col) {
        var meta = {};

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

  it('should hide rows after call enablePlugin method', function() {
    var hot = handsontable({
      data: getMultilineData(5, 10),
      hiddenRows: {
        rows: [2, 4]
      },
      cells: function(row, col) {
        var meta = {};

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

  it('should update settings after call updateSettings method', function() {
    var hot = handsontable({
      data: getMultilineData(10, 10),
      hiddenRows: {
        rows: [2, 4]
      },
      cells: function(row, col) {
        var meta = {};

        if (col === 2) {
          meta.type = 'date';
        }

        return meta;
      },
      width: 500,
      height: 300
    });
    hot.updateSettings({
      hiddenRows: {rows: [1]}
    });

    // undefined as default value - not hidden
    expect(hot.getRowHeight(0)).not.toBeDefined();
    expect(hot.getRowHeight(1)).toBe(0.1);
    expect(hot.getRowHeight(2)).not.toBeDefined();
    expect(hot.getRowHeight(4)).not.toBeDefined();
    expect(hot.getRowHeight(5)).not.toBeDefined();
  });

  it('should hide row after call hideRow method', function() {
    var hot = handsontable({
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

  it('should show row after call showRow method', function() {
    var hot = handsontable({
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

  it('should show the hidden row indicators if "indicators" property is set to `true`', function() {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 10),
      hiddenRows: {
        rows: [2, 4],
        indicators: true
      },
      rowHeaders: true,
      width: 500,
      height: 300
    });
    var trs = hot.view.wt.wtTable.TBODY.childNodes;

    expect(Handsontable.dom.hasClass(trs[1].firstChild, 'beforeHiddenRow')).toBe(true);
    expect(Handsontable.dom.hasClass(trs[2], 'hide')).toBe(true);
    expect(Handsontable.dom.hasClass(trs[3].firstChild, 'beforeHiddenRow')).toBe(true);
    expect(Handsontable.dom.hasClass(trs[3].firstChild, 'afterHiddenRow')).toBe(true);
    expect(Handsontable.dom.hasClass(trs[4], 'hide')).toBe(true);
    expect(Handsontable.dom.hasClass(trs[5].firstChild, 'afterHiddenRow')).toBe(true);
  });

  it('should not throw any errors, when selecting a whole column with the last row hidden', function() {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      hiddenRows: {
        rows: [3]
      },
      colHeaders: true
    });

    var errorThrown = false;

    try {
      hot.selectCell(0, 2, 3, 2);

    } catch (err) {
      errorThrown = true;
    }

    expect(errorThrown).toBe(false);
  });

  describe('alter table', function () {
    it('should recalculate index of the hidden rows after insert rows', function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 10),
        hiddenRows: {
          rows: [3]
        },
        width: 500,
        height: 300
      });

      var plugin = hot.getPlugin('hiddenRows');
      hot.alter('insert_row', 0, 2);

      expect(plugin.hiddenRows[0]).toEqual(5);
    });

    it('should recalculate index of the hidden rows after remove rows', function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 10),
        hiddenRows: {
          rows: [3]
        },
        width: 500,
        height: 300
      });

      var plugin = hot.getPlugin('hiddenRows');
      hot.alter('remove_row', 0, 2);

      expect(plugin.hiddenRows[0]).toEqual(1);
    });
  });

  describe('copy-paste functionality', function() {

    it('should allow to copy hidden rows, when "copyPasteEnabled" property is not set', function() {
      var hot = handsontable({
        data: getMultilineData(10, 10),
        hiddenRows: {
          rows: [
            2,
            4]
        },
        width: 500,
        height: 300
      });

      selectCell(0, 0, 4, 9);
      keyDownUp(Handsontable.helper.KEY_CODES.COMMAND_LEFT);

      var copyPasteTextarea = $('textarea.copyPaste');

      /* eslint-disable no-tabs */
      expect(copyPasteTextarea.val()).toEqual('A1	B1	"C1\n' +
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

    it('should allow to copy hidden rows, when "copyPasteEnabled" property is set to `true`', function() {
      var hot = handsontable({
        data: getMultilineData(10, 10),
        hiddenRows: {
          rows: [2, 4],
          copyPasteEnabled: true
        },
        width: 500,
        height: 300
      });

      selectCell(0, 0, 4, 9);
      keyDownUp(Handsontable.helper.KEY_CODES.COMMAND_LEFT);

      var copyPasteTextarea = $('textarea.copyPaste');

      /* eslint-disable no-tabs */
      expect(copyPasteTextarea.val()).toEqual('A1	B1	"C1\n' +
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

    it('should skip hidden rows, while copying data, when "copyPasteEnabled" property is set to `false`', function() {
      var hot = handsontable({
        data: getMultilineData(10, 10),
        hiddenRows: {
          rows: [2, 4],
          copyPasteEnabled: false
        },
        width: 500,
        height: 300
      });

      selectCell(0, 0, 4, 9);
      keyDownUp(Handsontable.helper.KEY_CODES.COMMAND_LEFT);

      var copyPasteTextarea = $('textarea.copyPaste');

      /* eslint-disable no-tabs */
      expect(copyPasteTextarea.val()).toEqual('A1	B1	"C1\n' +
        'line"	D1	E1	F1	G1	H1	I1	J1\n' +
        'A2	B2	"C2\n' +
        'line\n' +
        'line"	D2	E2	F2	G2	H2	I2	J2\n' +
        'A4	B4	C4	D4	E4	F4	G4	H4	I4	J4\n' +
        'A6	B6	C6	D6	E6	F6	G6	H6	I6	J6'
      );
    });

    it('should skip hidden rows, while pasting data, when "copyPasteEnabled" property is set to `false`', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 5),
        hiddenRows: {
          rows: [2, 4],
          copyPasteEnabled: false
        },
        width: 500,
        height: 300
      });

      selectCell(0, 0);

      var plugin = hot.getPlugin('CopyPaste');

      plugin.paste('a\tb\nc\td\ne\tf\ng\th\ni\tj');

      expect(getDataAtRow(0)).toEqual(['a', 'b', 'C1', 'D1', 'E1']);
      expect(getDataAtRow(1)).toEqual(['c', 'd', 'C2', 'D2', 'E2']);
      expect(getDataAtRow(2)).toEqual(['A3', 'B3', 'C3', 'D3', 'E3']);
      expect(getDataAtRow(3)).toEqual(['e', 'f', 'C4', 'D4', 'E4']);
      expect(getDataAtRow(4)).toEqual(['A5', 'B5', 'C5', 'D5', 'E5']);
      expect(getDataAtRow(5)).toEqual(['g', 'h', 'C6', 'D6', 'E6']);
    });
  });

  describe('navigation', function() {
    it('should ignore hidden rows while navigating by arrow keys', function() {
      var hot = handsontable({
        data: getMultilineData(10, 10),
        hiddenRows: {
          rows: [2, 4]
        },
        width: 500,
        height: 300
      });

      selectCell(0, 0, 0, 0);
      keyDownUp(Handsontable.helper.KEY_CODES.ARROW_DOWN);

      expect(getSelected()).toEqual([1, 0, 1, 0]);

      keyDownUp(Handsontable.helper.KEY_CODES.ARROW_DOWN);

      expect(getSelected()).toEqual([3, 0, 3, 0]);

      keyDownUp(Handsontable.helper.KEY_CODES.ARROW_DOWN);

      expect(getSelected()).toEqual([5, 0, 5, 0]);
    });

    it('should properly highlight selected cell', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        hiddenRows: {
          rows: [0]
        },
        mergeCells: [
          {row: 1, col: 1, colspan: 2, rowspan: 2}
        ],
        colHeaders: true
      });

      selectCell(3, 1, 3, 1);
      keyDownUp(Handsontable.helper.KEY_CODES.ARROW_UP);
      keyDownUp(Handsontable.helper.KEY_CODES.ARROW_UP);
      keyDownUp(Handsontable.helper.KEY_CODES.ARROW_UP);

      expect(hot.getSelectedRange().highlight.row).toBe(1);
    });


  });

  describe('context-menu', function() {
    it('should be visible "Hide row" on context menu when row is selected by header', function() {
      var hot = handsontable({
        data: getMultilineData(10, 10),
        hiddenRows: true,
        width: 500,
        height: 300,
        contextMenu: ['hidden_rows_hide', 'hidden_rows_show'],
        rowHeaders: true
      });

      var header = $('.ht_clone_left tr:eq(0) th:eq(0)');
      header.simulate('mousedown');
      header.simulate('mouseup');
      contextMenu();

      var items = $('.htContextMenu tbody td');
      var actions = items.not('.htSeparator');

      expect(actions.text()).toEqual('Hide row');
    });

    it('should be NOT visible "Hide row" on context menu when row is selected by header', function() {
      var hot = handsontable({
        data: getMultilineData(5, 10),
        hiddenRows: true,
        width: 500,
        height: 300,
        contextMenu: ['hidden_rows_hide', 'hidden_rows_show'],
        rowHeaders: true
      });

      selectCell(0, 0);
      contextMenu();

      var items = $('.htContextMenu tbody td');
      var actions = items.not('.htSeparator');

      expect(actions.length).toEqual(0);
    });

    it('should hide selected columns by "Hide row" in context menu', function() {
      var hot = handsontable({
        data: getMultilineData(10, 10),
        hiddenRows: true,
        width: 500,
        height: 300,
        contextMenu: ['hidden_rows_hide', 'hidden_rows_show'],
        rowHeaders: true
      });

      var header = $('.ht_clone_left');

      header.find('tr:eq(3) th:eq(0)').simulate('mousedown');
      header.find('tr:eq(4) th:eq(0)').simulate('mouseover');
      header.find('tr:eq(4) th:eq(0)').simulate('mouseup');

      contextMenu();

      var items = $('.htContextMenu tbody td');
      var actions = items.not('.htSeparator');

      actions.simulate('mousedown');

      expect(hot.getRowHeight(3)).toBe(0.1);
      expect(hot.getRowHeight(4)).toBe(0.1);
    });

    it('should show hidden rows by context menu', function() {
      var hot = handsontable({
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

      var header = $('.ht_clone_left');

      header.find('tr:eq(1) th:eq(0)').simulate('mousedown');
      header.find('tr:eq(4) th:eq(0)').simulate('mouseover');
      header.find('tr:eq(4) th:eq(0)').simulate('mouseup');

      contextMenu();

      var items = $('.htContextMenu tbody td');
      var actions = items.not('.htSeparator');

      actions.simulate('mousedown');

      expect(hot.getRowHeight(2)).toBe(30);
      expect(hot.getRowHeight(3)).toBe(30);
    });
  });

  describe('manualRowMove', function() {
    it('should properly render hidden ranges after moving action', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 10),
        hiddenRows: {
          rows: [3]
        },
        width: 500,
        height: 300,
        manualRowMove: true
      });
      var hiddenRows = hot.getPlugin('hiddenRows');
      var manualRowMove = hot.getPlugin('manualRowMove');

      manualRowMove.moveRows([0, 1], 4);
      hot.render();

      expect(hiddenRows.hiddenRows[0]).toEqual(3);
      expect(hot.getRowHeight(1)).toEqual(0.1);
    });
  });

  describe('maxRows option set', function() {
    it('should return properly data after hiding', function () {
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
});
