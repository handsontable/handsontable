describe('ColHeader', function () {
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

  it('should not show col headers by default', function () {
    var that = this;
    handsontable();

    expect(that.$container.find('thead th').length).toEqual(0);
  });

  it('should show col headers if true', function () {
    var that = this;
    handsontable({
      colHeaders: true
    });

    expect(that.$container.find('thead th').length).toBeGreaterThan(0);
  });

  it('should show col headers numbered 1-10 by default', function () {
    var that = this;
    var startCols = 5;
    handsontable({
      startCols: startCols,
      colHeaders: true
    });

    var ths = that.$container.find('thead th');
    expect(ths.length).toEqual(startCols);
    expect($.trim(ths.eq(0).text())).toEqual('A');
    expect($.trim(ths.eq(1).text())).toEqual('B');
    expect($.trim(ths.eq(2).text())).toEqual('C');
    expect($.trim(ths.eq(3).text())).toEqual('D');
    expect($.trim(ths.eq(4).text())).toEqual('E');
  });

  it('should show col headers with custom label', function () {
    var that = this;
    var startCols = 5;
    handsontable({
      startCols: startCols,
      colHeaders: ['First', 'Second', 'Third']
    });

    var ths = that.$container.find('thead th');
    expect(ths.length).toEqual(startCols);
    expect($.trim(ths.eq(0).text())).toEqual('First');
    expect($.trim(ths.eq(1).text())).toEqual('Second');
    expect($.trim(ths.eq(2).text())).toEqual('Third');
    expect($.trim(ths.eq(3).text())).toEqual('D');
    expect($.trim(ths.eq(4).text())).toEqual('E');
  });

  it('should not show col headers if false', function () {
    var that = this;
    handsontable({
      colHeaders: false
    });

    expect(that.$container.find('th.htColHeader').length).toEqual(0);
  });

  it('should hide columns headers after updateSettings', function(){
     var hot  = handsontable({
       startCols: 5,
       colHeaders: true
     });

    expect(this.$container.find('thead th').length).toEqual(5);

    hot.updateSettings({
      colHeaders: false
    });

    expect(this.$container.find('thead th').length).toEqual(0);
  });

  it('should show/hide columns headers after updateSettings', function(){
    var hot  = handsontable({
      startCols: 5,
      colHeaders: true
    });

    expect(this.$container.find('thead th').length).toEqual(5);

    hot.updateSettings({
      colHeaders: false
    });

    expect(this.$container.find('thead th').length).toEqual(0);

    hot.updateSettings({
      colHeaders: true
    });

    expect(this.$container.find('thead th').length).toEqual(5);

    hot.updateSettings({
      colHeaders: false
    });

    expect(this.$container.find('thead th').length).toEqual(0);
  });

  it('should show columns headers after updateSettings', function(){
    var hot  = handsontable({
      startCols: 5,
      colHeaders: false
    });

    expect(this.$container.find('thead th').length).toEqual(0);

    hot.updateSettings({
      colHeaders: true
    });

    expect(this.$container.find('thead th').length).toEqual(5);
  });

  it('should show new columns headers after updateSettings', function(){
    var hot  = handsontable({
      startCols: 3,
      colHeaders: ['A', 'B', 'C']
    });

    expect(this.$container.find('thead th:eq(0)').text()).toEqual('A');
    expect(this.$container.find('thead th:eq(1)').text()).toEqual('B');
    expect(this.$container.find('thead th:eq(2)').text()).toEqual('C');

    hot.updateSettings({
      colHeaders: ['X', 'Y', 'Z']
    });

    expect(this.$container.find('thead th:eq(0)').text()).toEqual('X');
    expect(this.$container.find('thead th:eq(1)').text()).toEqual('Y');
    expect(this.$container.find('thead th:eq(2)').text()).toEqual('Z');

  });
});