describe('manualColumnResize', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');

    this.sortByColumn = function(columnIndex){
      this.$container.find('th span.columnSorting:eq(' + columnIndex + ')').click();
    }
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it("should change column widths at init", function () {
    handsontable({
      manualColumnResize: [100, 150, 180]
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').outerWidth()).toEqual(100);
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').outerWidth()).toEqual(150);
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').outerWidth()).toEqual(180);
  });

  it("should change the default column widths with updateSettings", function () {
    handsontable({
      manualColumnResize: true
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').outerWidth()).toEqual(50);
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').outerWidth()).toEqual(50);
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').outerWidth()).toEqual(50);

    updateSettings({
      manualColumnResize: [60, 50, 80]
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').outerWidth()).toEqual(60);
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').outerWidth()).toEqual(50);
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').outerWidth()).toEqual(80);
  });

  it("should change column widths with updateSettings", function () {
    handsontable({
      manualColumnResize: [100, 150, 180]
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').outerWidth()).toEqual(100);
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').outerWidth()).toEqual(150);
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').outerWidth()).toEqual(180);

    updateSettings({
      manualColumnResize: [60, 50, 80]
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').outerWidth()).toEqual(60);
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').outerWidth()).toEqual(50);
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').outerWidth()).toEqual(80);
  });

  it("should reset column widths", function () {
    handsontable({
      manualColumnResize: [100, 150, 180]
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').outerWidth()).toEqual(100);
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').outerWidth()).toEqual(150);
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').outerWidth()).toEqual(180);

    updateSettings({
      manualColumnResize: true
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').outerWidth()).toEqual(50);
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').outerWidth()).toEqual(50);
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').outerWidth()).toEqual(50);
  });
});