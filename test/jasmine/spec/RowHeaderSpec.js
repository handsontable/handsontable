describe('RowHeader', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should not show row headers by default', function () {
    var that = this;
    handsontable();

    expect(that.$container.find('tbody th').length).toEqual(0);
  });

  it('should show row headers if true', function () {
    var that = this;
    handsontable({
      rowHeaders: true
    });

    expect(that.$container.find('tbody th').length).toBeGreaterThan(0);
  });

  it('should show row headers numbered 1-10 by default', function () {
    var that = this;
    var startRows = 5;
    handsontable({
      startRows: startRows,
      rowHeaders: true
    });

    var ths = that.$container.find('tbody th');
    expect(ths.length).toEqual(startRows);
    expect($.trim(ths.eq(0).text())).toEqual('1');
    expect($.trim(ths.eq(1).text())).toEqual('2');
    expect($.trim(ths.eq(2).text())).toEqual('3');
    expect($.trim(ths.eq(3).text())).toEqual('4');
    expect($.trim(ths.eq(4).text())).toEqual('5');
  });

  it('should show row headers with custom label', function () {
    var that = this;
    var startRows = 5;
    handsontable({
      startRows: startRows,
      rowHeaders: ['First', 'Second', 'Third']
    });

    var ths = that.$container.find('tbody th');
    expect(ths.length).toEqual(startRows);
    expect($.trim(ths.eq(0).text())).toEqual('First');
    expect($.trim(ths.eq(1).text())).toEqual('Second');
    expect($.trim(ths.eq(2).text())).toEqual('Third');
    expect($.trim(ths.eq(3).text())).toEqual('4');
    expect($.trim(ths.eq(4).text())).toEqual('5');
  });

  it('should not show row headers if false', function () {
    var that = this;
    handsontable({
      rowHeaders: false
    });

    expect(that.$container.find('tbody th').length).toEqual(0);
  });

  it('should hide rows headers after updateSetting', function(){
    var hot  = handsontable({
      startRows: 5,
      rowHeaders: true
    });

    expect(this.$container.find('tbody th').length).toEqual(5);

    hot.updateSettings({
      rowHeaders: false
    });

    expect(this.$container.find('tbody th').length).toEqual(0);
  });

  it('should show rows headers after updateSettings', function(){
    var hot  = handsontable({
      startRows: 5,
      rowHeaders: false
    });

    expect(this.$container.find('tbody th').length).toEqual(0);

    hot.updateSettings({
      rowHeaders: true
    });

    expect(this.$container.find('tbody th').length).toEqual(5);
  });

  it('should show/hide rows headers after multiple updateSettings', function(){
    var hot  = handsontable({
      startRows: 5,
      rowHeaders: false
    });

    expect(this.$container.find('tbody th').length).toEqual(0);

    hot.updateSettings({
      rowHeaders: true
    });

    expect(this.$container.find('tbody th').length).toEqual(5);

    hot.updateSettings({
      rowHeaders: false
    });

    expect(this.$container.find('tbody th').length).toEqual(0);

    hot.updateSettings({
      rowHeaders: true
    });

    expect(this.$container.find('tbody th').length).toEqual(5);

  });

  it('should show new rows headers after updateSettings', function(){
    var hot  = handsontable({
      startCols: 3,
      rowHeaders: ['A', 'B', 'C']
    });

    expect(this.$container.find('tbody tr:eq(0) th:eq(0)').text()).toEqual('A');
    expect(this.$container.find('tbody tr:eq(1) th:eq(0)').text()).toEqual('B');
    expect(this.$container.find('tbody tr:eq(2) th:eq(0)').text()).toEqual('C');

    hot.updateSettings({
      rowHeaders: ['X', 'Y', 'Z']
    });

    expect(this.$container.find('tbody tr:eq(0) th:eq(0)').text()).toEqual('X');
    expect(this.$container.find('tbody tr:eq(1) th:eq(0)').text()).toEqual('Y');
    expect(this.$container.find('tbody tr:eq(2) th:eq(0)').text()).toEqual('Z');

  });
});