describe('ColHeader', function () {
  var $container,
    id = 'testContainer';

  beforeEach(function () {
    $container = $('<div id="' + id + '"></div>');
  });

  afterEach(function () {
    $('#' + id).remove();
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
      cols: startCols,
      colHeaders: true
    });
    var ths = $container.find('th.htColHeader');
    expect(ths.length).toEqual(2 * startCols); //2x startCols because they are duplicated on layer above grid
    expect(ths.eq(0).text().trim()).toEqual('A');
    expect(ths.eq(1).text().trim()).toEqual('B');
    expect(ths.eq(2).text().trim()).toEqual('C');
    expect(ths.eq(3).text().trim()).toEqual('D');
    expect(ths.eq(4).text().trim()).toEqual('E');
    expect(ths.eq(5).text().trim()).toEqual('A');
    expect(ths.eq(6).text().trim()).toEqual('B');
    expect(ths.eq(7).text().trim()).toEqual('C');
    expect(ths.eq(8).text().trim()).toEqual('D');
    expect(ths.eq(9).text().trim()).toEqual('E');
  });

  it('should show col headers with custom label', function () {
    var startCols = 5;
    $container.handsontable({
      cols: startCols,
      colHeaders: ['First', 'Second', 'Third']
    });
    var ths = $container.find('th.htColHeader');
    expect(ths.length).toEqual(2 * startCols); //2x startCols because they are duplicated on layer above grid
    expect(ths.eq(0).text().trim()).toEqual('First');
    expect(ths.eq(1).text().trim()).toEqual('Second');
    expect(ths.eq(2).text().trim()).toEqual('Third');
    expect(ths.eq(3).text().trim()).toEqual('D');
    expect(ths.eq(4).text().trim()).toEqual('E');
    expect(ths.eq(5).text().trim()).toEqual('First');
    expect(ths.eq(6).text().trim()).toEqual('Second');
    expect(ths.eq(7).text().trim()).toEqual('Third');
    expect(ths.eq(8).text().trim()).toEqual('D');
    expect(ths.eq(9).text().trim()).toEqual('E');
  });

  it('should not show col headers if false', function () {
    $container.handsontable({
      colHeaders: false
    });
    expect($container.find('th.htColHeader').length).toEqual(0);
  });
});