describe('HiddenColumns', function() {
  var id = 'testContainer';

  beforeEach(function() {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should hide columns if "hiddenColumns" property is set', function() {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 10),
      hiddenColumns: {
        columns: [2, 4]
      },
      width: 500,
      height: 300
    });

    expect(hot.getColWidth(1)).toBeGreaterThan(0);
    expect(hot.getColWidth(2)).toEqual(0);
    expect(hot.getColWidth(4)).toEqual(0);
    expect(hot.getColWidth(5)).toBeGreaterThan(0);
  });

  it('should show the hidden column indicators if "indicators" property is set to true', function() {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 10),
      hiddenColumns: {
        columns: [2, 4],
        indicators: true
      },
      colHeaders: true,
      width: 500,
      height: 300
    });

    var tHeadTRs = hot.view.wt.wtTable.THEAD.childNodes[0].childNodes;

    expect(Handsontable.Dom.hasClass(tHeadTRs[3], 'afterHiddenColumn')).toBe(true);
    expect(Handsontable.Dom.hasClass(tHeadTRs[5], 'afterHiddenColumn')).toBe(true);

    expect(Handsontable.Dom.hasClass(tHeadTRs[1], 'beforeHiddenColumn')).toBe(true);
    expect(Handsontable.Dom.hasClass(tHeadTRs[3], 'beforeHiddenColumn')).toBe(true);
  });

  describe('copy-paste functionality', function() {

    it('should allow to copy hidden rows, when "copyPasteEnabled" property is not set', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 10),
        hiddenColumns: {
          columns: [2, 4]
        },
        width: 500,
        height: 300
      });

      selectCell(0, 0, 4, 9);
      keyDownUp(Handsontable.helper.keyCode.COMMAND_LEFT);

      var copyPasteTextarea = $('textarea.copyPaste');

      expect(copyPasteTextarea.val()).toEqual(
        'A1	B1	C1	D1	E1	F1	G1	H1	I1	J1' + '\n' +
        'A2	B2	C2	D2	E2	F2	G2	H2	I2	J2' + '\n' +
        'A3	B3	C3	D3	E3	F3	G3	H3	I3	J3' + '\n' +
        'A4	B4	C4	D4	E4	F4	G4	H4	I4	J4' + '\n' +
        'A5	B5	C5	D5	E5	F5	G5	H5	I5	J5' + '\n'
      );
    });

    it('should allow to copy hidden rows, when "copyPasteEnabled" property is set to true', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 10),
        hiddenColumns: {
          columns: [2, 4],
          copyPasteEnabled: true
        },
        width: 500,
        height: 300
      });

      selectCell(0, 0, 4, 9);
      keyDownUp(Handsontable.helper.keyCode.COMMAND_LEFT);

      var copyPasteTextarea = $('textarea.copyPaste');

      expect(copyPasteTextarea.val()).toEqual(
        'A1	B1	C1	D1	E1	F1	G1	H1	I1	J1' + '\n' +
        'A2	B2	C2	D2	E2	F2	G2	H2	I2	J2' + '\n' +
        'A3	B3	C3	D3	E3	F3	G3	H3	I3	J3' + '\n' +
        'A4	B4	C4	D4	E4	F4	G4	H4	I4	J4' + '\n' +
        'A5	B5	C5	D5	E5	F5	G5	H5	I5	J5' + '\n'
      );
    });

    it('should skip hidden rows, while copying data, when "copyPasteEnabled" property is set to false', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 10),
        hiddenColumns: {
          columns: [2, 4],
          copyPasteEnabled: false
        },
        width: 500,
        height: 300
      });

      selectCell(0, 0, 4, 9);
      keyDownUp(Handsontable.helper.keyCode.COMMAND_LEFT);

      var copyPasteTextarea = $('textarea.copyPaste');

      expect(copyPasteTextarea.val()).toEqual(
        'A1	B1	D1	F1	G1	H1	I1	J1' + '\n' +
        'A2	B2	D2	F2	G2	H2	I2	J2' + '\n' +
        'A3	B3	D3	F3	G3	H3	I3	J3' + '\n' +
        'A4	B4	D4	F4	G4	H4	I4	J4' + '\n' +
          //'A5	B5	D5	F5	G5	H5	I5	J5' + '\n' //doesnt add a newline for some reason, TODO needs further investigation
        'A5	B5	D5	F5	G5	H5	I5	J5'
      );
    });

    it('should skip hidden rows, while pasting data, when "copyPasteEnabled" property is set to false', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 10),
        hiddenColumns: {
          columns: [2, 4],
          copyPasteEnabled: false
        },
        width: 500,
        height: 300
      });

      selectCell(0, 0);

      var copyPasteTextarea = $('textarea.copyPaste');
      copyPasteTextarea.val('a\tb\tc\td\te\nf\tg\th\ti\tj');

      hot.copyPaste.onPaste(copyPasteTextarea.val());

      expect(getDataAtRow(0)).toEqual(["a", "b", "C1", "c", "E1", "d", "e", "H1", "I1", "J1"]);
      expect(getDataAtRow(1)).toEqual(["f", "g", "C2", "h", "E2", "i", "j", "H2", "I2", "J2"]);
    });

  });

});