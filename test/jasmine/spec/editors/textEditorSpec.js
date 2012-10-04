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
});