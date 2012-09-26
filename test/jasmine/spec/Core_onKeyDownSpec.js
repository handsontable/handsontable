describe('Core_onKeyDown', function () {
  var $container,
    id = 'testContainer';

  beforeEach(function () {
    $container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if($container) {
      $container.remove();
    }
  });

  it('should advance to next cell when TAB is pressed', function () {
    //https://github.com/warpech/jquery-handsontable/issues/151
    $container.handsontable();
    $container.handsontable('selectCell', 0, 0);

    var keydown = $.Event('keydown');
    keydown.keyCode = 9; //tab
    $container.find('textarea.handsontableInput').trigger(keydown);

    var output = $container.handsontable('getSelected');
    expect(output[0]).toEqual(0);
    expect(output[1]).toEqual(1);
  });
});