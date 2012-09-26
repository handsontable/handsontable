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
  var htmlData = [
    ['<b>H&M</b>']
  ];

  it('HTML special chars should be preserved in data map but escaped in DOM', function () {
    //https://github.com/warpech/jquery-handsontable/issues/147
    $container.handsontable();
    var td = $container.handsontable('setDataAtCell', 0, 0, htmlText);
    $container.handsontable("selectCell", 0, 0);
    $(td).trigger("dblclick")
    $container.handsontable("deselectCell");
    var output = $container.handsontable('getDataAtCell', 0, 0);
    expect(output).toEqual(htmlText);
  });

  it('HTML special chars should be escaped by default', function () {
    $container.handsontable();
    $container.handsontable('loadData', htmlData);
    var output = $container.handsontable('getCell', 0, 0).innerHTML;
    expect(output).toEqual('&lt;b&gt;H&amp;M&lt;/b&gt;');
  });

  it('HTML special chars should be escaped when allowHtml == false', function () {
    $container.handsontable();
    $container.handsontable('loadData', htmlData, false);
    var output = $container.handsontable('getCell', 0, 0).innerHTML;
    expect(output).toEqual('&lt;b&gt;H&amp;M&lt;/b&gt;');
  });

  it('HTML special chars should not be escaped when allowHtml == true', function () {
    $container.handsontable();
    $container.handsontable('loadData', htmlData, true);
    var output = $container.handsontable('getCell', 0, 0).innerHTML;
    expect(output).toEqual('<b>H&amp;M</b>');
  });
});