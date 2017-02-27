describe('Core_paste', function () {
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

  var arrayOfArrays = function () {
    return [
      ["", "Kia", "Nissan", "Toyota", "Honda"],
      ["2008", 10, 11, 12, 13],
      ["2009", 20, 11, 14, 13],
      ["2010", 30, 15, 12, 13]
    ];
  };

  it('should not create new rows or columns when allowInsertRow and allowInsertColumn equal false', function (done) {
    handsontable({
      data: arrayOfArrays(),
      pasteMode: 'shift_down',
      allowInsertRow:false,
      allowInsertColumn: false
    });

    selectCell(3, 4); //selectAll
    triggerPaste('Kia\tNissan\tToyota');

    setTimeout(function () {
      var expected = arrayOfArrays();
      expected[3][4] = "Kia";
      expect(getData()).toEqual(expected);
      done();
    }, 60);
  });

 it('should shift data down instead of overwrite when paste (when allowInsertRow = false)', function (done) {
    handsontable({
      data: arrayOfArrays(),
      pasteMode: 'shift_down',
      allowInsertRow:false
    });

    selectCell(1, 0); //selectAll
    triggerPaste('Kia\tNissan\tToyota');

    setTimeout(function () {
      expect(getData().length).toEqual(4);
      expect(getData(0,0,2,4)).toEqual([["", "Kia", "Nissan", "Toyota", "Honda"],["Kia", "Nissan", "Toyota", 12, 13], ["2008", 10, 11, 14, 13]]);
      done();
    }, 60);
  });

 it('should shift data down instead of overwrite when paste (minSpareRows > 0)', function (done) {
    handsontable({
      data: arrayOfArrays(),
      pasteMode: 'shift_down',
      minSpareRows: 1
    });

    selectCell(1, 0); //selectAll
    triggerPaste('Kia\tNissan\tToyota');

    setTimeout(function () {
      expect(getData().length).toEqual(6);
      expect(getData(0,0,2,4)).toEqual([["", "Kia", "Nissan", "Toyota", "Honda"],["Kia", "Nissan", "Toyota", 12, 13], ["2008", 10, 11, 14, 13]]);
      done();
    }, 60);
  });

  it('should shift right insert instead of overwrite when paste', function (done) {
    handsontable({
      data: arrayOfArrays(),
      pasteMode: 'shift_right',
      allowInsertColumn: false
    });

    selectCell(1, 0); //selectAll
    triggerPaste('Kia\tNissan\tToyota');

    setTimeout(function () {
      expect(getData()[0].length).toEqual(5);
      expect(getDataAtRow(1)).toEqual(["Kia", "Nissan", "Toyota", "2008", 10]);
      done();
    }, 60);
  });

  it('should shift right insert instead of overwrite when paste (minSpareCols > 0)', function (done) {
    handsontable({
      data: arrayOfArrays(),
      pasteMode: 'shift_right',
      minSpareCols: 1
    });

    selectCell(1, 0); //selectAll
    triggerPaste('Kia\tNissan\tToyota');

    setTimeout(function () {
      expect(getData()[0].length).toEqual(9);
      expect(getDataAtRow(1)).toEqual(["Kia", "Nissan", "Toyota", "2008", 10, 11, 12, 13, null]);
      done();
    }, 60);
  });

  it('should not throw an error when changes are null in `once` hook', function (done) {
    var errors = 0;

    try {
      handsontable({
        data: arrayOfArrays(),
        afterChange: function (changes, source) {
          if (source === 'loadData') return;

          loadData(arrayOfArrays());
        }
      });

      selectCell(1, 0); //selectAll
      triggerPaste('Kia\tNissan\tToyota');

    } catch (e) {
      errors++;
    }

    setTimeout(function () {
      expect(errors).toEqual(0);
      done();
    }, 60);
  });

  it("should not paste any data, if no cell is selected", function (done) {

    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(3, 1)
    });

    var copiedData1 = "foo";
    var copiedData2 = "bar";

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
    expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('A2');
    expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('A3');

    expect(getSelected()).toBeUndefined();

    hot.copyPaste.triggerPaste($.Event(), copiedData1);

    setTimeout(function () {
      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('A2');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('A3');
    }, 100);

    setTimeout(function () {
      selectCell(1, 0, 2, 0);

      hot.copyPaste.triggerPaste($.Event(), copiedData2);
    }, 200);

    setTimeout(function () {
      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual(copiedData2);
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual(copiedData2);
      done();
    }, 300);
  });

  it("should not paste any data, if no cell is selected (select/deselect cell using mouse)", function (done) {

    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(3, 1)
    });

    var copiedData = "foo";

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
    expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('A2');
    expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('A3');

    this.$container.find('tbody tr:eq(1) td:eq(0)').simulate('mousedown');
    this.$container.find('tbody tr:eq(1) td:eq(0)').simulate('mouseup');

    expect(getSelected()).toEqual([1, 0, 1, 0]);

    $('html').simulate('mousedown');

    expect(getSelected()).toBeUndefined();

    hot.copyPaste.triggerPaste($.Event(), copiedData);

    setTimeout(function () {
      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('A2');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('A3');
      done();
    }, 100);
  });
});
