describe('RowHeader', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      this.$container.remove();
    }
  });

  it('should not show row headers by default', function () {
    var that = this;
    handsontable();

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(that.$container.find('tbody th').length).toEqual(0);
    });
  });

  it('should show row headers if true', function () {
    var that = this;
    handsontable({
      rowHeaders: true
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(that.$container.find('tbody th').length).toBeGreaterThan(0);
    });
  });

  it('should show row headers numbered 1-10 by default', function () {
    var that = this;
    var startRows = 5;
    handsontable({
      startRows: startRows,
      rowHeaders: true
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      var ths = that.$container.find('tbody th');
      expect(ths.length).toEqual(startRows);
      expect($.trim(ths.eq(0).text())).toEqual('1');
      expect($.trim(ths.eq(1).text())).toEqual('2');
      expect($.trim(ths.eq(2).text())).toEqual('3');
      expect($.trim(ths.eq(3).text())).toEqual('4');
      expect($.trim(ths.eq(4).text())).toEqual('5');
    });
  });

  it('should show row headers with custom label', function () {
    var that = this;
    var startRows = 5;
    handsontable({
      startRows: startRows,
      rowHeaders: ['First', 'Second', 'Third']
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      var ths = that.$container.find('tbody th');
      expect(ths.length).toEqual(startRows);
      expect($.trim(ths.eq(0).text())).toEqual('First');
      expect($.trim(ths.eq(1).text())).toEqual('Second');
      expect($.trim(ths.eq(2).text())).toEqual('Third');
      expect($.trim(ths.eq(3).text())).toEqual('4');
      expect($.trim(ths.eq(4).text())).toEqual('5');
    });
  });

  it('should not show row headers if false', function () {
    var that = this;
    handsontable({
      rowHeaders: false
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(that.$container.find('tbody th').length).toEqual(0);
    });
  });
});