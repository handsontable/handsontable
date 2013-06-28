describe('NumericValidator', function () {
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

  var arrayOfObjects = function () {
    return [
      {id: 1, name: "Ted", lastName: "Right"},
      {id: 2, name: "Frank", lastName: "Honest"},
      {id: 3, name: "Joan", lastName: "Well"},
      {id: 4, name: "Sid", lastName: "Strong"},
      {id: 5, name: "Jane", lastName: "Neat"},
      {id: 6, name: "Chuck", lastName: "Jackson"},
      {id: 7, name: "Meg", lastName: "Jansen"},
      {id: 8, name: "Rob", lastName: "Norris"},
      {id: 9, name: "Sean", lastName: "O'Hara"},
      {id: 10, name: "Eve", lastName: "Branson"}
    ];
  };

  it('should not validate non numeric string', function () {
    var valid = null;

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'id', type: 'numeric'},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate : function (result, value) {
        if(value === "test") {
          valid = result;
        }
      }
    });
    setDataAtCell(2, 0, 'test');

    expect(valid).toEqual(false);
  });

  it('should validate numeric string', function () {
    var valid = null;

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'id', type: 'numeric'},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate : function (result) {
        valid = result;
      }
    });
    setDataAtCell(2, 0, '123');

    expect(valid).toEqual(true);
  });

  it('should validate signed numeric string', function () {
    var valid = null;

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'id', type: 'numeric'},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate : function (result) {
        valid = result;
      }
    });
    setDataAtCell(2, 0, '-123');

    expect(valid).toEqual(true);
  });

});