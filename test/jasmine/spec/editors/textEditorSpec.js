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
    handsontable({
      enterBeginsEditing: true
    });
    selectCell(2, 2);

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      keyDown('enter');
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      var selection = getSelected();
      expect(selection).toEqual([2, 2, 2, 2]);
      expect(isEditorVisible()).toEqual(true);
    });
  });

  it('should move down when enterBeginsEditing equals false', function () {
    handsontable({
      enterBeginsEditing: false
    });
    selectCell(2, 2);

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      keyDown('enter');
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      var selection = getSelected();
      expect(selection).toEqual([3, 2, 3, 2]);
      expect(isEditorVisible()).toEqual(false);
    });
  });

  it('should trigger beginediting', function () {
    var called;
    handsontable({
      enterBeginsEditing: true
    });
    selectCell(2, 2);
    this.$container.on('beginediting.handsontable', function () {
      called = true;
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      keyDown('enter');
    });

    waitsFor(function () {
      return (called === true)
    }, 200);

    runs(function () {
      expect(called).toEqual(true);
    });
  });

  it('should trigger finishediting', function () {
    var called;
    handsontable({
      enterBeginsEditing: true
    });
    selectCell(2, 2);

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
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

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      keyDown('enter');
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(keyProxy().val()).toEqual("string");
    });
  });

  it('should render number in textarea', function () {
    handsontable();
    setDataAtCell(2, 2, 13);
    selectCell(2, 2);

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      keyDown('enter');
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(keyProxy().val()).toEqual("13");
    });
  });

  it('should render boolean true in textarea', function () {
    handsontable();
    setDataAtCell(2, 2, true);
    selectCell(2, 2);

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      keyDown('enter');
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(keyProxy().val()).toEqual("true");
    });
  });

  it('should render boolean false in textarea', function () {
    handsontable();
    setDataAtCell(2, 2, false);
    selectCell(2, 2);

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      keyDown('enter');
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(keyProxy().val()).toEqual("false");
    });
  });

  it('should render null in textarea', function () {
    handsontable();
    setDataAtCell(2, 2, null);
    selectCell(2, 2);

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      keyDown('enter');
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(keyProxy().val()).toEqual("");
    });
  });

  it('should render undefined in textarea', function () {
    handsontable();
    setDataAtCell(2, 2, void 0);
    selectCell(2, 2);

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      keyDown('enter');
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(keyProxy().val()).toEqual("");
    });
  });

  it('should open editor after cancelling edit and beginning it again', function () {
    handsontable();
    selectCell(2, 2);

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      keyDown('f2');
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      keyDown('esc');
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      keyDown('f2');
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(isEditorVisible()).toEqual(true);
    });
  });

  it('loadData should not destroy editor', function () {
    handsontable();
    selectCell(2, 2);

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      keyDown('f2');
      loadData(getData());
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(isEditorVisible()).toEqual(true);
    });
  });

  it('updateSettings should not destroy editor', function () {
    handsontable();
    selectCell(2, 2);

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      keyDown('f2');
      updateSettings({data: getData()});
    });

    waitsFor(nextFrame, 'next frame', 60);
    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(isEditorVisible()).toEqual(true);
    });
  });
});