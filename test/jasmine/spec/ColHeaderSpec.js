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
    expect($container.find('th.htColHeader').length).toEqual(0);
  });

  it('should show col headers if true', function () {
    $container.handsontable({
      colHeaders: true
    });
    expect($container.find('th.htColHeader').length).toBeGreaterThan(0);
  });

  it('should show col headers numbered 1-10 by default', function () {
    var startCols = 5;
    $container.handsontable({
      startCols: startCols,
      colHeaders: true
    });
    var ths = $container.find('th.htColHeader');
    expect(ths.length).toEqual(2 * startCols); //2x startCols because they are duplicated on layer above grid
    expect($.trim(ths.eq(0).text())).toEqual('A');
    expect($.trim(ths.eq(1).text())).toEqual('B');
    expect($.trim(ths.eq(2).text())).toEqual('C');
    expect($.trim(ths.eq(3).text())).toEqual('D');
    expect($.trim(ths.eq(4).text())).toEqual('E');
    expect($.trim(ths.eq(5).text())).toEqual('A');
    expect($.trim(ths.eq(6).text())).toEqual('B');
    expect($.trim(ths.eq(7).text())).toEqual('C');
    expect($.trim(ths.eq(8).text())).toEqual('D');
    expect($.trim(ths.eq(9).text())).toEqual('E');
  });

  it('should show col headers with custom label', function () {
    var startCols = 5;
    $container.handsontable({
      startCols: startCols,
      colHeaders: ['First', 'Second', 'Third']
    });
    var ths = $container.find('th.htColHeader');
    expect(ths.length).toEqual(2 * startCols); //2x startCols because they are duplicated on layer above grid
    expect($.trim(ths.eq(0).text())).toEqual('First');
    expect($.trim(ths.eq(1).text())).toEqual('Second');
    expect($.trim(ths.eq(2).text())).toEqual('Third');
    expect($.trim(ths.eq(3).text())).toEqual('D');
    expect($.trim(ths.eq(4).text())).toEqual('E');
    expect($.trim(ths.eq(5).text())).toEqual('First');
    expect($.trim(ths.eq(6).text())).toEqual('Second');
    expect($.trim(ths.eq(7).text())).toEqual('Third');
    expect($.trim(ths.eq(8).text())).toEqual('D');
    expect($.trim(ths.eq(9).text())).toEqual('E');
  });

  it('should not show col headers if false', function () {
    $container.handsontable({
      colHeaders: false
    });
    expect($container.find('th.htColHeader').length).toEqual(0);
  });

  //https://github.com/warpech/jquery-handsontable/issues/164
  it('should resize all col headers when cell width changes', function () {
    var longstr = "465465465465 4654654654654 654654654654654 654654654654654 65465465 465 46565 465";
    $container.width(500);

    runs(function () {
      $container.handsontable({
        colHeaders: true
      });
      $container.handsontable('setDataAtCell', 2, 2, longstr);
    });

    waits(10);

    runs(function () {
      $container.handsontable('setDataAtCell', 1, 1, longstr);
    });

    waits(10);

    runs(function () {
      expect($container.find('table.htCore').width()).toEqual($container.find('table.htBlockedRows').width());
    });
  });
});