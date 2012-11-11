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
    expect($container.find('.htRowHeader').length).toEqual(0);
  });

  it('should show row headers if true', function () {
    $container.handsontable({
      rowHeaders: true
    });
    expect($container.find('.htRowHeader').length).toBeGreaterThan(0);
  });

  it('should show row headers numbered 1-10 by default', function () {
    var startRows = 5;
    $container.handsontable({
      rows: startRows,
      rowHeaders: true
    });
    var ths = $container.find('.htRowHeader');
    expect(ths.length).toEqual(2 * startRows); //2x startRows because they are duplicated on layer above grid
    expect($.trim(ths.eq(0).text())).toEqual('1');
    expect($.trim(ths.eq(1).text())).toEqual('2');
    expect($.trim(ths.eq(2).text())).toEqual('3');
    expect($.trim(ths.eq(3).text())).toEqual('4');
    expect($.trim(ths.eq(4).text())).toEqual('5');
    expect($.trim(ths.eq(5).text())).toEqual('1');
    expect($.trim(ths.eq(6).text())).toEqual('2');
    expect($.trim(ths.eq(7).text())).toEqual('3');
    expect($.trim(ths.eq(8).text())).toEqual('4');
    expect($.trim(ths.eq(9).text())).toEqual('5');
  });

  it('should show row headers with custom label', function () {
    var startRows = 5;
    $container.handsontable({
      rows: startRows,
      rowHeaders: ['First', 'Second', 'Third']
    });
    var ths = $container.find('.htRowHeader');
    expect(ths.length).toEqual(2 * startRows); //2x startRows because they are duplicated on layer above grid
    expect($.trim(ths.eq(0).text())).toEqual('First');
    expect($.trim(ths.eq(1).text())).toEqual('Second');
    expect($.trim(ths.eq(2).text())).toEqual('Third');
    expect($.trim(ths.eq(3).text())).toEqual('4');
    expect($.trim(ths.eq(4).text())).toEqual('5');
    expect($.trim(ths.eq(5).text())).toEqual('First');
    expect($.trim(ths.eq(6).text())).toEqual('Second');
    expect($.trim(ths.eq(7).text())).toEqual('Third');
    expect($.trim(ths.eq(8).text())).toEqual('4');
    expect($.trim(ths.eq(9).text())).toEqual('5');
  });

  it('should not show row headers if false', function () {
    $container.handsontable({
      rowHeaders: false
    });
    expect($container.find('.htRowHeader').length).toEqual(0);
  });

  //https://github.com/warpech/jquery-handsontable/issues/164
  it('should resize all row headers when cell height changes', function () {
    var longstr = "465465465465 4654654654654 654654654654654 654654654654654 65465465 465 46565 465";
    $container.width(500);

    runs(function () {
      $container.handsontable({
        rowHeaders: true
      });
      $container.handsontable('setDataAtCell', 2, 2, longstr);
    });

    waits(10);

    runs(function () {
      $container.handsontable('setDataAtCell', 1, 1, longstr);
    });

    waits(10);

    runs(function () {
      expect($container.find('table.htCore').height()).toEqual($container.find('table.htBlockedCols').height());
    });
  });
});