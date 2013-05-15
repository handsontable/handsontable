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

    runs(function () {
      handsontable({
        data : arrayOfArrays(),
        onChange: function (changes) {
          output = changes;
        }
      });
      populateFromArray(0, 0, [["test","test"],["test","test"]], 1, 1);
    });

    waitsFor(function () {
      return (output != null)
    }, "onChange callback called", 100);

    runs(function () {
      expect(output).toEqual([[0,0,'','test'],[0,1,'Kia','test'],[1,0,'2008','test'],[1,1,10,'test']]);
    });
  });

  it('should populate single value for whole selection', function () {
    var output = null;

    runs(function () {
      handsontable({
        data : arrayOfArrays(),
        onChange: function (changes) {
          output = changes;
        }
      });
      populateFromArray(0, 0, [["test"]], 3, 0);
    });

    waitsFor(function () {
      return (output != null)
    }, "onChange callback called", 100);

    runs(function () {
      expect(output).toEqual([[0,0,'','test'],[1,0,'2008','test'],[2,0,'2009','test'],[3,0,'2010','test']]);
    });
  });


});