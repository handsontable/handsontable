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
});