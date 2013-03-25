describe('Core_view', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '" style="width: 400px; height: 60px; overflow: scroll"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should focus cell after viewport is scrolled using down arrow', function () {
    runs(function () {
      handsontable({
        startRows: 20
      });
      selectCell(0, 0);
      keyDown('arrow_down');
    });

    waits(51);

    runs(function () {
      keyDown('arrow_down');
    });

    waits(51);

    runs(function () {
      keyDown('arrow_down');
    });

    waits(51);

    runs(function () {
      keyDown('arrow_down');
    });

    waits(51);

    runs(function () {
      keyDown('enter');
    });

    waits(51);

    runs(function () {
      expect(isEditorVisible()).toEqual(true);
    });
  });

  it('should not scroll viewport when last cell is clicked', function () {
    runs(function () {
      this.$container = $('<div id="' + id + '"></div>').appendTo('body');
      handsontable({
        startRows: 50
      });
    });

    waitsFor(nextFrame, 'next frame', 60);

    var lastScroll;

    runs(function () {
      $(window).scrollTop(10000);
      lastScroll = $(window).scrollTop();
      selectCell(47, 0);
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect($(window).scrollTop()).toEqual(lastScroll);
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      keyDown('arrow_right');
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(getSelected()).toEqual([47, 1, 47, 1]);
      expect($(window).scrollTop()).toEqual(lastScroll);
    });
  });

  it('should not shrink table when width and height is not specified for container', function () {

    var initHeight;

    runs(function () {
      this.$container = $('<div id="' + id + '" style="overflow: scroll;"></div>').appendTo('body');
      this.$container.wrap('<div style="width: 50px;"></div>');
      handsontable({
        startRows: 10,
        startCols: 10
      });
    });

    waits(1000);

    runs(function () {
      initHeight = this.$container.height();
    });

    waits(1000);

    runs(function () {
      expect(this.$container.height()).toEqual(initHeight);
    });

  });
});