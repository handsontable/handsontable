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
    runs(function () {
      handsontable();
      selectCell(0, 0);
      this.$keyboardProxy.val('1\nThis is a "test" and a test\n2');
      this.$keyboardProxy.parent().triggerHandler('paste');
    });

    waits(110);

    runs(function () {
      expect(getDataAtCell(0, 0)).toEqual('1');
      expect(getDataAtCell(1, 0)).toEqual('This is a "test" and a test');
      expect(getDataAtCell(2, 0)).toEqual('2');
    });
  });

  it('should correctly paste string when dataSchema is used', function () {
    //https://github.com/warpech/jquery-handsontable/issues/237
    var err;
    runs(function () {
      try {
        handsontable({
          colHeaders: true,
          dataSchema: {
            col1: null,
            col2: null,
            col3: null
          }
        });
        selectCell(0, 0);
        this.$keyboardProxy.val('1\tTest\t2');
        this.$keyboardProxy.parent().triggerHandler('paste');
      }
      catch (e) {
        err = e;
      }
    });

    waits(110);

    runs(function () {
      expect(getDataAtCell(0, 0)).toEqual('1');
      expect(getDataAtCell(0, 1)).toEqual('Test');
      expect(getDataAtCell(0, 2)).toEqual('2');

      expect(err).toBeUndefined();
    });
  });

  it('should paste not more rows than maxRows', function () {
    var err;
    runs(function () {
      try {
        handsontable({
          minSpareRows: 1,
          startRows: 5,
          maxRows: 10
        });
        selectCell(4, 0);
        this.$keyboardProxy.val('1\n2\n3\n4\n5\n6\n7\n8\n9\n10');
        this.$keyboardProxy.parent().triggerHandler('paste');
      }
      catch (e) {
        err = e;
      }
    });

    waits(110);

    runs(function () {
      expect(countRows()).toEqual(10);
      expect(getDataAtCell(9, 0)).toEqual('6');

      expect(err).toBeUndefined();
    });
  });

  it('should paste not more cols than maxCols', function () {
    var err;
    runs(function () {
      try {
        handsontable({
          minSpareCols: 1,
          startCols: 5,
          maxCols: 10
        });
        selectCell(0, 4);
        this.$keyboardProxy.val('1\t2\t3\t4\t5\t6\t7\t8\t9\t10');
        this.$keyboardProxy.parent().triggerHandler('paste');
      }
      catch (e) {
        err = e;
      }
    });

    waits(110);

    runs(function () {
      expect(countCols()).toEqual(10);
      expect(getDataAtCell(0, 9)).toEqual('6');

      expect(err).toBeUndefined();
    });
  });

  it('should paste not more rows & cols than maxRows & maxCols', function () {
    var err;
    runs(function () {
      try {
        handsontable({
          minSpareRows: 1,
          minSpareCols: 1,
          startRows: 5,
          startCols: 5,
          maxRows: 6,
          maxCols: 6
        });
        selectCell(4, 4);
        this.$keyboardProxy.val('1\t2\t3\n4\t5\t6\n7\t8\t9');
        this.$keyboardProxy.parent().triggerHandler('paste');
      }
      catch (e) {
        err = e;
      }
    });

    waits(110);

    runs(function () {
      expect(countRows()).toEqual(6);
      expect(countCols()).toEqual(6);
      expect(getDataAtCell(5, 5)).toEqual('5');

      expect(err).toBeUndefined();
    });
  });
});