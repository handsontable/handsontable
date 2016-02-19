describe('Core_getDataAt*', function () {
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

  var arrayOfObjects = function () {
    return [
      {
        "id.a.b.c": 1,
        "id": 1,
        "name": "Nannie Patel",
        "address": "Jenkin ville",
        "details": {
          "city": "Chicago"
        },
      },
      {
        "id.a.b.c": 2,
        "id": 2,
        "name": "Łucja Grożny and Środeńczak",
        "address": "Gardiner",
        "details": {
          "city": "New York"
        },
      },
    ];
  };

  it('should return data at specified row', function () {
    handsontable({
      data: arrayOfArrays()
    });

    expect(getDataAtRow(0)).toEqual(["", "Kia", "Nissan", "Toyota", "Honda"]);
  });

  it('should return data at specified col', function () {
    handsontable({
      data: arrayOfArrays()
    });

    expect(getDataAtCol(1)).toEqual(["Kia", 10, 20, 30]);
  });

  describe('Core_getDataAtRowProp', function () {
    it('should return data at specified column', function () {
      handsontable({
        data: arrayOfObjects()
      });

      expect(getDataAtRowProp(1, 'id.a.b.c')).toBe(2);
      expect(getDataAtRowProp(1, 'id')).toBe(2);
      expect(getDataAtRowProp(1, 'id')).toBe(2);
      expect(getDataAtRowProp(1, 'details.city')).toBe('New York');
    });
  });
});
