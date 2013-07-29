describe('Core_validate', function () {
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

  it('should call beforeValidate', function () {
    var fired = null;

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'id', type: 'numeric'},
        {data: 'name'},
        {data: 'lastName'}
      ],
      beforeValidate: function () {
        fired = true;
      }
    });
    setDataAtCell(2, 0, 'test');

    expect(fired).toEqual(true);
  });

  it('should call afterValidate', function () {
    var fired = null;

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'id', type: 'numeric'},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate: function () {
        fired = true;
      }
    });
    setDataAtCell(2, 0, 'test');

    expect(fired).toEqual(true);
  });

  it('beforeValidate should can manipulate value', function () {
    var result = null;

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'id', type: 'numeric'},
        {data: 'name'},
        {data: 'lastName'}
      ],
      beforeValidate: function (value) {
        value = 999;
        return value;
      },
      afterValidate: function (valid, value) {
        result = value;
      }
    });
    setDataAtCell(2, 0, 123);

    expect(result).toEqual(999);
  });

  it('should be able to define custom validator function', function () {
    var result = null;

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'id', validator: function (value, cb) {
          cb(true);
        }},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate: function (valid) {
        result = valid;
      }
    });
    setDataAtCell(2, 0, 123);

    expect(result).toEqual(true);
  });

  it('should be able to define custom validator RegExp', function () {
    var lastInvalid = null;

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'id', validator: /^\d+$/ },
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate: function (valid, value) {
        if (valid === false) {
          lastInvalid = value;
        }
      }
    });
    setDataAtCell(2, 0, 'test');

    expect(lastInvalid).toEqual('test');
  });

  it('this in validator should point to cellProperties', function () {
    var result = null
      , fired = false;

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'id', validator: function (value, cb) {
          result = this;
          cb(true);
        }},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate: function () {
        fired = true;
      }
    });
    setDataAtCell(2, 0, 123);

    expect(result.instance).toEqual(getInstance());
  });

  it('should add class name `htInvalid` to an cell that does not validate - on validateCells', function () {
    var hot = handsontable({
      data: createSpreadsheetData(2, 2),
      validator: function (value, callb) {
        if (value == "B1") {
          callb(false)
        }
        else {
          callb(true)
        }
      }
    });

    hot.validateCells(function () {
      hot.render();
    });

    expect(this.$container.find('td.htInvalid').length).toEqual(1);
    expect(this.$container.find('td:not(.htInvalid)').length).toEqual(3);
  });

  it('should add class name `htInvalid` to an cell that does not validate - on edit', function () {
    handsontable({
      data: createSpreadsheetData(2, 2),
      validator: function (value, callb) {
        if (value == 'test') {
          callb(false)
        }
        else {
          callb(true)
        }
      }
    });

    setDataAtCell(0, 0, 'test');

    expect(this.$container.find('td.htInvalid').length).toEqual(1);
    expect(this.$container.find('tr:eq(0) td:eq(0)').hasClass('htInvalid')).toEqual(true);
  });

  it('should add class name `htInvalid` to a cell without removing other classes', function () {
    handsontable({
      data: createSpreadsheetData(2, 2),
      type: 'numeric',
      validator: function (value, callb) {
        if (value == 123) {
          callb(false)
        }
        else {
          callb(true)
        }
      }
    });

    setDataAtCell(0, 0, 123);

    expect(this.$container.find('tr:eq(0) td:eq(0)').hasClass('htInvalid')).toEqual(true);
    expect(this.$container.find('tr:eq(0) td:eq(0)').hasClass('htNumeric')).toEqual(true);

    setDataAtCell(0, 0, 124);

    expect(this.$container.find('tr:eq(0) td:eq(0)').hasClass('htInvalid')).toEqual(false);
    expect(this.$container.find('tr:eq(0) td:eq(0)').hasClass('htNumeric')).toEqual(true);
  });

  it('should add class name `htInvalid` to an cell that does not validate - after validateCells & render', function () {
    var hot = handsontable({
      data: createSpreadsheetData(2, 2)
    });

    setDataAtCell(0, 0, 'test');

    expect(this.$container.find('td.htInvalid').length).toEqual(0);

    updateSettings({validator: function (value, callb) {
      if (value == 'test') {
        callb(false)
      }
      else {
        callb(true)
      }
    }});

    hot.validateCells(function () {
      hot.render();
    });

    runs(function () {
      expect(this.$container.find('td.htInvalid').length).toEqual(1);
      expect(this.$container.find('tr:eq(0) td:eq(0)').hasClass('htInvalid')).toEqual(true);
    });
  });

  it('should remove class name `htInvalid` when cell is edited to validate', function () {
    var hot = handsontable({
      data: createSpreadsheetData(2, 2),
      validator: function (value, callb) {
        if (value == 'A0') {
          callb(false)
        }
        else {
          callb(true)
        }
      }
    });

    hot.validateCells(function () {
      hot.render();
    });

    expect(this.$container.find('tr:eq(0) td:eq(0)').hasClass('htInvalid')).toEqual(true);

    setDataAtCell(0, 0, 'test');

    expect(this.$container.find('tr:eq(0) td:eq(0)').hasClass('htInvalid')).toEqual(false);
  });

  it('should not allow for changes where data is invalid (multiple changes, async)', function () {
    var validatedChanges;

    handsontable({
      data: createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator: function (value, callb) {
        setTimeout(function () {
          if (value === 'fail') {
            callb(false)
          }
          else {
            callb(true)
          }
        }, 10);
      },
      afterChange: function (changes, source) {
        if (source !== 'loadData') {
          validatedChanges = changes;
        }
      }
    });

    populateFromArray(0, 0, [
      ['A0-new'],
      ['fail'],
      ['A2-new']
    ]);

    waitsFor(function () {
      return validatedChanges;
    }, 1000);

    runs(function () {
      expect(validatedChanges.length).toEqual(2);
      expect(validatedChanges[0]).toEqual([0, 0, 'A0', 'A0-new']);
      expect(validatedChanges[1]).toEqual([2, 0, 'A2', 'A2-new']);
    });
  });

  it('should call beforeChange exactly once after cell value edit and validator is synchronous', function () {
    var callCounter = 0;

    var hot = handsontable({
      data: createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator: function (value, callback) {
        callback(true);
      },
      beforeChange: function (changes, source) {
        if (source !== 'loadData') {
          callCounter++;
        }
      }
    });

    expect(callCounter).toEqual(0);

    hot.setDataAtCell(0, 0, 10);

    expect(callCounter).toEqual(1);

  });

  it('should call beforeChange exactly once after cell value edit and validator is asynchronous', function () {
    var callCounter = 0;

    var hot = handsontable({
      data: createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator: function (value, callback) {
        setTimeout(function () {
          callback(true);
        }, 10);
      },
      beforeChange: function (changes, source) {
        if (source !== 'loadData') {
          callCounter++;
        }
      }
    });

    expect(callCounter).toEqual(0);

    hot.setDataAtCell(0, 0, 10);

    waits(100);

    runs(function () {
      expect(callCounter).toEqual(1);
    });

  });

  it('should call afterChange exactly once after cell value edit and validator is synchronous', function () {
    var callCounter = 0;

    var hot = handsontable({
      data: createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator: function (value, callback) {
        callback(true);
      },
      afterChange: function (changes, source) {
        if (source !== 'loadData') {
          callCounter++;
        }
      }
    });

    expect(callCounter).toEqual(0);

    hot.setDataAtCell(0, 0, 10);

    expect(callCounter).toEqual(1);

  });

  it('should call afterChange exactly once after cell value edit and validator is asynchronous', function () {
    var callCounter = 0;

    var hot = handsontable({
      data: createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator: function (value, callback) {
        setTimeout(function () {
          callback(true);
        }, 10);
      },
      afterChange: function (changes, source) {
        if (source !== 'loadData') {
          callCounter++;
        }
      }
    });

    expect(callCounter).toEqual(0);

    hot.setDataAtCell(0, 0, 10);

    waits(100);

    runs(function () {
      expect(callCounter).toEqual(1);
    });

  });

  it('edited cell should stay on screen until value is validated', function () {
    var beforeElement;
    var afterElement;

    handsontable({
      data: createSpreadsheetData(5, 2),
      allowInvalid: false,
      afterValidate: function () {
        beforeElement = document.activeElement;
      },
      afterChange: function () {
        afterElement = document.activeElement;
      },
      validator: function (value, callback) {
        setTimeout(function () {
          callback(true);
        }, 100);
      }
    });

    selectCell(0, 0);
    keyDown('enter');
    afterElement = "teraz";
    document.activeElement.value = 'Ted';
    keyDown('enter');

    expect(document.activeElement.nodeName).toEqual('TEXTAREA');

    waits(110);

    runs(function () {
      expect(beforeElement.nodeName).toEqual('TEXTAREA');
      expect(afterElement.nodeName).toEqual('BODY');
      expect(document.activeElement.nodeName).toEqual('BODY');
    });

  });

  it('should validate edited cell after selecting another cell', function () {

    var validated = false;
    var validatedValue;

    handsontable({
      data: createSpreadsheetData(5, 2),
      allowInvalid: false,
      afterValidate: function () {
        beforeElement = document.activeElement;
      },
      afterChange: function () {
        afterElement = document.activeElement;
      },
      validator: function (value, callback) {
        setTimeout(function () {
          validated = true;
          validatedValue = value;
          callback(true);
        }, 100);
      }
    });

    selectCell(0, 0);
    keyDown('enter');

    document.activeElement.value = 'Ted';

    selectCell(0, 1);


    waitsFor(function () {
      return validated;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(validatedValue).toEqual('Ted');
    });

  });

  it('should leave the new value in editor if it does not validate (async validation), after hitting ENTER', function () {

    var validated = false;
    var validationResult;

    handsontable({
      data: createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator: function (value, callback) {
        setTimeout(function () {

          validated = true;
          validationResult = value.length == 2;
          callback(validationResult);
        }, 100);
      }
    });

    selectCell(0, 0);
    keyDown('enter');

    document.activeElement.value = 'Ted';

    keyDown('enter');


    waitsFor(function () {
      return validated;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(validationResult).toBe(false);
      expect(document.activeElement.value).toEqual('Ted');
    });

  });

  it('should leave the new value in editor if it does not validate (sync validation), after hitting ENTER', function () {

    var validated = false;
    var validationResult;

    handsontable({
      data: createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator: function (value, callback) {
        validated = true;
        validationResult = value.length == 2;
        callback(validationResult);
      }
    });

    selectCell(0, 0);
    keyDown('enter');

    document.activeElement.value = 'Ted';

    keyDown('enter');


    waitsFor(function () {
      return validated;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(validationResult).toBe(false);
      expect(document.activeElement.value).toEqual('Ted');
    });

  });

  it('should leave the new value in editor if it does not validate (async validation), after selecting another cell', function () {

    var validated = false;
    var validationResult;

    handsontable({
      data: createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator: function (value, callback) {
        setTimeout(function () {

          setTimeout(function () {
            validated = true;
          }, 0);

          validationResult = value.length == 2;
          callback(validationResult);
        }, 100);
      }
    });

    selectCell(0, 0);
    keyDown('enter');

    document.activeElement.value = 'Ted';

    selectCell(1, 0);


    waitsFor(function () {
      return validated;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(validationResult).toBe(false);
      expect(document.activeElement.value).toEqual('Ted');
    });

  });

  it('should leave the new value in editor if it does not validate (sync validation), after selecting another cell', function () {

    var validated = false;
    var validationResult;

    handsontable({
      data: createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator: function (value, callback) {
        validationResult = value.length == 2;
        callback(validationResult);

        /*Setting this variable has to be async, because we are not interested in when the validation happens, but when
         the callback is being called. Since internally all the callbacks are processed asynchronously (even if they are
         synchronous) end of validator function is not the equivalent of whole validation routine end.
         If it still sounds weird, take a look at HandsontableTextEditorClass.prototype.finishEditing method.
         */

        setTimeout(function () {
          validated = true;
        }, 0);
      }
    });

    selectCell(0, 0);
    keyDown('enter');

    document.activeElement.value = 'Ted';

    selectCell(1, 0);


    waitsFor(function () {
      return validated;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(validationResult).toBe(false);
      expect(document.activeElement.value).toEqual('Ted');
    });

  });

  it('should close the editor and save the new value if validation fails and allowInvalid is set to "true"', function () {
    var validated = false;
    var validationResult;

    handsontable({
      data: createSpreadsheetData(5, 2),
      allowInvalid: true,
      validator: function (value, callback) {
        setTimeout(function () {

          validated = true;
          validationResult = value.length == 2;
          callback(validationResult);
        }, 100);
      }
    });

    selectCell(0, 0);
    keyDown('enter');

    document.activeElement.value = 'Ted';

    selectCell(1, 0);


    waitsFor(function () {
      return validated;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(validationResult).toBe(false);
      expect(document.activeElement.nodeName).toEqual('BODY');
      expect(getDataAtCell(0, 0)).toEqual('Ted');
      expect(getCell(0, 0).className).toMatch(/htInvalid/);
    });
  });

  it('should close the editor and save the new value after double clicking on a cell, if the previously edited cell validated correctly', function () {

    var validated = false;
    var validationResult;

    handsontable({
      data: createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator: function (value, callback) {
        setTimeout(function () {

          validated = true;
          validationResult = value.length == 2;
          callback(validationResult);
        }, 100);
      }
    });

    selectCell(0, 0);
    keyDown('enter');

    var editor = $('.handsontableInputHolder');
    expect(editor.is(':visible')).toBe(true);

    document.activeElement.value = 'AA';

    expect(document.activeElement.value).toEqual('AA');

    var cell = $(getCell(1, 0));
    var clicks = 0;

    setTimeout(function () {
      mouseDown(cell);
      mouseUp(cell);
      clicks++;
    }, 0);

    setTimeout(function () {
      mouseDown(cell);
      mouseUp(cell);
      clicks++;
    }, 100);

    waitsFor(function () {
      return clicks == 2 && validated;
    }, 'Two clicks', 1000);

    runs(function () {
      expect(editor.is(':visible')).toBe(false);
      expect(validationResult).toBe(true);
      expect(getDataAtCell(0, 0)).toEqual('AA');
    });

  });

  it('should close the editor and restore the original value after double clicking on a cell, if the previously edited cell have not validated', function () {

    var validated = false;
    var validationResult;

    handsontable({
      data: createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator: function (value, callback) {
        setTimeout(function () {
          validated = true;
          validationResult = value.length == 2;
          callback(validationResult);
        }, 100);
      }
    });

    selectCell(0, 0);
    keyDown('enter');

    document.activeElement.value = 'AAA';

    expect(document.activeElement.value).toEqual('AAA');

    var cell = $(getCell(1, 0));
    var clicks = 0;

    setTimeout(function () {
      mouseDown(cell);
      mouseUp(cell);
      clicks++;
    }, 0);

    setTimeout(function () {
      mouseDown(cell);
      mouseUp(cell);
      clicks++;
    }, 100);

    waitsFor(function () {
      return clicks == 2 && validated;
    }, 'Two clicks', 1000);

    runs(function () {
      expect(validationResult).toBe(false);
      expect(getDataAtCell(0, 0)).toEqual('A0');
    });

  });

  it("should close the editor and restore the original value after trying to save the original value with ENTER and then canceling with ESC", function () {
    var validated = 0;
    var validationResult;

    handsontable({
      data: createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator: function (value, callback) {
        validated++;
        validationResult = value.length == 2;
        callback(validationResult);
      }
    });

    selectCell(0, 0);
    keyDown('enter');

    var editor = $('.handsontableInputHolder');

    document.activeElement.value = 'Ted';

    keyDown('enter');

    waitsFor(function () {
      return validated == 1;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(editor.is(':visible')).toBe(true);
      expect(validationResult).toBe(false);
      expect(document.activeElement.value).toEqual('Ted');
    });

    runs(function () {
      keyDown('esc');
    });

    waitsFor(function () {
      return validated == 2;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(editor.is(':visible')).toBe(false);
      expect(validationResult).toBe(true);
      expect(getDataAtCell(0, 0)).toEqual('A0');
    });

  });

  it('should listen to key changes after cell is corrected (allowInvalid: false)', function () {
    handsontable({
      data: arrayOfObjects(),
      allowInvalid: false,
      columns: [
        {data: 'id', type: 'numeric', validator: function (val, cb) {
          cb(parseInt(val, 10) > 100);
        }},
        {data: 'name'},
        {data: 'lastName'}
      ]
    });
    selectCell(2, 0);

    keyDownUp('enter');
    document.activeElement.value = '99';

    keyDownUp('enter'); //should be ignored
    expect(isEditorVisible()).toBe(true);

    document.activeElement.value = '999';
    keyDownUp('enter'); //should be accepted
    expect(isEditorVisible()).toBe(false);

    expect(getSelected()).toEqual([3, 0, 3, 0]);

    keyDownUp('arrow_up');
    expect(getSelected()).toEqual([2, 0, 2, 0]);
  });

  it('should not allow keyboard movement until cell is validated', function () {
    handsontable({
      data: arrayOfObjects(),
      allowInvalid: false,
      columns: [
        {data: 'id', type: 'numeric', validator: function (val, cb) {
          setTimeout(function () {
            cb(parseInt(val, 10) > 100);
          }, 100);
        }},
        {data: 'name'},
        {data: 'lastName'}
      ]
    });
    selectCell(2, 0);

    keyDownUp('enter');
    document.activeElement.value = '999';
    keyDownUp('enter'); //should be accepted but only after 100 ms

    keyDownUp('arrow_right');
    keyDownUp('arrow_right');
    expect(isEditorVisible()).toBe(true);
    expect(getSelected()).toEqual([2, 0, 2, 0]);

    waits(110);

    runs(function () {
      expect(isEditorVisible()).toBe(false);
      expect(getSelected()).toEqual([3, 0, 3, 0]);
    });
  });
});
