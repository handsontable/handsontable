describe('Core_setDataAtCell', function () {
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

  var htmlText = "Ben & Jerry's";

  it('HTML special chars should be preserved in data map but escaped in DOM', function () {
    //https://github.com/warpech/jquery-handsontable/issues/147
    $container.handsontable();
    var td = $container.handsontable('setDataAtCell', 0, 0, htmlText);
    $container.handsontable("selectCell", 0, 0);
    $(td).trigger("dblclick");
    $container.handsontable("deselectCell");
    var output = $container.handsontable('getDataAtCell', 0, 0);
    expect(output).toEqual(htmlText);
  });
});