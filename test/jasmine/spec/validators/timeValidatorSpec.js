describe('timeValidator', function () {
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
      {time: "4:10:05 am", name: "Ted", lastName: "Right"},
      {time: "17:15:25", name: "Frank", lastName: "Honest"},
      {time: "14:65:45 am", name: "Joan", lastName: "Well"},
      {time: "33:25:05", name: "Sid", lastName: "Strong"}
    ];
  };

  it("should validate an empty string (default behavior)", function () {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'time', type: 'time'},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate: onAfterValidate
    });

    setDataAtCell(0, 0, '');

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(onAfterValidate).toHaveBeenCalledWith(true, '', 0, 'time', undefined, undefined);
    });
  });

  it("should not positively validate a non-date format", function () {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'time', type: 'time'},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate: onAfterValidate
    });

    setDataAtCell(0, 0, 'nd');

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(onAfterValidate).toHaveBeenCalledWith(false, 'nd', 0, 'time', undefined, undefined);
    });
  });

  it("should not positively validate a incorrect time string", function () {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'time', type: 'time'},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate: onAfterValidate
    });

    setDataAtCell(0, 0, '30:10:25');

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(onAfterValidate).toHaveBeenCalledWith(false, '30:10:25', 0, 'time', undefined, undefined);
    });
  });

  it("should not positively validate a time string in not default format", function () {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'time', type: 'time'},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate: onAfterValidate
    });

    setDataAtCell(1, 0, '20:20:01');

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(onAfterValidate).toHaveBeenCalledWith(false, '20:20:01', 1, 'time', undefined, undefined);
    });
  });

  it("should not positively validate a time string in wrong format (if custom format is provided)", function () {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'time', type: 'time', timeFormat: 'HH:mm:ss'},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate: onAfterValidate
    });

    setDataAtCell(1, 0, '5:10:15 am');

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(onAfterValidate).toHaveBeenCalledWith(false, '5:10:15 am', 1, 'time', undefined, undefined);
    });
  });

  it("should positively validate a date string in correct format (if custom format is provided)", function () {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'time', type: 'time', timeFormat: 'HH:mm:ss'},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate: onAfterValidate
    });

    setDataAtCell(1, 0, '16:32:03');

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(onAfterValidate).toHaveBeenCalledWith(true, '16:32:03', 1, 'time', undefined, undefined);
    });
  });

  describe("allowEmpty", function() {
    it("should not validate an empty string when allowEmpty is set as `false`", function () {
      var onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          {data: 'time', type: 'time', dateFormat: 'HH:mm', allowEmpty: false},
          {data: 'name'},
          {data: 'lastName'}
        ],
        afterValidate: onAfterValidate
      });

      setDataAtCell(1, 0, '');

      waitsFor(function () {
        return onAfterValidate.calls.length > 0;
      }, 'Cell validation', 1000);

      runs(function () {
        expect(onAfterValidate).toHaveBeenCalledWith(false, '', 1, 'time', undefined, undefined);
      });
    });

    it("should not validate `null` when allowEmpty is set as `false`", function () {
      var onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          {data: 'time', type: 'time', dateFormat: 'HH:mm', allowEmpty: false},
          {data: 'name'},
          {data: 'lastName'}
        ],
        afterValidate: onAfterValidate
      });

      setDataAtCell(1, 0, null);

      waitsFor(function () {
        return onAfterValidate.calls.length > 0;
      }, 'Cell validation', 1000);

      runs(function () {
        expect(onAfterValidate).toHaveBeenCalledWith(false, null, 1, 'time', undefined, undefined);
      });
    });

    it("should not validate `undefined` when allowEmpty is set as `false`", function () {
      var onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          {data: 'time', type: 'time', dateFormat: 'HH:mm', allowEmpty: false},
          {data: 'name'},
          {data: 'lastName'}
        ],
        afterValidate: onAfterValidate
      });

      setDataAtCell(1, 0, void 0);

      waitsFor(function () {
        return onAfterValidate.calls.length > 0;
      }, 'Cell validation', 1000);

      runs(function () {
        expect(onAfterValidate).toHaveBeenCalledWith(false, void 0, 1, 'time', undefined, undefined);
      });
    });
  });

  describe("correctFormat", function () {
    it("should not make any changes to entered string if correctFormat is not set", function () {
      var onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          {data: 'time', type: 'time', timeFormat: "h:mm:ss a"},
          {data: 'name'},
          {data: 'lastName'}
        ],
        afterValidate: onAfterValidate
      });

      setDataAtCell(1, 0, '13:00:00');

      waitsFor(function () {
        return onAfterValidate.calls.length > 0;
      }, 'Cell validation', 1000);

      runs(function () {
        expect(onAfterValidate).toHaveBeenCalledWith(false, '13:00:00', 1, 'time', undefined, undefined);
      });
    });

    it("should not make any changes to entered string if correctFormat is set to false", function () {
      var onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          {data: 'time', type: 'time', timeFormat: "h:mm:ss a", correctFormat: false},
          {data: 'name'},
          {data: 'lastName'}
        ],
        afterValidate: onAfterValidate
      });

      setDataAtCell(1, 0, '13:00:00');

      waitsFor(function () {
        return onAfterValidate.calls.length > 0;
      }, 'Cell validation', 1000);

      runs(function () {
        expect(onAfterValidate).toHaveBeenCalledWith(false, '13:00:00', 1, 'time', undefined, undefined);
      });
    })

    it("should rewrite the string to the correct format if a time-string in different format is provided", function () {
      var onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          {data: 'time', type: 'time', timeFormat: "h:mm:ss a", correctFormat: true},
          {data: 'lastName'}
        ],
        afterValidate: onAfterValidate
      });

      setDataAtCell(1, 0, '16:35:01');

      waitsFor(function () {
        return onAfterValidate.calls.length > 0;
      }, 'Cell validation', 1000);

      runs(function () {
        expect(onAfterValidate).toHaveBeenCalledWith(true, '16:35:01', 1, 'time', undefined, undefined);
      });

      waits(30);

      runs(function () {
        expect(getDataAtCell(1, 0)).toEqual("4:35:01 pm");
      });
    });

    it("should rewrite the string to the correct format if a time in micro-timestamp format is provided", function () {
      var onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          {data: 'time', type: 'time', timeFormat: "HH:mm:ss", correctFormat: true},
          {data: 'lastName'}
        ],
        afterValidate: onAfterValidate
      });

      var currentDateTime = new Date();

      setDataAtCell(1, 0, currentDateTime.getTime()); // timestamp in milliseconds

      waitsFor(function () {
        return onAfterValidate.calls.length > 0;
      }, 'Cell validation', 1000);

      runs(function () {
        expect(onAfterValidate).toHaveBeenCalledWith(true, currentDateTime.getTime(), 1, 'time', undefined, undefined);
      });

      waits(30);

      runs(function () {
        var addLeadingZero = function(number) {
          return number < 10 ? '0' + number : number;
        };
        expect(getDataAtCell(1, 0)).toEqual(addLeadingZero(currentDateTime.getHours()) + ':' + addLeadingZero(currentDateTime.getMinutes()) +':' + addLeadingZero(currentDateTime.getSeconds()));
      });
    });

    it("should rewrite the string to the correct format if a time in ISO8601 format is provided", function () {
      var onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          {data: 'time', type: 'time', timeFormat: "HH:mm:ss", correctFormat: true},
          {data: 'lastName'}
        ],
        afterValidate: onAfterValidate
      });

      var currentDateTime = new Date();

      setDataAtCell(1, 0, currentDateTime.toISOString()); // ISO-formatted datetime, sth like '2016-02-19T12:40:04.983Z'

      waitsFor(function () {
        return onAfterValidate.calls.length > 0;
      }, 'Cell validation', 1000);

      runs(function () {
        expect(onAfterValidate).toHaveBeenCalledWith(true, currentDateTime.toISOString(), 1, 'time', undefined, undefined);
      });

      waits(30);

      runs(function () {
        var addLeadingZero = function(number) {
          return number < 10 ? '0' + number : number;
        };
        expect(getDataAtCell(1, 0)).toEqual(addLeadingZero(currentDateTime.getHours()) + ':' + addLeadingZero(currentDateTime.getMinutes()) +':' + addLeadingZero(currentDateTime.getSeconds()));
      });
    });

    it("should rewrite one and two-digit number to the correct format at hours", function () {
      var onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          {data: 'time', type: 'time', timeFormat: "hh:mm:ss a", correctFormat: true},
          {data: 'lastName'}
        ],
        afterValidate: onAfterValidate
      });

      setDataAtCell(1, 0, '19');

      waitsFor(function () {
        return onAfterValidate.calls.length > 0;
      }, 'Cell validation', 1000);

      runs(function () {
        expect(onAfterValidate).toHaveBeenCalledWith(true, '19', 1, 'time', undefined, undefined);
      });

      waits(30);

      runs(function () {
        expect(getDataAtCell(1, 0)).toEqual("07:00:00 pm");
      });
    });

    it("should rewrite one and two-digit number to the correct format at minutes", function () {
      var onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          {data: 'time', type: 'time', timeFormat: "mm:ss", correctFormat: true},
          {data: 'lastName'}
        ],
        afterValidate: onAfterValidate
      });

      setDataAtCell(1, 0, '57');

      waitsFor(function () {
        return onAfterValidate.calls.length > 0;
      }, 'Cell validation', 1000);

      runs(function () {
        expect(onAfterValidate).toHaveBeenCalledWith(true, '57', 1, 'time', undefined, undefined);
      });

      waits(30);

      runs(function () {
        expect(getDataAtCell(1, 0)).toEqual("57:00");
      });
    });

    it("should not try to correct format of non-date strings", function () {
      var onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          {data: 'time', type: 'time', timeFormat: "HH:mm:ss", correctFormat: true},
          {data: 'name'},
          {data: 'lastName'}
        ],
        afterValidate: onAfterValidate
      });

      setDataAtCell(1, 0, 'test non-time string');

      waitsFor(function () {
        return onAfterValidate.calls.length > 0;
      }, 'Cell validation', 1000);

      runs(function () {
        expect(onAfterValidate).toHaveBeenCalledWith(false, 'test non-time string', 1, 'time', undefined, undefined);
      });

      waits(30);

    });

  });

});
