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
    setDataAtCell(2, 0, 'test');

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(onAfterValidate.calls.length).toEqual(1);
    });
  });

  it('beforeValidate can manipulate value', function () {
    var result = null;
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    onAfterValidate.plan = function (valid, value) {
      result = value;
    };

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
      afterValidate: onAfterValidate
    });
    setDataAtCell(2, 0, 123);

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(result).toEqual(999);
    });
  });

  it('should be able to define custom validator function', function () {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'id', validator: function (value, cb) {
          cb(true);
        }},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate: onAfterValidate
    });
    setDataAtCell(2, 0, 123);

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(onAfterValidate).toHaveBeenCalledWith(true, 123, 2, 'id', undefined, undefined);
    });
  });

  it('should be able to define custom validator RegExp', function () {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'id', validator: /^\d+$/ },
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate: onAfterValidate
    });

    setDataAtCell(2, 0, 'test');

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(onAfterValidate).toHaveBeenCalledWith(false, 'test', 2, 'id', undefined, undefined);
    });
  });

  it('this in validator should point to cellProperties', function () {
    var result = null;
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

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
      afterValidate: onAfterValidate
    });
    setDataAtCell(2, 0, 123);

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(result.instance).toEqual(getInstance());
    });
  });

  it('should add class name `htInvalid` to an cell that does not validate - on validateCells', function () {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 2),
      validator: function (value, callb) {
        if (value == "B1") {
          callb(false);
        }
        else {
          callb(true);
        }
      },
      afterValidate: onAfterValidate
    });

    hot.validateCells(function () {
      hot.render();
    });

    waitsFor(function () {
      return onAfterValidate.calls.length == 4;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(this.$container.find('td.htInvalid').length).toEqual(1);
      expect(this.$container.find('td:not(.htInvalid)').length).toEqual(3);
    });
  });

  it('should add class name `htInvalid` to an cell that does not validate - when we trigger validateCell', function () {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 2),
      validator: function (value, cb) {
        cb(false);
      },
      afterValidate: onAfterValidate
    });
    expect(this.$container.find('td:not(.htInvalid)').length).toEqual(4);

    hot.validateCell(hot.getDataAtCell(1, 1), hot.getCellMeta(1, 1), function() {});

    waitsFor(function () {
      return onAfterValidate.calls.length === 1;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(this.$container.find('td.htInvalid').length).toEqual(1);
      expect(this.$container.find('td:not(.htInvalid)').length).toEqual(3);
    });
  });

  it('should remove class name `htInvalid` from an cell that does validate - when we change validator rules', function () {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');
    var isValid = false;
    var validator = function() {
        return isValid;
    };

    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 2),
      validator: function (value, cb) {
        cb(validator());
      },
      afterValidate: onAfterValidate
    });
    waitsFor(function () {
      return onAfterValidate.calls.length === 4;
    }, 'Cell validation', 1000);

    hot.validateCells(function() {});

    runs(function () {
      expect(this.$container.find('td.htInvalid').length).toEqual(4);
      expect(this.$container.find('td:not(.htInvalid)').length).toEqual(0);
    });

    runs(function () {
      isValid = true;
      onAfterValidate.reset();
      hot.validateCell(hot.getDataAtCell(1, 1), hot.getCellMeta(1, 1), function() {});
    });

    waitsFor(function () {
      return onAfterValidate.calls.length === 1;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(this.$container.find('td.htInvalid').length).toEqual(3);
      expect(this.$container.find('td:not(.htInvalid)').length).toEqual(1);
    });
  });

  it('should add class name `htInvalid` to an cell that does not validate - on edit', function () {

    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 2),
      validator: function (value, callb) {
        if (value == 'test') {
          callb(false);
        }
        else {
          callb(true);
        }
      },
      afterValidate: onAfterValidate
    });

    setDataAtCell(0, 0, 'test');

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(this.$container.find('td.htInvalid').length).toEqual(1);
      expect(this.$container.find('tr:eq(0) td:eq(0)').hasClass('htInvalid')).toEqual(true);
    });


  });

  it('should add class name `htInvalid` to a cell without removing other classes', function () {

    var onAfterValidate = jasmine.createSpy('onAfterValidate');
    var validator = jasmine.createSpy('validator').andCallThrough();
    validator.plan = function (value, callb) {
      if (value == 123) {
        callb(false);
      }
      else {
        callb(true);
      }
    };

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 2),
      type: 'numeric',
      validator: validator,
      afterValidate: onAfterValidate
    });

    setDataAtCell(0, 0, 123);

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation 1', 1000);

    runs(function () {
      expect(validator.calls.length).toEqual(1);
      expect(this.$container.find('tr:eq(0) td:eq(0)').hasClass('htInvalid')).toEqual(true);
      expect(this.$container.find('tr:eq(0) td:eq(0)').hasClass('htNumeric')).toEqual(true);

    });
    runs(function () {
      onAfterValidate.reset();
      setDataAtCell(0, 0, 124);
    });

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(this.$container.find('tr:eq(0) td:eq(0)').hasClass('htInvalid')).toEqual(false);
      expect(this.$container.find('tr:eq(0) td:eq(0)').hasClass('htNumeric')).toEqual(true);
    });


  });

  it('should add class name `htInvalid` to an cell that does not validate - after validateCells', function () {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 2),
      afterValidate: onAfterValidate
    });

    setDataAtCell(0, 0, 'test');

    waits(100);

    runs(function () {
      expect(this.$container.find('td.htInvalid').length).toEqual(0);
    });

    runs(function () {
      updateSettings({validator: function (value, callb) {
        if (value == 'test') {
          callb(false);
        }
        else {
          callb(true);
        }
      }});

      onAfterValidate.reset();

      hot.validateCells(function () {});
    });

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(this.$container.find('td.htInvalid').length).toEqual(1);
      expect(this.$container.find('tr:eq(0) td:eq(0)').hasClass('htInvalid')).toEqual(true);
    });
  });

  it('should remove class name `htInvalid` when cell is edited to validate', function () {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 2),
      validator: function (value, callb) {
        if (value == 'A1') {
          callb(false)
        }
        else {
          callb(true)
        }
      },
      afterValidate: onAfterValidate
    });

    hot.validateCells(function () {
      hot.render();
    });

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(this.$container.find('tr:eq(0) td:eq(0)').hasClass('htInvalid')).toEqual(true);
    });

    runs(function () {
      onAfterValidate.reset();
      setDataAtCell(0, 0, 'test');
    });

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(this.$container.find('tr:eq(0) td:eq(0)').hasClass('htInvalid')).toEqual(false);
    });
  });

  it('should not allow for changes where data is invalid (multiple changes, async)', function () {
    var validatedChanges;

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2),
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
      ['A1-new'],
      ['fail'],
      ['A3-new']
    ]);

    waitsFor(function () {
      return validatedChanges;
    }, 1000);

    runs(function () {
      expect(validatedChanges.length).toEqual(2);
      expect(validatedChanges[0]).toEqual([0, 0, 'A1', 'A1-new']);
      expect(validatedChanges[1]).toEqual([2, 0, 'A3', 'A3-new']);
      expect(getDataAtCell(0, 0)).toEqual('A1-new');
      expect(getDataAtCell(1, 0)).toEqual('A2');
      expect(getDataAtCell(2, 0)).toEqual('A3-new');
      expect(getCellMeta(0, 0).valid).toBe(true);
      expect(getCellMeta(1, 0).valid).toBe(true);
      expect(getCellMeta(2, 0).valid).toBe(true);
    });
  });

  it('should call beforeChange exactly once after cell value edit and validator is synchronous', function () {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');
    var onBeforeChange = jasmine.createSpy('onBeforeChange');

    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator: function (value, callback) {
        callback(true);
      },
      beforeChange: onBeforeChange,
      afterValidate: onAfterValidate
    });

    expect(onBeforeChange.calls.length).toEqual(0);

    hot.setDataAtCell(0, 0, 10);

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(onBeforeChange.calls.length).toEqual(1);
    });

  });

  it('should call beforeChange exactly once after cell value edit and validator is asynchronous', function () {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');
    var onBeforeChange = jasmine.createSpy('onBeforeChange');

    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator: function (value, callback) {
        setTimeout(function () {
          callback(true);
        }, 10);
      },
      beforeChange: onBeforeChange,
      afterValidate: onAfterValidate
    });

    expect(onBeforeChange.calls.length).toEqual(0);

    hot.setDataAtCell(0, 0, 10);

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(onBeforeChange.calls.length).toEqual(1);
    });

  });

  it('should call afterChange exactly once after cell value edit and validator is synchronous', function () {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');
    var onAfterChange = jasmine.createSpy('onAfterChange');

    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator: function (value, callback) {
        callback(true);
      },
      afterChange: onAfterChange,
      afterValidate: onAfterValidate
    });

    expect(onAfterChange.calls.length).toEqual(1); //loadData

    hot.setDataAtCell(0, 0, 10);

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(onAfterChange.calls.length).toEqual(2);
    });

  });

  it('should call afterChange exactly once after cell value edit and validator is asynchronous', function () {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');
    var onAfterChange = jasmine.createSpy('onAfterChange');

    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator: function (value, callback) {
        setTimeout(function () {
          callback(true);
        }, 10);
      },
      afterChange: onAfterChange,
      afterValidate: onAfterValidate
    });

    expect(onAfterChange.calls.length).toEqual(1); //loadData

    hot.setDataAtCell(0, 0, 10);

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(onAfterChange.calls.length).toEqual(2);
    });

  });

  it('edited cell should stay on screen until value is validated', function () {
    var isEditorVisibleBeforeChange;
    var isEditorVisibleAfterChange;

    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    onAfterValidate.plan = function () {
      isEditorVisibleBeforeChange = isEditorVisible();
    };

    var onAfterChange = jasmine.createSpy('onAfterChange');
    onAfterChange.plan = function () {
      isEditorVisibleAfterChange = isEditorVisible();
    };


    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2),
      allowInvalid: false,
      afterValidate: onAfterValidate,
      afterChange: onAfterChange,
      validator: function (value, callback) {
        setTimeout(function () {
          callback(true);
        }, 100);
      }
    });

    selectCell(0, 0);
    keyDown('enter');
    document.activeElement.value = 'Ted';

    onAfterValidate.reset();
    onAfterChange.reset();

    keyDown('enter');

    expect(document.activeElement.nodeName).toEqual('TEXTAREA');

    waitsFor(function() {
      return onAfterValidate.calls.length > 0 && onAfterChange.calls.length > 0;
    }, 'Cell validation and value change', 1000);

    runs(function () {
      expect(isEditorVisibleBeforeChange).toBe(true);
      expect(isEditorVisibleAfterChange).toBe(true);
      expect(isEditorVisible()).toBe(false);
      expect(document.activeElement.nodeName).toEqual('BODY');
    });
  });

  it('should validate edited cell after selecting another cell', function () {

    var validated = false;
    var validatedValue;

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2),
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
      data: Handsontable.helper.createSpreadsheetData(5, 2),
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
      data: Handsontable.helper.createSpreadsheetData(5, 2),
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
      data: Handsontable.helper.createSpreadsheetData(5, 2),
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
      data: Handsontable.helper.createSpreadsheetData(5, 2),
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
      data: Handsontable.helper.createSpreadsheetData(5, 2),
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
      data: Handsontable.helper.createSpreadsheetData(5, 2),
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
      data: Handsontable.helper.createSpreadsheetData(5, 2),
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
      expect(getDataAtCell(0, 0)).toEqual('A1');
    });

  });

  it('should listen to key changes after cell is corrected (allowInvalid: false)', function () {

    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      allowInvalid: false,
      columns: [
        {data: 'id', type: 'numeric', validator: function (val, cb) {
          cb(parseInt(val, 10) > 100);
        }},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate: onAfterValidate
    });
    selectCell(2, 0);

    keyDownUp('enter');
    document.activeElement.value = '99';

    onAfterValidate.reset();

    keyDownUp('enter'); //should be ignored

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(isEditorVisible()).toBe(true);
    });

    runs(function () {
      document.activeElement.value = '999';

      onAfterValidate.reset();
      keyDownUp('enter'); //should be accepted
    });

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation 2', 1000);

    runs(function () {
      expect(isEditorVisible()).toBe(false);
      expect(getSelected()).toEqual([3, 0, 3, 0]);

      keyDownUp('arrow_up');
      expect(getSelected()).toEqual([2, 0, 2, 0]);
    });

  });

  it('should allow keyboard movement when cell is being validated (move DOWN)', function () {

    var onAfterValidate = jasmine.createSpy('onAfterValidate');

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
      ],
      afterValidate: onAfterValidate
    });
    selectCell(2, 0);

    keyDownUp('enter');
    document.activeElement.value = '999';
    keyDownUp('enter');

    expect(getSelected()).toEqual([3, 0, 3, 0]);

    keyDownUp('arrow_down');
    keyDownUp('arrow_down');
    expect(isEditorVisible()).toBe(true);
    expect(getSelected()).toEqual([5, 0, 5, 0]);

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(isEditorVisible()).toBe(false);
      expect(getSelected()).toEqual([5, 0, 5, 0]); // only enterMove and first arrow_down is performed
    });
  });

  it('should not allow keyboard movement until cell is validated (move UP)', function () {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

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
      ],
      afterValidate: onAfterValidate
    });

    selectCell(2, 0);

    keyDownUp('enter');
    document.activeElement.value = '999';
    keyDownUp('enter');

    expect(getSelected()).toEqual([3, 0, 3, 0]);

    keyDownUp('arrow_up');
    keyDownUp('arrow_up');
    expect(isEditorVisible()).toBe(true);
    expect(getSelected()).toEqual([1, 0, 1, 0]);

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);


    runs(function () {
      expect(isEditorVisible()).toBe(false);
      expect(getSelected()).toEqual([1, 0, 1, 0]);
    });
  });

  it('should not allow keyboard movement until cell is validated (move RIGHT)', function () {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

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
      ],
      afterValidate: onAfterValidate
    });

    selectCell(2, 0);

    keyDownUp('enter');
    document.activeElement.value = '999';
    keyDownUp('enter'); //should be accepted but only after 100 ms
    expect(getSelected()).toEqual([3, 0, 3, 0]);

    keyDownUp('arrow_right');
    keyDownUp('arrow_right');
    expect(isEditorVisible()).toBe(true);
    expect(getSelected()).toEqual([3, 2, 3, 2]);

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);


    runs(function () {
      expect(isEditorVisible()).toBe(false);
      expect(getSelected()).toEqual([3, 2, 3, 2]);
    });
  });

  it('should not allow keyboard movement until cell is validated (move LEFT)', function () {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    hot = handsontable({
      data: arrayOfObjects(),
      allowInvalid: false,
      columns: [
        {data: 'name'},
        {data: 'lastName'},
        {data: 'id', type: 'numeric', validator: function (val, cb) {
          setTimeout(function () {
            cb(parseInt(val, 10) > 100);
          }, 100);
        }}
      ],
      afterValidate: onAfterValidate
    });

    selectCell(2, 2);

    keyDownUp('enter');
    document.activeElement.value = '999';
    keyDownUp('enter'); //should be accepted but only after 100 ms
    expect(getSelected()).toEqual([3, 2, 3, 2]);

    this.$container.simulate('keydown', {keyCode: Handsontable.helper.keyCode.ARROW_LEFT});
    this.$container.simulate('keyup', {keyCode: Handsontable.helper.keyCode.ARROW_LEFT});
    this.$container.simulate('keydown', {keyCode: Handsontable.helper.keyCode.ARROW_LEFT});
    this.$container.simulate('keyup', {keyCode: Handsontable.helper.keyCode.ARROW_LEFT});

    expect(isEditorVisible()).toBe(true);
    expect(getSelected()).toEqual([3, 0, 3, 0]);

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(isEditorVisible()).toBe(false);
      expect(getSelected()).toEqual([3, 0, 3, 0]);
    });
  });

  it('should not validate cell if editing has been canceled', function () {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'id'},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate: onAfterValidate
    });

    selectCell(0, 0);
    keyDownUp(Handsontable.helper.keyCode.ENTER);  //open editor
    keyDownUp(Handsontable.helper.keyCode.ESCAPE); //cancel editing

    waits(100);

    runs(function () {
      expect(onAfterValidate).not.toHaveBeenCalled();
    });


  });

  it('should leave cell invalid if editing has been canceled', function () {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'id', validator: function (value, cb) {
          cb(false);
        }},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate: onAfterValidate
    });

    setDataAtCell(0, 0, 'foo');

    waitsFor(function () {
      return onAfterValidate.calls.length > 0
    }, 'cell validation', 1000);

    runs(function () {
      expect(getCellMeta(0, 0).valid).toBe(false);

      selectCell(0, 0);
      keyDownUp(Handsontable.helper.keyCode.ENTER);  //open editor
      keyDownUp(Handsontable.helper.keyCode.ESCAPE); //cancel editing

      expect(getCellMeta(0, 0).valid).toBe(false);

    });

  });

  it('should open an appropriate editor after cell value is valid again', function () {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    var hot = handsontable({
      data: arrayOfObjects(),
      columns: [
        {
          data: 'id',
          validator: function (value, cb) {
            cb(value == parseInt(value, 10));
          },
          allowInvalid: false
        },
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate: onAfterValidate
    });

    selectCell(0, 0);

    var activeEditor = hot.getActiveEditor();

    expect(activeEditor.row).toEqual(0);
    expect(activeEditor.col).toEqual(0);

    keyDownUp(Handsontable.helper.keyCode.ENTER); //open editor
    activeEditor.setValue('foo');
    keyDownUp(Handsontable.helper.keyCode.ENTER); //save changes, close editor

    waitsFor(function () {
      return onAfterValidate.calls.length > 0
    }, 'cell validation', 1000);

    runs(function () {
      onAfterValidate.reset();
      activeEditor = hot.getActiveEditor();

      expect(activeEditor.isOpened()).toBe(true); //value is invalid, so editor stays opened
      expect(activeEditor.row).toEqual(0);
      expect(activeEditor.col).toEqual(0);

      activeEditor.setValue(2);

      keyDownUp(Handsontable.helper.keyCode.ENTER);  //save changes and move to cell below (row: 1, col: ś0)

    });

    waitsFor(function () {
      return onAfterValidate.calls.length > 0
    }, 'cell validation 2', 1000);

    runs(function () {
      keyDownUp(Handsontable.helper.keyCode.ENTER);  //open editor

      activeEditor = hot.getActiveEditor();
      expect(activeEditor.row).toEqual(1);
      expect(activeEditor.col).toEqual(0);

    });

  });

});
