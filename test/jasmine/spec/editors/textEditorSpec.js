describe('TextEditor', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      this.$container.remove();
    }
  });

  it('should begin editing when enterBeginsEditing equals true', function () {
    runs(function () {
      handsontable({
        enterBeginsEditing: true
      });
      selectCell(2, 2);
      keyDown('enter');
    });

    waits(10);

    runs(function () {
      var selection = getSelected();
      expect(selection).toEqual([2, 2, 2, 2]);
      expect(isEditorVisible()).toEqual(true);
    });
  });

  it('should move down when enterBeginsEditing equals false', function () {
    runs(function () {
      handsontable({
        enterBeginsEditing: false
      });
      selectCell(2, 2);
      keyDown('enter');
    });

    waits(10);

    runs(function () {
      var selection = getSelected();
      expect(selection).toEqual([3, 2, 3, 2]);
      expect(isEditorVisible()).toEqual(false);
    });
  });

  it('should trigger beginediting', function () {
    var called;

    runs(function () {
      handsontable({
        enterBeginsEditing: true
      });
      selectCell(2, 2);
      this.$container.on('beginediting.handsontable', function () {
        called = true;
      });
      keyDown('enter');
    });

    waitsFor(function () {
      return (called === true)
    }, 100);

    runs(function () {
      expect(called).toEqual(true);
    });
  });

  it('should trigger finishediting', function () {
    var called;

    runs(function () {
      handsontable({
        enterBeginsEditing: true
      });
      selectCell(2, 2);
      keyDown('enter');
      this.$container.on('finishediting.handsontable', function () {
        called = true;
      });
      keyDown('enter');
    });

    waitsFor(function () {
      return (called === true)
    }, 100);

    runs(function () {
      expect(called).toEqual(true);
    });
  });

  it('should render string in textarea', function () {
    handsontable();
    setDataAtCell(2, 2, "string");
    selectCell(2, 2);
    keyDown('enter');
    expect(keyProxy()).toEqual("string");
  });

  it('should render number in textarea', function () {
    handsontable();
    setDataAtCell(2, 2, 13);
    selectCell(2, 2);
    keyDown('enter');
    expect(keyProxy()).toEqual("13");
  });

  it('should render boolean true in textarea', function () {
    handsontable();
    setDataAtCell(2, 2, true);
    selectCell(2, 2);
    keyDown('enter');
    expect(keyProxy()).toEqual("true");
  });

  it('should render boolean false in textarea', function () {
    handsontable();
    setDataAtCell(2, 2, false);
    selectCell(2, 2);
    keyDown('enter');
    expect(keyProxy()).toEqual("false");
  });

  it('should render null in textarea', function () {
    handsontable();
    setDataAtCell(2, 2, null);
    selectCell(2, 2);
    keyDown('enter');
    expect(keyProxy()).toEqual("");
  });

  it('should render undefined in textarea', function () {
    handsontable();
    setDataAtCell(2, 2, (function () {
    })());
    selectCell(2, 2);
    keyDown('enter');
    expect(keyProxy()).toEqual("");
  });

  it('should open editor after cancelling edit and beginning it again', function () {
    runs(function () {
      handsontable();
      selectCell(2, 2);
      keyDown('f2');
    });

    waits(10);

    runs(function () {
      keyDown('esc');
    });

    waits(10);

    runs(function () {
      keyDown('f2');
    });

    waits(10);

    runs(function () {
      expect(isEditorVisible()).toEqual(true);
    });
  });

  it('loadData should not destroy editor', function () {
    runs(function () {
      handsontable();
      selectCell(2, 2);
      keyDown('f2');
    });

    waits(100);

    runs(function () {
      loadData(getData());
    });

    waits(100);

    runs(function () {
      expect(isEditorVisible()).toEqual(true);
    });
  });

  it('updateSettings should not destroy editor', function () {
    runs(function () {
      handsontable();
      selectCell(2, 2);
      keyDown('f2');
    });

    waits(100);

    runs(function () {
      updateSettings({data: getData()});
    });

    waits(100);

    runs(function () {
      expect(isEditorVisible()).toEqual(true);
    });
  });
});