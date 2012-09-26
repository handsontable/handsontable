describe('RowHeader', function () {
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
    expect(ths.eq(0).text().trim()).toEqual('1');
    expect(ths.eq(1).text().trim()).toEqual('2');
    expect(ths.eq(2).text().trim()).toEqual('3');
    expect(ths.eq(3).text().trim()).toEqual('4');
    expect(ths.eq(4).text().trim()).toEqual('5');
    expect(ths.eq(5).text().trim()).toEqual('1');
    expect(ths.eq(6).text().trim()).toEqual('2');
    expect(ths.eq(7).text().trim()).toEqual('3');
    expect(ths.eq(8).text().trim()).toEqual('4');
    expect(ths.eq(9).text().trim()).toEqual('5');
  });

  it('should show row headers with custom label', function () {
    var startRows = 5;
    $container.handsontable({
      rows: startRows,
      rowHeaders: ['First', 'Second', 'Third']
    });
    var ths = $container.find('.htRowHeader');
    expect(ths.length).toEqual(2 * startRows); //2x startRows because they are duplicated on layer above grid
    expect(ths.eq(0).text().trim()).toEqual('First');
    expect(ths.eq(1).text().trim()).toEqual('Second');
    expect(ths.eq(2).text().trim()).toEqual('Third');
    expect(ths.eq(3).text().trim()).toEqual('4');
    expect(ths.eq(4).text().trim()).toEqual('5');
    expect(ths.eq(5).text().trim()).toEqual('First');
    expect(ths.eq(6).text().trim()).toEqual('Second');
    expect(ths.eq(7).text().trim()).toEqual('Third');
    expect(ths.eq(8).text().trim()).toEqual('4');
    expect(ths.eq(9).text().trim()).toEqual('5');
  });

  it('should not show row headers if false', function () {
    $container.handsontable({
      rowHeaders: false
    });
    expect($container.find('.htRowHeader').length).toEqual(0);
  });
});