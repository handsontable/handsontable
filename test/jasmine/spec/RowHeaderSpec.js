describe('RowHeader', function () {
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

  it('should not show row headers by default', function () {
    $container.handsontable();
    expect($container.find('tbody th').length).toEqual(0);
  });

  it('should show row headers if true', function () {
    $container.handsontable({
      rowHeaders: true
    });
    expect($container.find('tbody th').length).toBeGreaterThan(0);
  });

  it('should show row headers numbered 1-10 by default', function () {
    var startRows = 5;
    $container.handsontable({
      startRows: startRows,
      rowHeaders: true
    });
    var ths = $container.find('tbody th');
    expect(ths.length).toEqual(startRows);
    expect($.trim(ths.eq(0).text())).toEqual('1');
    expect($.trim(ths.eq(1).text())).toEqual('2');
    expect($.trim(ths.eq(2).text())).toEqual('3');
    expect($.trim(ths.eq(3).text())).toEqual('4');
    expect($.trim(ths.eq(4).text())).toEqual('5');
  });

  it('should show row headers with custom label', function () {
    var startRows = 5;
    $container.handsontable({
      startRows: startRows,
      rowHeaders: ['First', 'Second', 'Third']
    });
    var ths = $container.find('tbody th');
    expect(ths.length).toEqual(startRows);
    expect($.trim(ths.eq(0).text())).toEqual('First');
    expect($.trim(ths.eq(1).text())).toEqual('Second');
    expect($.trim(ths.eq(2).text())).toEqual('Third');
    expect($.trim(ths.eq(3).text())).toEqual('4');
    expect($.trim(ths.eq(4).text())).toEqual('5');
  });

  it('should not show row headers if false', function () {
    $container.handsontable({
      rowHeaders: false
    });
    expect($container.find('tbody th').length).toEqual(0);
  });
});