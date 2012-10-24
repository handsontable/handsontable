describe('Core_setDataAtCell', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      this.$container.remove();
    }
  });

  var htmlText = "Ben & Jerry's";

  it('HTML special chars should be preserved in data map but escaped in DOM', function () {
    //https://github.com/warpech/jquery-handsontable/issues/147
    handsontable();
    var td = setDataAtCell(0, 0, htmlText);
    selectCell(0, 0);
    $(td).trigger("dblclick");
    deselectCell();
    expect(getDataAtCell(0, 0)).toEqual(htmlText);
  });

  it('should correctly paste string that contains "quotes"', function () {
    //https://github.com/warpech/jquery-handsontable/issues/205
    runs(function(){
      handsontable();
      selectCell(0, 0);
      this.$keyboardProxy.val('1\nThis is a "test" and a test\n2');
      this.$keyboardProxy.parent().triggerHandler('paste');
    });

    waits(110);

    runs(function(){
      expect(getDataAtCell(0, 0)).toEqual('1');
      expect(getDataAtCell(1, 0)).toEqual('This is a "test" and a test');
      expect(getDataAtCell(2, 0)).toEqual('2');
    });
  });
});