describe('HandsontableObserveChanges', function () {
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

  function createHOT(data, observeChanges) {
    handsontable({
      data: data,
      width: 200,
      height: 200,
      observeChanges: observeChanges
    });
  }

  it('should render newly added row', function () {
    var data = createSpreadsheetData(2, 2);
    createHOT(data, true);
    data.push(["A3", "B3"]);

    waits(100); //Object.observe is async

    runs(function () {
      expect(this.$container.find('tr').length).toEqual(3);
      expect(this.$container.find('col').length).toEqual(2);
    });
  });

  it('should render newly added column', function () {
    var data = createSpreadsheetData(2, 2);
    createHOT(data, true);
    data[0].push("C1");
    data[1].push("C2");

    waits(100); //Object.observe is async

    runs(function () {
      expect(this.$container.find('tr').length).toEqual(2);
      expect(this.$container.find('col').length).toEqual(3);
    });
  });

  it('should render removed row', function () {
    var data = createSpreadsheetData(2, 2);
    createHOT(data, true);
    data.splice(0, 1); //removes one row at index 0

    waits(100); //Object.observe is async

    runs(function () {
      expect(this.$container.find('tr').length).toEqual(1);
      expect(this.$container.find('col').length).toEqual(2);
    });
  });

  it('should render removed column', function () {
    var data = createSpreadsheetData(2, 2);
    createHOT(data, true);
    data[0].splice(0, 1); //removes one column at index 0 in first row
    data[1].splice(0, 1); //removes one column at index 0 in second row

    waits(100); //Object.observe is async

    runs(function () {
      expect(this.$container.find('tr').length).toEqual(2);
      expect(this.$container.find('col').length).toEqual(1);
    });
  });

  it('should render cell change from string to string', function () {
    var data = createSpreadsheetData(2, 2);
    createHOT(data, true);
    data[0][0] = 'new string';

    waits(100); //Object.observe is async

    runs(function () {
      expect(this.$container.find('td:eq(0)').html()).toEqual('new string');
    });
  });

  it('should render cell change in a new row', function () {
    var data = createSpreadsheetData(2, 2);
    createHOT(data, true);
    data.push(["A3", "B3"]);

    waits(100); //Object.observe is async

    runs(function () {
      expect(this.$container.find('tr:eq(2) td:eq(0)').html()).toEqual('A3');
      data[2][0] = 'new string';
    });

    waits(100); //Object.observe is async

    runs(function () {
      expect(this.$container.find('tr:eq(2) td:eq(0)').html()).toEqual('new string');
    });
  });

  it('should not render cell change when turned off (`observeChanges: false`)', function () {
    var data = createSpreadsheetData(2, 2);
    createHOT(data, false);
    data[0][0] = 'new string';

    waits(100); //Object.observe is async

    runs(function () {
      expect(this.$container.find('td:eq(0)').html()).toEqual('A0');
    });
  });
});