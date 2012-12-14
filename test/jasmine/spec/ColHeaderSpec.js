describe('ColHeader', function () {
  var $container,
    id = 'testContainer';

  beforeEach(function () {
    $container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if ($container) {
      $container.remove();
    }
  });

  it('should not show col headers by default', function () {
    $container.handsontable();
    expect($container.find('thead th').length).toEqual(0);
  });

  it('should show col headers if true', function () {
    $container.handsontable({
      colHeaders: true
    });
    expect($container.find('thead th').length).toBeGreaterThan(0);
  });

  it('should show col headers numbered 1-10 by default', function () {
    var startCols = 5;
    $container.handsontable({
      startCols: startCols,
      colHeaders: true
    });
    var ths = $container.find('thead th');
    expect(ths.length).toEqual(startCols);
    expect($.trim(ths.eq(0).text())).toEqual('A');
    expect($.trim(ths.eq(1).text())).toEqual('B');
    expect($.trim(ths.eq(2).text())).toEqual('C');
    expect($.trim(ths.eq(3).text())).toEqual('D');
    expect($.trim(ths.eq(4).text())).toEqual('E');
  });

  it('should show col headers with custom label', function () {
    var startCols = 5;
    $container.handsontable({
      startCols: startCols,
      colHeaders: ['First', 'Second', 'Third']
    });
    var ths = $container.find('thead th');
    expect(ths.length).toEqual(startCols);
    expect($.trim(ths.eq(0).text())).toEqual('First');
    expect($.trim(ths.eq(1).text())).toEqual('Second');
    expect($.trim(ths.eq(2).text())).toEqual('Third');
    expect($.trim(ths.eq(3).text())).toEqual('D');
    expect($.trim(ths.eq(4).text())).toEqual('E');
  });

  it('should not show col headers if false', function () {
    $container.handsontable({
      colHeaders: false
    });
    expect($container.find('th.htColHeader').length).toEqual(0);
  });
});