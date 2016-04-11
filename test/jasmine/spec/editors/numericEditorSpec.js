describe('NumericEditor', function () {
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

  it('should convert numeric value to number (object data source)', function () {

    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'id', type: 'numeric'},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate: onAfterValidate
    });
    selectCell(2, 0);

    keyDown('enter');
    document.activeElement.value = '999';

    destroyEditor();

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(typeof getDataAtCell(2, 0)).toEqual('number');
      expect(getDataAtCell(2, 0)).toEqual(999);
    });

  });

  it('should allow custom validator', function () {

    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      allowInvalid: false,
      columns: [
        {data: 'id', type: 'numeric', validator: function(val, cb) {
          cb(parseInt(val, 10) > 100);
        }},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate: onAfterValidate
    });
    selectCell(2, 0);

    keyDown('enter');
    document.activeElement.value = '99';

    destroyEditor();

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(getDataAtCell(2, 0)).not.toEqual(99); //should be ignored
    });

    runs(function () {
      document.activeElement.value = '999';

      onAfterValidate.reset();
      destroyEditor();
    });

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(getDataAtCell(2, 0)).toEqual(999);
    });

  });

  it("should convert string in format 'XX.XX' to a float with the same value", function() {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'id', type: 'numeric'},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate: onAfterValidate
    });
    selectCell(2, 0);

    keyDown('enter');

    document.activeElement.value = '99.99';

    onAfterValidate.reset();
    destroyEditor();

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(getDataAtCell(2, 0)).toEqual(parseFloat(99.99));
    });

  });

  it("should convert string in format 'XX.XX' to a float when passing float without leading zero", function() {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'id', type: 'numeric'},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate: onAfterValidate
    });
    selectCell(2, 0);

    keyDown('enter');

    document.activeElement.value = '.74';

    onAfterValidate.reset();
    destroyEditor();

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(getDataAtCell(2, 0)).toEqual(parseFloat(0.74));
    });

  });

  it("should convert string in format 'XX,XX' (with comma as separator) to a float with the same value if the numeric locale specifies comma as the precision delimiter (language=de)", function() {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'id', type: 'numeric', language: 'de'},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate: onAfterValidate
    });
    selectCell(2, 0);

    keyDown('enter');

    document.activeElement.value = '99,99';

    onAfterValidate.reset();
    destroyEditor();

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(getDataAtCell(2, 0)).toEqual(parseFloat(99.99));
    });

  });

  it("should display a string in a format '$X,XXX.XX' when using language=en, appropriate format in column settings and 'XXXX.XX' as an input string", function() {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'id', type: 'numeric', format: '$0,0.00', language: 'en'},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate: onAfterValidate
    });
    selectCell(2, 0);

    keyDown('enter');

    document.activeElement.value = '2456.22';

    onAfterValidate.reset();
    destroyEditor();

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(getCell(2, 0).innerHTML).toEqual('$2,456.22');
    });

  });

  it("should display a string in a format 'X XXX,XX €' when using language=de, appropriate format in column settings and 'XXXX,XX' as an input string (that comes from manual input)", function() {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'id', type: 'numeric', format: '0,0.00 $', language: 'de'},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate: onAfterValidate
    });
    selectCell(2, 0);

    keyDown('enter');

    document.activeElement.value = '2456,22';

    onAfterValidate.reset();
    destroyEditor();

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(getCell(2, 0).innerHTML).toEqual('2 456,22 €');
    });

  });

  it("should display a string in a format 'X XXX,XX €' when using language=de, appropriate format in column settings and 'XXXX.XX' as an input string (that comes from paste)", function() {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'id', type: 'numeric', format: '0,0.00 $', language: 'de'},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate: onAfterValidate
    });
    selectCell(2, 0);

    keyDown('enter');

    document.activeElement.value = '2456.22';

    onAfterValidate.reset();
    destroyEditor();

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(getCell(2, 0).innerHTML).toEqual('2 456,22 €');
    });

  });

  it("should not validate input values in different formats than 'XX.XX' and 'XX,XX'", function() {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'id', type: 'numeric'},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate: onAfterValidate
    });

    selectCell(2, 0);

    function manuallySetValueTo(val) {
      keyDown('enter');

      document.activeElement.value = val;

      onAfterValidate.reset();
      destroyEditor();
    }

    manuallySetValueTo('22.22');

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect($(getCell(2, 0)).hasClass('htInvalid')).toBe(false); // should validate alright
      manuallySetValueTo('2,000,000.22');
    });

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect($(getCell(2, 0)).hasClass('htInvalid')).toBe(true);
      manuallySetValueTo('11,11');
    });

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect($(getCell(2, 0)).hasClass('htInvalid')).toBe(false); // should validate alright
      manuallySetValueTo('one thounsand');
    });

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect($(getCell(2, 0)).hasClass('htInvalid')).toBe(true);
      manuallySetValueTo('99d99');
    });

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect($(getCell(2, 0)).hasClass('htInvalid')).toBe(true);
    });
  });

  it("should paste formatted data if source cell has format", function () {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'id', type: 'numeric', format: '0,0.00 $', language: 'de'},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate: onAfterValidate
    });
    selectCell(2, 0);

    keyDown('enter');

    document.activeElement.value = '€123,00';

    onAfterValidate.reset();
    destroyEditor();

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(getCell(2, 0).innerHTML).toEqual('123,00 €');
    });

  });

  it("should display a string in a format 'X XXX,XX €' when using language=de, appropriate format in column settings and 'XXXX,XX' as an input string and ignore not needed zeros at the end", function() {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: [
        {id: 1, name: "Ted", lastName: "Right", money: 0},
        {id: 2, name: "Frank", lastName: "Honest", money: 0},
        {id: 3, name: "Joan", lastName: "Well", money: 0},
        {id: 4, name: "Sid", lastName: "Strong", money: 0},
        {id: 5, name: "Jane", lastName: "Neat", money: 0},
        {id: 6, name: "Chuck", lastName: "Jackson", money: 0},
        {id: 7, name: "Meg", lastName: "Jansen", money: 0},
        {id: 8, name: "Rob", lastName: "Norris", money: 0},
        {id: 9, name: "Sean", lastName: "O'Hara", money: 0},
        {id: 10, name: "Eve", lastName: "Branson", money: 0}
      ],
      columns: [
        {data: 'id', type: 'numeric', format: '0,0.00 $', language: 'de'},
        {data: 'name'},
        {data: 'lastName'},
        {data: 'money', type: 'numeric', format: '$0,0.00', language: 'en'}
      ],
      afterValidate: onAfterValidate
    });

    selectCell(2, 0);

    function manuallySetValueTo(val) {
      keyDown('enter');

      document.activeElement.value = val;

      onAfterValidate.reset();
      destroyEditor();
    }

    manuallySetValueTo('2456,220');

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(getCell(2, 0).innerHTML).toEqual('2 456,22 €');
    });

    runs(function () {
      deselectCell();
      selectCell(2, 3);
      manuallySetValueTo('2456.220');
    });

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(getCell(2, 3).innerHTML).toEqual('$2,456.22');
    });
  });

  it("should not throw error on closing editor when column data is defined as 'length'", function() {
    hot = handsontable({
      data: [
        {length: 4},
        {length: 5},
      ],
      columns: [
        {
          data: 'length', type: 'numeric'
        },
        {},
        {}
      ]
    });

    selectCell(1, 0);
    keyDown('enter');
    document.activeElement.value = '999';

    expect(function() {
      destroyEditor();
    }).not.toThrow();
  });

});
