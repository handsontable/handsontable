describe('Core_view', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '" style="width: 400px; height: 60px; overflow: scroll"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      this.$container.remove();
    }
  });

  it('should focus cell after viewport is scrolled using down arrow', function () {
    runs(function(){
      handsontable({
        startRows: 20
      });
      selectCell(0, 0);
      keyDown('arrow_down');
    });

    waits(51);

    runs(function(){
      keyDown('arrow_down');
    });

    waits(51);

    runs(function(){
      keyDown('arrow_down');
    });

    waits(51);

    runs(function(){
      keyDown('arrow_down');
    });

    waits(51);

    runs(function(){
      keyDown('enter');
    });

    waits(51);

    runs(function(){
      expect(isEditorVisible()).toEqual(true);
    });
  });
});