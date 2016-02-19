describe('numericValidator', function () {
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

  it('should validate an empty string (default behavior)', function () {
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

    setDataAtCell(2, 0, '');

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(onAfterValidate).toHaveBeenCalledWith(true, '', 2, 'id', undefined, undefined);
    });
  });

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

  describe("allowEmpty", function() {
    it('should not validate an empty string when allowEmpty is set as `false`', function () {
      var onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          {data: 'id', type: 'numeric', allowEmpty: false},
          {data: 'name'},
          {data: 'lastName'}
        ],
        afterValidate : onAfterValidate
      });

      setDataAtCell(2, 0, '');

      waitsFor(function () {
        return onAfterValidate.calls.length > 0;
      }, 'Cell validation', 1000);

      runs(function () {
        expect(onAfterValidate).toHaveBeenCalledWith(false, '', 2, 'id', undefined, undefined);
      });
    });

    it('should not validate `null` when allowEmpty is set as `false`', function () {
      var onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          {data: 'id', type: 'numeric', allowEmpty: false},
          {data: 'name'},
          {data: 'lastName'}
        ],
        afterValidate : onAfterValidate
      });

      setDataAtCell(2, 0, null);

      waitsFor(function () {
        return onAfterValidate.calls.length > 0;
      }, 'Cell validation', 1000);

      runs(function () {
        expect(onAfterValidate).toHaveBeenCalledWith(false, null, 2, 'id', undefined, undefined);
      });
    });

    it('should not validate `undefined` when allowEmpty is set as `false`', function () {
      var onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          {data: 'id', type: 'numeric', allowEmpty: false},
          {data: 'name'},
          {data: 'lastName'}
        ],
        afterValidate : onAfterValidate
      });

      setDataAtCell(2, 0, void 0);

      waitsFor(function () {
        return onAfterValidate.calls.length > 0;
      }, 'Cell validation', 1000);

      runs(function () {
        expect(onAfterValidate).toHaveBeenCalledWith(false, void 0, 2, 'id', undefined, undefined);
      });
    });

    it('should validate 0 when allowEmpty is set as `false`', function () {
      var onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          {data: 'id', type: 'numeric', allowEmpty: false},
          {data: 'name'},
          {data: 'lastName'}
        ],
        afterValidate : onAfterValidate
      });

      setDataAtCell(2, 0, 0);

      waitsFor(function () {
        return onAfterValidate.calls.length > 0;
      }, 'Cell validation', 1000);

      runs(function () {
        expect(onAfterValidate).toHaveBeenCalledWith(true, 0, 2, 'id', undefined, undefined);
      });
    });
  });
});
