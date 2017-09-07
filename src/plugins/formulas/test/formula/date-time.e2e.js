describe('Formulas -> date & time functions', function() {
  var id = 'testContainer';

  beforeEach(function() {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('DATE', function() {
    var hot = handsontable({
      data: getDataForFormulas(1, 'name', '=DATE(2010, 12, 20)'),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    var date = hot.getDataAtCell(1, 1);

    expect(date instanceof Date).toBe(true);
    expect(date.getFullYear()).toBe(2010);
    expect(date.getMonth()).toBe(11);
    expect(date.getDate()).toBe(20);
  });

  it('DATEVALUE', function() {
    var hot = handsontable({
      data: getDataForFormulas(1, 'name', '=DATEVALUE("12/31/9999")'),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(2958465);
  });

  it('DAY', function() {
    var hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=DAY(2958465)', '=DAY("1/2/1900")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(31);
    expect(hot.getDataAtCell(2, 1)).toBe(2);
  });

  it('DAYS', function() {
    var hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=DAYS(5, 3)', '=DAYS("1/20/1900", "1/1/1900")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(2);
    expect(hot.getDataAtCell(2, 1)).toBe(19);
  });

  it('DAYS360', function() {
    var hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=DAYS360("1/1/1901", "12/31/1901", FALSE)', '=DAYS360("1/1/1901", "12/31/1901")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(360);
    expect(hot.getDataAtCell(2, 1)).toBe('#VALUE!');
  });

  it('EDATE', function() {
    var hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=EDATE("1/1/1900", 1)', '=EDATE("1/1/1900", 12)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(32);
    expect(hot.getDataAtCell(2, 1)).toBe(367);
  });

  it('EOMONTH', function() {
    var hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=EOMONTH("1/1/1900", 1)', '=EOMONTH("1/1/1900", 12)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(59);
    expect(hot.getDataAtCell(2, 1)).toBe(397);
  });

  it('HOUR', function() {
    var hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=HOUR("1/1/1900")', '=HOUR("1/1/1900 3:12")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(0);
    expect(hot.getDataAtCell(2, 1)).toBe(3);
  });

  it('INTERVAL', function() {
    var hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=INTERVAL(10000000)', '=INTERVAL(123)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('P3M25DT17H46M40S');
    expect(hot.getDataAtCell(2, 1)).toBe('PT2M3S');
  });

  it('ISOWEEKNUM', function() {
    var hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=ISOWEEKNUM("1/8/1901")', '=ISOWEEKNUM("12/29/1901")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(2);
    expect(hot.getDataAtCell(2, 1)).toBe(52);
  });

  it('MINUTE', function() {
    var hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=MINUTE("1/8/1901")', '=MINUTE("12/29/1901 22:12")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(0);
    expect(hot.getDataAtCell(2, 1)).toBe(12);
  });

  it('MONTH', function() {
    var hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=MONTH("1/8/1901")', '=MONTH("12/29/1901 22:12")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(1);
    expect(hot.getDataAtCell(2, 1)).toBe(12);
  });

  it('NETWORKDAYS', function() {
    var hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=NETWORKDAYS("2013-12-04", "2013-12-06")', '=NETWORKDAYS("12/4/2013", "12/4/2013")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(3);
    expect(hot.getDataAtCell(2, 1)).toBe(1);
  });

  it('NOW', function() {
    var hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=NOW()']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    var date = hot.getDataAtCell(1, 1);
    var now = new Date();

    expect(date instanceof Date).toBe(true);
    expect(date.getFullYear()).toBe(now.getFullYear());
    expect(date.getMonth()).toBe(now.getMonth());
    expect(date.getDate()).toBe(now.getDate());
  });

  it('SECOND', function() {
    var hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=SECOND("2/1/1901 13:33:12")', '=SECOND("4/4/2001 13:33:59")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(12);
    expect(hot.getDataAtCell(2, 1)).toBe(59);
  });

  it('TIME', function() {
    var hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=TIME(0, 0, 0)', '=TIME(24, 0, 0)', '=TIME(24, 0)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(0);
    expect(hot.getDataAtCell(2, 1)).toBe(1);
    expect(hot.getDataAtCell(3, 1)).toBe('#VALUE!');
  });

  it('TIMEVALUE', function() {
    var hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=TIMEVALUE("1/1/1900 00:00:00")', '=TIMEVALUE("1/1/1900 23:00:00")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(0);
    expect(hot.getDataAtCell(2, 1)).toBe(0.9583333333333334);
  });

  it('TODAY', function() {
    var hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=TODAY()']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1).getDate()).toBe(new Date().getDate());
  });

  it('WEEKDAY', function() {
    var hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=WEEKDAY("1/1/1901")', '=WEEKDAY("1/1/1901", 2)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(3);
    expect(hot.getDataAtCell(2, 1)).toBe(2);
  });

  it('WEEKNUM', function() {
    var hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=WEEKNUM("2/1/1900")', '=WEEKNUM("2/1/1909", 2)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(5);
    expect(hot.getDataAtCell(2, 1)).toBe(6);
  });

  it('WORKDAY', function() {
    var hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=WORKDAY("1/1/1900", 1)', '=WORKDAY("1/1/1900")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1) instanceof Date).toBe(true);
    expect(hot.getDataAtCell(1, 1).getDate()).toBe(2);
    expect(hot.getDataAtCell(2, 1)).toBe('#VALUE!');
  });

  it('YEAR', function() {
    var hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=YEAR("1/1/1900")', '=YEAR("12/12/2001")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(1900);
    expect(hot.getDataAtCell(2, 1)).toBe(2001);
  });

  it('YEARFRAC', function() {
    var hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=YEARFRAC("1/1/1900", "1/2/1900")', '=YEARFRAC("1/1/1900")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(0.002777777777777778);
    expect(hot.getDataAtCell(2, 1)).toBe('#VALUE!');
  });
});
