describe('Core_populateFromArray', function () {
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

  it('should call onChange callback', function () {
    var output = null;

    handsontable({
      data : arrayOfArrays(),
      onChange: function (changes) {
        output = changes;
      }
    });
    populateFromArray(0, 0, [["test","test"],["test","test"]], 1, 1);

    expect(output).toEqual([[0,0,'','test'],[0,1,'Kia','test'],[1,0,'2008','test'],[1,1,10,'test']]);
  });

  it('should populate single value for whole selection', function () {
    var output = null;

    handsontable({
      data : arrayOfArrays(),
      onChange: function (changes) {
        output = changes;
      }
    });
    populateFromArray(0, 0, [["test"]], 3, 0);

    expect(output).toEqual([[0,0,'','test'],[1,0,'2008','test'],[2,0,'2009','test'],[3,0,'2010','test']]);
  });

  it('should shift values down', function () {
    var output = null;

    handsontable({
      data : arrayOfArrays(),
      onChange: function (changes) {
        output = changes;
      },
      minSpareRows: 1
    });
    populateFromArray(0, 0, [["test","test2"],["test3","test4"]], 2, 2, null, 'shift_down');

    expect(getData()).toEqual([
      ["test", "test2", "test", "Toyota", "Honda"],
      ["test3", "test4", "test3", 12, 13],
      ["test", "test2", "test", 14, 13],
      ["", "Kia", "Nissan", 12, 13],
      ["2008", 10, 11, null, null],
      ["2009", 20, 11, null, null],
      ["2010", 30, 15, null, null],
      [null, null, null, null, null]
    ]);
  });

  it('should shift values right', function () {
    var output = null;

    handsontable({
      data : arrayOfArrays(),
      onChange: function (changes) {
        output = changes;
      },
      minSpareCols: 1
    });
    populateFromArray(0, 0, [["test","test2"],["test3","test4"]], 2, 2, null, 'shift_right');

    expect(getData()).toEqual([
      ["test", "test2", "test", "", "Kia", "Nissan", "Toyota", "Honda", null],
      ["test3", "test4", "test3", "2008", 10, 11, 12, 13, null],
      ["test", "test2", "test", "2009", 20, 11, 14, 13, null],
      ["2010", 30, 15, 12, 13, null, null, null, null]
    ]);
  });
});