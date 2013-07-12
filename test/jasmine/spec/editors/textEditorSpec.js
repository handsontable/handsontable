describe('TextEditor', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should begin editing when enterBeginsEditing equals true', function () {
    handsontable({
      enterBeginsEditing: true
    });
    selectCell(2, 2);

    keyDown('enter');

    var selection = getSelected();
    expect(selection).toEqual([2, 2, 2, 2]);
    expect(isEditorVisible()).toEqual(true);
  });

  it('should move down after editing', function () {
    handsontable();
    selectCell(2, 2);

    keyDown('enter');
    keyDown('enter');

    var selection = getSelected();
    expect(selection).toEqual([3, 2, 3, 2]);
  });

  it('should move down when enterBeginsEditing equals false', function () {
    handsontable({
      enterBeginsEditing: false
    });
    selectCell(2, 2);

    keyDown('enter');

    var selection = getSelected();
    expect(selection).toEqual([3, 2, 3, 2]);
    expect(isEditorVisible()).toEqual(false);
  });

  it('should render string in textarea', function () {
    handsontable();
    setDataAtCell(2, 2, "string");
    selectCell(2, 2);

    keyDown('enter');

    expect(keyProxy().val()).toEqual("string");
  });

  it('should render number in textarea', function () {
    handsontable();
    setDataAtCell(2, 2, 13);
    selectCell(2, 2);

    keyDown('enter');

    expect(keyProxy().val()).toEqual("13");
  });

  it('should render boolean true in textarea', function () {
    handsontable();
    setDataAtCell(2, 2, true);
    selectCell(2, 2);

    keyDown('enter');

    expect(keyProxy().val()).toEqual("true");
  });

  it('should render boolean false in textarea', function () {
    handsontable();
    setDataAtCell(2, 2, false);
    selectCell(2, 2);

    keyDown('enter');

    expect(keyProxy().val()).toEqual("false");
  });

  it('should render null in textarea', function () {
    handsontable();
    setDataAtCell(2, 2, null);
    selectCell(2, 2);

    keyDown('enter');

    expect(keyProxy().val()).toEqual("");
  });

  it('should render undefined in textarea', function () {
    handsontable();
    setDataAtCell(2, 2, void 0);
    selectCell(2, 2);

    keyDown('enter');

    expect(keyProxy().val()).toEqual("");
  });

  it('should open editor after cancelling edit and beginning it again', function () {
    handsontable();
    selectCell(2, 2);

    keyDown('f2');
    keyDown('esc');
    keyDown('f2');

    expect(isEditorVisible()).toEqual(true);
  });

  it('loadData should not destroy editor', function () {
    handsontable();
    selectCell(2, 2);

    keyDown('f2');
    loadData(getData());

    expect(isEditorVisible()).toEqual(true);
  });

  it('updateSettings should not destroy editor', function () {
    handsontable();
    selectCell(2, 2);

    keyDown('f2');
    updateSettings({data: getData()});

    expect(isEditorVisible()).toEqual(true);
  });

  it('textarea should have cell dimensions (after render)', function () {
    runs(function () {
      var data = [
        ["a", "b"],
        ["c", "d"]
      ];

      handsontable({
        data: data,
        minRows: 4,
        minCols: 4,
        minSpareRows: 4,
        minSpareCols: 4
      });

      selectCell(1, 1);
      keyDownUp('enter');

      data[1][1] = "dddddddddddddddddddd";
      render();
    });

    waits(10);

    runs(function () {
      var $td = this.$container.find('.htCore tbody tr:eq(1) td:eq(1)');
      expect(keyProxy().width()).toEqual($td.width());
    });
  });

  it('global shortcuts (like CTRL+A) should be blocked when cell is being edited', function () {
    handsontable();
    selectCell(2, 2);

    keyDownUp('enter');

    keyDown(65, {ctrlKey: true}); //CTRL+A should NOT select all table when cell is edited

    var selection = getSelected();
    expect(selection).toEqual([2, 2, 2, 2]);
    expect(isEditorVisible()).toEqual(true);
  });

  it('should open editor after double clicking on a cell', function () {

    handsontable({
      data: createSpreadsheetData(5, 2)
    });

    var cell = $(getCell(0,0));
    var clicks = 0;

    setTimeout(function(){
      mouseDown(cell);
      mouseUp(cell);
      clicks++;
    }, 0);

    setTimeout(function(){
      mouseDown(cell);
      mouseUp(cell);
      clicks++;
    }, 100);

    waitsFor(function(){
      return clicks == 2;
    }, 'Two clicks', 1000);

    runs(function(){
      expect(document.activeElement.nodeName).toEqual('TEXTAREA');
    });

  });

});