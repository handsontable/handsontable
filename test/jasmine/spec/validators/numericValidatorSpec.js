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
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'id', type: 'numeric'},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate : onAfterValidate
    });

    setDataAtCell(2, 0, 'test');

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(onAfterValidate).toHaveBeenCalledWith(false, 'test', 2, 'id', undefined, undefined);
    });


  });

  it('should validate numeric string', function () {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'id', type: 'numeric'},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate : onAfterValidate
    });

    setDataAtCell(2, 0, '123');

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(onAfterValidate).toHaveBeenCalledWith(true, 123, 2, 'id', undefined, undefined);
    });

  });

  it('should validate signed numeric string', function () {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'id', type: 'numeric'},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate : onAfterValidate
    });

    setDataAtCell(2, 0, '-123');

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(onAfterValidate).toHaveBeenCalledWith(true, -123, 2, 'id', undefined, undefined);
    });
  });

  it('should validate empty string', function () {
    var out;

    Handsontable.NumericValidator('', function (result) {
      out = result;
    });

    expect(out).toBe(true);
  });

  //is this correct behavior is disputable, but at least it's consistent
  it('should validate null with the same empty string', function () {
    var out1, out2;

    Handsontable.NumericValidator('', function (result) {
      out1 = result;
    });

    Handsontable.NumericValidator(null, function (result) {
      out2 = result;
    });

    expect(out1).toBe(out2);
  });
});