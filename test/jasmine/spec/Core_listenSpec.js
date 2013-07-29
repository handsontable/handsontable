describe('Core_listen', function () {
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

  it('should listen to changes when cell is selected', function () {
    var hot = handsontable();
    hot.selectCell(0, 0);
    expect(hot.isListening()).toEqual(true);
  });

  it('should unlisten changes', function () {
    var hot = handsontable();
    hot.selectCell(0, 0);
    expect(hot.isListening()).toEqual(true);
    hot.unlisten();
    expect(hot.isListening()).toEqual(false);
  });

  it('should listen to changes, when called after unlisten', function () {
    var hot = handsontable();
    hot.selectCell(0, 0);
    hot.unlisten();
    hot.listen();
    expect(hot.isListening()).toEqual(true);
  });

  it('when second instance is created, first should unlisten automatically', function () {
    var $container1 = $('<div id="hot1"></div>').appendTo('body').handsontable();
    $container1.handsontable('selectCell', 0, 0);
    var $container2 = $('<div id="hot2"></div>').appendTo('body').handsontable();
    $container2.handsontable('selectCell', 0, 0);

    expect($container1.handsontable('isListening')).toEqual(false);
    expect($container2.handsontable('isListening')).toEqual(true);

    $container1.handsontable('destroy');
    $container1.remove();
    $container2.handsontable('destroy');
    $container2.remove();
  });

  it('when listen is called on first instance, second should unlisten automatically', function () {
    var $container1 = $('<div id="hot1"></div>').appendTo('body').handsontable();
    $container1.handsontable('selectCell', 0, 0);
    var $container2 = $('<div id="hot2"></div>').appendTo('body').handsontable();
    $container2.handsontable('selectCell', 0, 0);

    $container1.handsontable('listen');
    expect($container1.handsontable('isListening')).toEqual(true);
    expect($container2.handsontable('isListening')).toEqual(false);

    $container1.handsontable('destroy');
    $container1.remove();
    $container2.handsontable('destroy');
    $container2.remove();
  });
});
