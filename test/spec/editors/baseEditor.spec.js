describe('BaseEditor', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '" style="width: 300px; height: 200px; overflow: auto"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe("ctrl + enter when editor is active", function() {
    it("should populate value from the currently active cell to every cell in the selected range", function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(6,6)
      });

      selectCell(1, 1, 2, 2);

      expect(getDataAtCell(1,1)).toEqual("B2");
      expect(getDataAtCell(2,2)).toEqual("C3");

      keyDown(Handsontable.helper.KEY_CODES.ENTER);
      keyDown('ctrl+enter');

      expect(getDataAtCell(1,1)).toEqual("B2");
      expect(getDataAtCell(1,2)).toEqual("B2");
      expect(getDataAtCell(2,1)).toEqual("B2");
      expect(getDataAtCell(2,2)).toEqual("B2");

      loadData(Handsontable.helper.createSpreadsheetData(6,6));

      selectCell(1, 2, 2, 1);

      expect(getDataAtCell(1,2)).toEqual("C2");
      expect(getDataAtCell(2,1)).toEqual("B3");

      keyDown(Handsontable.helper.KEY_CODES.ENTER);
      keyDown('ctrl+enter');

      expect(getDataAtCell(1,1)).toEqual("C2");
      expect(getDataAtCell(1,2)).toEqual("C2");
      expect(getDataAtCell(2,1)).toEqual("C2");
      expect(getDataAtCell(2,2)).toEqual("C2");

      loadData(Handsontable.helper.createSpreadsheetData(6,6));
      selectCell(2, 2, 1, 1);
      expect(getDataAtCell(2,2)).toEqual("C3");

      keyDown(Handsontable.helper.KEY_CODES.ENTER);
      keyDown('ctrl+enter');

      expect(getDataAtCell(1,1)).toEqual("C3");
      expect(getDataAtCell(1,2)).toEqual("C3");
      expect(getDataAtCell(2,1)).toEqual("C3");
      expect(getDataAtCell(2,2)).toEqual("C3");

      loadData(Handsontable.helper.createSpreadsheetData(6,6));
      selectCell(2, 1, 1, 2);
      expect(getDataAtCell(2,1)).toEqual("B3");

      keyDown(Handsontable.helper.KEY_CODES.ENTER);
      keyDown('ctrl+enter');

      expect(getDataAtCell(1,1)).toEqual("B3");
      expect(getDataAtCell(1,2)).toEqual("B3");
      expect(getDataAtCell(2,1)).toEqual("B3");
      expect(getDataAtCell(2,2)).toEqual("B3");

    });
  });

  it("should exported all editors into Handsontable.editors object", function() {
    expect(Handsontable.editors.AutocompleteEditor).toBeDefined();
    expect(Handsontable.editors.BaseEditor).toBeDefined();
    expect(Handsontable.editors.CheckboxEditor).toBeDefined();
    expect(Handsontable.editors.DateEditor).toBeDefined();
    expect(Handsontable.editors.DropdownEditor).toBeDefined();
    expect(Handsontable.editors.HandsontableEditor).toBeDefined();
    expect(Handsontable.editors.MobileEditor).toBeDefined();
    expect(Handsontable.editors.NumericEditor).toBeDefined();
    expect(Handsontable.editors.PasswordEditor).toBeDefined();
    expect(Handsontable.editors.SelectEditor).toBeDefined();
    expect(Handsontable.editors.TextEditor).toBeDefined();
  });
});
