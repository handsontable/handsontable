describe('dateValidator', function () {
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
      {date: "01/01/2015", name: "Ted", lastName: "Right"},
      {date: "01/01/15", name: "Frank", lastName: "Honest"},
      {date: "41/01/2015", name: "Joan", lastName: "Well"},
      {date: "01/51/2015", name: "Sid", lastName: "Strong"}
    ];
  };

  it("should not positively validate a non-date string", function () {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'date', type: 'date'},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate: onAfterValidate
    });

    setDataAtCell(0, 0, 'wat');

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(onAfterValidate).toHaveBeenCalledWith(false, 'wat', 0, 'date', undefined, undefined);
    });
  });

  it("should not positively validate a incorrect date string", function () {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'date', type: 'date'},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate: onAfterValidate
    });

    setDataAtCell(0, 0, '33/01/2014');

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(onAfterValidate).toHaveBeenCalledWith(false, '33/01/2014', 0, 'date', undefined, undefined);
    });
  });

  it("should not positively validate a date string in wrong format", function () {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'date', type: 'date'},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate: onAfterValidate
    });

    setDataAtCell(1, 0, '01/01/15');

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(onAfterValidate).toHaveBeenCalledWith(false, '01/01/15', 1, 'date', undefined, undefined);
    });
  });

  it("should not positively validate a date string in wrong format (if custom format is provided)", function () {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'date', type: 'date', dateFormat: 'DD/MM/YY'},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate: onAfterValidate
    });

    setDataAtCell(1, 0, '01/01/2015');

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(onAfterValidate).toHaveBeenCalledWith(false, '01/01/2015', 1, 'date', undefined, undefined);
    });
  });

  it("should positively validate a date string in correct format", function () {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'date', type: 'date'},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate: onAfterValidate
    });

    setDataAtCell(1, 0, '01/01/2015');

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(onAfterValidate).toHaveBeenCalledWith(true, '01/01/2015', 1, 'date', undefined, undefined);
    });
  });

  it("should positively validate a date string in correct format (if custom format is provided)", function () {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'date', type: 'date', dateFormat: 'DD/MM/YY'},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate: onAfterValidate
    });

    setDataAtCell(1, 0, '23/03/15');

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(onAfterValidate).toHaveBeenCalledWith(true, '23/03/15', 1, 'date', undefined, undefined);
    });
  });

  describe("correctFormat", function () {
    it("should not make any changes to entered string if correctFormat is not set", function () {
      var onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          {data: 'date', type: 'date', dateFormat: "MM/DD/YY"},
          {data: 'name'},
          {data: 'lastName'}
        ],
        afterValidate: onAfterValidate
      });

      setDataAtCell(1, 0, '11/23/2013');

      waitsFor(function () {
        return onAfterValidate.calls.length > 0;
      }, 'Cell validation', 1000);

      runs(function () {
        expect(onAfterValidate).toHaveBeenCalledWith(false, '11/23/2013', 1, 'date', undefined, undefined);
      });
    });

    it("should not make any changes to entered string if correctFormat is set to false", function () {
      var onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          {data: 'date', type: 'date', dateFormat: "MM/DD/YY", correctFormat: false},
          {data: 'name'},
          {data: 'lastName'}
        ],
        afterValidate: onAfterValidate
      });

      setDataAtCell(1, 0, '11/23/2013');

      waitsFor(function () {
        return onAfterValidate.calls.length > 0;
      }, 'Cell validation', 1000);

      runs(function () {
        expect(onAfterValidate).toHaveBeenCalledWith(false, '11/23/2013', 1, 'date', undefined, undefined);
      });
    });

    it("should rewrite the string to the correct format if a date-string in different format is provided", function () {
      var onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          {data: 'date', type: 'date', dateFormat: "DD/MM/YY", correctFormat: true},
          {data: 'name'},
          {data: 'lastName'}
        ],
        afterValidate: onAfterValidate
      });

      setDataAtCell(1, 0, '11/23/2013');

      waitsFor(function () {
        return onAfterValidate.calls.length > 0;
      }, 'Cell validation', 1000);

      runs(function () {
        expect(onAfterValidate).toHaveBeenCalledWith(true, '11/23/2013', 1, 'date', undefined, undefined);
      });

      waits(30);

      runs(function () {
        expect(getDataAtCell(1, 0)).toEqual("23/11/13");
      });
    });

    it("should not try to correct format of non-date strings", function () {
      var onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          {data: 'date', type: 'date', dateFormat: "DD/MM/YY", correctFormat: true},
          {data: 'name'},
          {data: 'lastName'}
        ],
        afterValidate: onAfterValidate
      });

      setDataAtCell(1, 0, 'test non-date string');

      waitsFor(function () {
        return onAfterValidate.calls.length > 0;
      }, 'Cell validation', 1000);

      runs(function () {
        expect(onAfterValidate).toHaveBeenCalledWith(false, 'test non-date string', 1, 'date', undefined, undefined);
      });

      waits(30);

    });
  });

});
