describe('Core_validate', () => {
  var id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  var arrayOfObjects = function() {
    return [
      {id: 1, name: 'Ted', lastName: 'Right'},
      {id: 2, name: 'Frank', lastName: 'Honest'},
      {id: 3, name: 'Joan', lastName: 'Well'},
      {id: 4, name: 'Sid', lastName: 'Strong'},
      {id: 5, name: 'Jane', lastName: 'Neat'},
      {id: 6, name: 'Chuck', lastName: 'Jackson'},
      {id: 7, name: 'Meg', lastName: 'Jansen'},
      {id: 8, name: 'Rob', lastName: 'Norris'},
      {id: 9, name: 'Sean', lastName: 'O\'Hara'},
      {id: 10, name: 'Eve', lastName: 'Branson'}
    ];
  };

  it('should call beforeValidate', () => {
    var fired = null;

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'id', type: 'numeric'},
        {data: 'name'},
        {data: 'lastName'}
      ],
      beforeValidate() {
        fired = true;
      }
    });
    setDataAtCell(2, 0, 'test');

    expect(fired).toEqual(true);
  });

  it('should call beforeValidate when columns is a function', () => {
    var fired = null;

    handsontable({
      data: arrayOfObjects(),
      columns(column) {
        var colMeta = {};

        if (column === 0) {
          colMeta.data = 'id';
          colMeta.type = 'numeric';

        } else if (column === 1) {
          colMeta.data = 'name';

        } else if (column === 2) {
          colMeta.data = 'lastName';

        } else {
          colMeta = null;
        }

        return colMeta;
      },
      beforeValidate() {
        fired = true;
      }
    });
    setDataAtCell(2, 0, 'test');

    expect(fired).toBe(true);
  });

  it('should call afterValidate', (done) => {
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

    setTimeout(() => {
      expect(onAfterValidate.calls.count()).toBe(1);
      done();
    }, 200);
  });

  it('should call afterValidate when columns is a function', (done) => {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns(column) {
        var colMeta = {};

        if (column === 0) {
          colMeta.data = 'id';
          colMeta.type = 'numeric';

        } else if (column === 1) {
          colMeta.data = 'name';

        } else if (column === 2) {
          colMeta.data = 'lastName';

        } else {
          colMeta = null;
        }

        return colMeta;
      },
      afterValidate: onAfterValidate
    });
    setDataAtCell(2, 0, 'test');

    setTimeout(() => {
      expect(onAfterValidate.calls.count()).toBe(1);
      done();
    }, 200);
  });

  it('beforeValidate can manipulate value', (done) => {
    var result = null;
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    onAfterValidate.and.callFake((valid, value) => {
      result = value;
    });

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'id', type: 'numeric'},
        {data: 'name'},
        {data: 'lastName'}
      ],
      beforeValidate(value) {
        value = 999;
        return value;
      },
      afterValidate: onAfterValidate
    });
    setDataAtCell(2, 0, 123);

    setTimeout(() => {
      expect(result).toBe(999);
      done();
    }, 200);
  });

  it('beforeValidate can manipulate value when columns is a function', (done) => {
    var result = null;
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    onAfterValidate.and.callFake((valid, value) => {
      result = value;
    });

    handsontable({
      data: arrayOfObjects(),
      columns(column) {
        var colMeta = {};

        if (column === 0) {
          colMeta.data = 'id';
          colMeta.type = 'numeric';

        } else if (column === 1) {
          colMeta.data = 'name';

        } else if (column === 2) {
          colMeta.data = 'lastName';

        } else {
          colMeta = null;
        }

        return colMeta;
      },
      beforeValidate(value) {
        value = 999;
        return value;
      },
      afterValidate: onAfterValidate
    });
    setDataAtCell(2, 0, 123);

    setTimeout(() => {
      expect(result).toBe(999);
      done();
    }, 200);
  });

  it('should be able to define custom validator function', (done) => {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'id',
          validator(value, cb) {
            cb(true);
          }},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate: onAfterValidate
    });
    setDataAtCell(2, 0, 123);

    setTimeout(() => {
      expect(onAfterValidate).toHaveBeenCalledWith(true, 123, 2, 'id', undefined, undefined);
      done();
    }, 200);
  });

  it('should be able to define custom validator function when columns is a function', (done) => {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns(column) {
        var colMeta = null;

        if (column === 0) {
          colMeta = {
            data: 'id',
            validator(value, cb) {
              cb(true);
            }
          };

        } else if (column === 1) {
          colMeta = {data: 'name'};

        } else if (column === 2) {
          colMeta = {data: 'lastName'};
        }

        return colMeta;
      },
      afterValidate: onAfterValidate
    });
    setDataAtCell(2, 0, 123);

    setTimeout(() => {
      expect(onAfterValidate).toHaveBeenCalledWith(true, 123, 2, 'id', undefined, undefined);
      done();
    }, 200);
  });

  it('should be able to define custom validator RegExp', (done) => {
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

    setTimeout(() => {
      expect(onAfterValidate).toHaveBeenCalledWith(false, 'test', 2, 'id', undefined, undefined);
      done();
    }, 200);
  });

  it('should be able to define custom validator RegExp when columns is a function', (done) => {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns(column) {
        var colMeta = null;

        if (column === 0) {
          colMeta = {data: 'id', validator: /^\d+$/};

        } else if (column === 1) {
          colMeta = {data: 'name'};

        } else if (column === 2) {
          colMeta = {data: 'lastName'};
        }

        return colMeta;
      },
      afterValidate: onAfterValidate
    });
    setDataAtCell(2, 0, 'test');

    setTimeout(() => {
      expect(onAfterValidate).toHaveBeenCalledWith(false, 'test', 2, 'id', undefined, undefined);
      done();
    }, 200);
  });

  it('this in validator should point to cellProperties', (done) => {
    var result = null;
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {
          data: 'id',
          validator(value, cb) {
            result = this;
            cb(true);
          }
        },
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate: onAfterValidate
    });
    setDataAtCell(2, 0, 123);

    setTimeout(() => {
      expect(result.instance).toEqual(getInstance());
      done();
    }, 200);
  });

  it('this in validator should point to cellProperties when columns is a function', (done) => {
    var result = null;
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns(column) {
        var colMeta = null;

        if (column === 0) {
          colMeta = {
            data: 'id',
            validator(value, cb) {
              result = this;
              cb(true);
            }
          };

        } else if (column === 1) {
          colMeta = {data: 'name'};

        } else if (column === 2) {
          colMeta = {data: 'lastName'};
        }

        return colMeta;
      },
      afterValidate: onAfterValidate
    });
    setDataAtCell(2, 0, 123);

    setTimeout(() => {
      expect(result.instance).toEqual(getInstance());
      done();
    }, 200);
  });

  it('should not throw error after calling validateCells without first argument', (done) => {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 2),
      validator(value, callb) {
        if (value == 'B1') {
          callb(false);
        } else {
          callb(true);
        }
      },
      afterValidate: onAfterValidate
    });

    expect(hot.validateCells).not.toThrow();

    setTimeout(() => {
      expect(spec().$container.find('td.htInvalid').length).toEqual(1);
      expect(spec().$container.find('td:not(.htInvalid)').length).toEqual(3);
      done();
    }, 200);
  });

  it('should add class name `htInvalid` to an cell that does not validate - on validateCells', (done) => {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 2),
      validator(value, callb) {
        if (value == 'B1') {
          callb(false);
        } else {
          callb(true);
        }
      },
      afterValidate: onAfterValidate
    });

    hot.validateCells(() => {
      hot.render();
    });

    setTimeout(() => {
      expect(spec().$container.find('td.htInvalid').length).toEqual(1);
      expect(spec().$container.find('td:not(.htInvalid)').length).toEqual(3);
      done();
    }, 200);
  });

  it('should add class name `htInvalid` to an cell that does not validate - when we trigger validateCell', function(done) {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 2),
      validator(value, cb) {
        cb(false);
      },
      afterValidate: onAfterValidate
    });

    expect(this.$container.find('td:not(.htInvalid)').length).toEqual(4);

    hot.validateCell(hot.getDataAtCell(1, 1), hot.getCellMeta(1, 1), () => {});

    setTimeout(() => {
      expect(spec().$container.find('td.htInvalid').length).toEqual(1);
      expect(spec().$container.find('td:not(.htInvalid)').length).toEqual(3);
      done();
    }, 200);
  });

  it('should remove class name `htInvalid` from an cell that does validate - when we change validator rules', (done) => {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');
    var isValid = false;
    var validator = function() {
      return isValid;
    };
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 2),
      validator(value, cb) {
        cb(validator());
      },
      afterValidate: onAfterValidate
    });

    hot.validateCells(() => {});

    setTimeout(() => {
      expect(spec().$container.find('td.htInvalid').length).toEqual(4);
      expect(spec().$container.find('td:not(.htInvalid)').length).toEqual(0);

      isValid = true;
      onAfterValidate.calls.reset();
      hot.validateCell(hot.getDataAtCell(1, 1), hot.getCellMeta(1, 1), () => {});
    }, 200);

    setTimeout(() => {
      expect(spec().$container.find('td.htInvalid').length).toEqual(3);
      expect(spec().$container.find('td:not(.htInvalid)').length).toEqual(1);
      done();
    }, 400);
  });

  it('should add class name `htInvalid` to an cell that does not validate - on edit', (done) => {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 2),
      validator(value, callb) {
        if (value == 'test') {
          callb(false);
        } else {
          callb(true);
        }
      },
      afterValidate: onAfterValidate
    });

    setDataAtCell(0, 0, 'test');

    setTimeout(() => {
      expect(spec().$container.find('td.htInvalid').length).toEqual(1);
      expect(spec().$container.find('tr:eq(0) td:eq(0)').hasClass('htInvalid')).toEqual(true);
      done();
    }, 200);
  });

  it('should add class name `htInvalid` to a cell without removing other classes', (done) => {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');
    var validator = jasmine.createSpy('validator');

    validator.and.callFake((value, callb) => {
      if (value == 123) {
        callb(false);
      } else {
        callb(true);
      }
    });

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 2),
      type: 'numeric',
      validator,
      afterValidate: onAfterValidate
    });
    setDataAtCell(0, 0, 123);

    setTimeout(() => {
      expect(validator.calls.count()).toEqual(1);
      expect(spec().$container.find('tr:eq(0) td:eq(0)').hasClass('htInvalid')).toEqual(true);
      expect(spec().$container.find('tr:eq(0) td:eq(0)').hasClass('htNumeric')).toEqual(true);
      onAfterValidate.calls.reset();
      setDataAtCell(0, 0, 124);
    }, 200);

    setTimeout(() => {
      expect(spec().$container.find('tr:eq(0) td:eq(0)').hasClass('htInvalid')).toEqual(false);
      expect(spec().$container.find('tr:eq(0) td:eq(0)').hasClass('htNumeric')).toEqual(true);
      done();
    }, 400);
  });

  it('should add class name `htInvalid` to an cell that does not validate - after validateCells', (done) => {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 2),
      afterValidate: onAfterValidate
    });

    setDataAtCell(0, 0, 'test');

    setTimeout(() => {
      expect(spec().$container.find('td.htInvalid').length).toEqual(0);
      updateSettings({
        validator(value, callb) {
          if (value == 'test') {
            callb(false);
          } else {
            callb(true);
          }
        }
      });

      onAfterValidate.calls.reset();

      hot.validateCells(() => {});
    }, 200);

    setTimeout(() => {
      expect(spec().$container.find('td.htInvalid').length).toEqual(1);
      expect(spec().$container.find('tr:eq(0) td:eq(0)').hasClass('htInvalid')).toEqual(true);
      done();
    }, 400);
  });

  it('should remove class name `htInvalid` when cell is edited to validate', (done) => {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 2),
      validator(value, callb) {
        if (value == 'A1') {
          callb(false);
        } else {
          callb(true);
        }
      },
      afterValidate: onAfterValidate
    });

    hot.validateCells(() => {
      hot.render();
    });

    setTimeout(() => {
      expect(spec().$container.find('tr:eq(0) td:eq(0)').hasClass('htInvalid')).toEqual(true);
      onAfterValidate.calls.reset();
      setDataAtCell(0, 0, 'test');
    }, 200);

    setTimeout(() => {
      expect(spec().$container.find('tr:eq(0) td:eq(0)').hasClass('htInvalid')).toEqual(false);
      done();
    }, 400);
  });

  it('should call callback with first argument as `true` if all cells are valid', (done) => {
    var onValidate = jasmine.createSpy('onValidate');
    var onAfterValidate = jasmine.createSpy('onAfterValidate');
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 2),
      validator(value, callback) {
        callback(true);
      },
      afterValidate: onAfterValidate
    });

    hot.validateCells(onValidate);

    setTimeout(() => {
      expect(onValidate).toHaveBeenCalledWith(true);
      done();
    }, 200);
  });

  it('should call callback with first argument as `false` if one of cells is invalid', (done) => {
    var onValidate = jasmine.createSpy('onValidate');
    var onAfterValidate = jasmine.createSpy('onAfterValidate');
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 2),
      validator(value, callback) {
        callback(false);
      },
      afterValidate: onAfterValidate
    });

    hot.validateCells(onValidate);

    setTimeout(() => {
      expect(onValidate).toHaveBeenCalledWith(false);
      done();
    }, 200);
  });

  it('should not allow for changes where data is invalid (multiple changes, async)', (done) => {
    var validatedChanges;

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator(value, callb) {
        setTimeout(() => {
          if (value === 'fail') {
            callb(false);
          } else {
            callb(true);
          }
        }, 10);
      },
      afterChange(changes, source) {
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

    setTimeout(() => {
      expect(validatedChanges.length).toEqual(2);
      expect(validatedChanges[0]).toEqual([0, 0, 'A1', 'A1-new']);
      expect(validatedChanges[1]).toEqual([2, 0, 'A3', 'A3-new']);
      expect(getDataAtCell(0, 0)).toEqual('A1-new');
      expect(getDataAtCell(1, 0)).toEqual('A2');
      expect(getDataAtCell(2, 0)).toEqual('A3-new');
      expect(getCellMeta(0, 0).valid).toBe(true);
      expect(getCellMeta(1, 0).valid).toBe(true);
      expect(getCellMeta(2, 0).valid).toBe(true);
      done();
    }, 200);
  });

  it('should call beforeChange exactly once after cell value edit and validator is synchronous', (done) => {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');
    var onBeforeChange = jasmine.createSpy('onBeforeChange');
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator(value, callback) {
        callback(true);
      },
      beforeChange: onBeforeChange,
      afterValidate: onAfterValidate
    });

    expect(onBeforeChange.calls.count()).toEqual(0);

    hot.setDataAtCell(0, 0, 10);

    setTimeout(() => {
      expect(onBeforeChange.calls.count()).toEqual(1);
      done();
    }, 200);
  });

  it('should call beforeChange exactly once after cell value edit and validator is asynchronous', (done) => {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');
    var onBeforeChange = jasmine.createSpy('onBeforeChange');
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator(value, callback) {
        setTimeout(() => {
          callback(true);
        }, 10);
      },
      beforeChange: onBeforeChange,
      afterValidate: onAfterValidate
    });

    expect(onBeforeChange.calls.count()).toEqual(0);

    hot.setDataAtCell(0, 0, 10);

    setTimeout(() => {
      expect(onBeforeChange.calls.count()).toEqual(1);
      done();
    }, 200);
  });

  it('should call afterChange exactly once after cell value edit and validator is synchronous', (done) => {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');
    var onAfterChange = jasmine.createSpy('onAfterChange');
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator(value, callback) {
        callback(true);
      },
      afterChange: onAfterChange,
      afterValidate: onAfterValidate
    });

    expect(onAfterChange.calls.count()).toEqual(1); // loadData

    hot.setDataAtCell(0, 0, 10);

    setTimeout(() => {
      expect(onAfterChange.calls.count()).toEqual(2);
      done();
    }, 200);
  });

  it('should call afterChange exactly once after cell value edit and validator is asynchronous', (done) => {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');
    var onAfterChange = jasmine.createSpy('onAfterChange');
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator(value, callback) {
        setTimeout(() => {
          callback(true);
        }, 10);
      },
      afterChange: onAfterChange,
      afterValidate: onAfterValidate
    });

    expect(onAfterChange.calls.count()).toEqual(1); // loadData

    hot.setDataAtCell(0, 0, 10);

    setTimeout(() => {
      expect(onAfterChange.calls.count()).toEqual(2);
      done();
    }, 200);
  });

  it('edited cell should stay on screen until value is validated', (done) => {
    var isEditorVisibleBeforeChange;
    var isEditorVisibleAfterChange;
    var onAfterValidate = jasmine.createSpy('onAfterValidate');
    var onAfterChange = jasmine.createSpy('onAfterChange');

    onAfterValidate.and.callFake(() => {
      isEditorVisibleBeforeChange = isEditorVisible();
    });
    onAfterChange.and.callFake(() => {
      isEditorVisibleAfterChange = isEditorVisible();
    });

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2),
      allowInvalid: false,
      afterValidate: onAfterValidate,
      afterChange: onAfterChange,
      validator(value, callback) {
        setTimeout(() => {
          callback(true);
        }, 100);
      }
    });

    selectCell(0, 0);
    keyDown('enter');
    document.activeElement.value = 'Ted';

    onAfterValidate.calls.reset();
    onAfterChange.calls.reset();

    keyDown('enter');

    expect(document.activeElement.nodeName).toEqual('TEXTAREA');

    setTimeout(() => {
      expect(isEditorVisibleBeforeChange).toBe(true);
      expect(isEditorVisibleAfterChange).toBe(true);
      expect(isEditorVisible()).toBe(false);
      done();
    }, 200);
  });

  it('should validate edited cell after selecting another cell', (done) => {
    var validated = false;
    var validatedValue;

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator(value, callback) {
        setTimeout(() => {
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

    setTimeout(() => {
      expect(validatedValue).toEqual('Ted');
      done();
    }, 200);
  });

  it('should leave the new value in editor if it does not validate (async validation), after hitting ENTER', (done) => {
    var validated = false;
    var validationResult;

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator(value, callback) {
        setTimeout(() => {
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

    setTimeout(() => {
      expect(validationResult).toBe(false);
      expect(document.activeElement.value).toEqual('Ted');
      done();
    }, 200);
  });

  it('should leave the new value in editor if it does not validate (sync validation), after hitting ENTER', (done) => {
    var validated = false;
    var validationResult;

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator(value, callback) {
        validated = true;
        validationResult = value.length == 2;
        callback(validationResult);
      }
    });

    selectCell(0, 0);
    keyDown('enter');

    document.activeElement.value = 'Ted';

    keyDown('enter');

    setTimeout(() => {
      expect(validationResult).toBe(false);
      expect(document.activeElement.value).toEqual('Ted');
      done();
    }, 200);
  });

  it('should leave the new value in editor if it does not validate (async validation), after selecting another cell', (done) => {
    var validated = false;
    var validationResult;

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator(value, callback) {
        setTimeout(() => {
          setTimeout(() => {
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

    setTimeout(() => {
      expect(validationResult).toBe(false);
      expect(document.activeElement.value).toEqual('Ted');
      done();
    }, 200);
  });

  it('should leave the new value in editor if it does not validate (sync validation), after selecting another cell', (done) => {
    var validated = false;
    var validationResult;

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator(value, callback) {
        validationResult = value.length == 2;
        callback(validationResult);

        /* Setting this variable has to be async, because we are not interested in when the validation happens, but when
         the callback is being called. Since internally all the callbacks are processed asynchronously (even if they are
         synchronous) end of validator function is not the equivalent of whole validation routine end.
         If it still sounds weird, take a look at HandsontableTextEditorClass.prototype.finishEditing method.
         */

        setTimeout(() => {
          validated = true;
        }, 0);
      }
    });
    selectCell(0, 0);
    keyDown('enter');

    document.activeElement.value = 'Ted';

    selectCell(1, 0);

    setTimeout(() => {
      expect(validationResult).toBe(false);
      expect(document.activeElement.value).toEqual('Ted');
      done();
    }, 200);
  });

  it('should close the editor and save the new value if validation fails and allowInvalid is set to "true"', (done) => {
    var validated = false;
    var validationResult;

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2),
      allowInvalid: true,
      validator(value, callback) {
        setTimeout(() => {

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

    setTimeout(() => {
      expect(validationResult).toBe(false);
      expect(getDataAtCell(0, 0)).toEqual('Ted');
      expect(getCell(0, 0).className).toMatch(/htInvalid/);
      done();
    }, 200);
  });

  it('should close the editor and save the new value after double clicking on a cell, if the previously edited cell validated correctly', (done) => {
    var validated = false;
    var validationResult;

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator(value, callback) {
        setTimeout(() => {

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

    setTimeout(() => {
      mouseDown(cell);
      mouseUp(cell);
      clicks++;
    }, 0);

    setTimeout(() => {
      mouseDown(cell);
      mouseUp(cell);
      clicks++;
    }, 100);

    setTimeout(() => {
      expect(editor.is(':visible')).toBe(false);
      expect(validationResult).toBe(true);
      expect(getDataAtCell(0, 0)).toEqual('AA');
      done();
    }, 300);
  });

  it('should close the editor and restore the original value after double clicking on a cell, if the previously edited cell have not validated', (done) => {
    var validated = false;
    var validationResult;

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator(value, callback) {
        setTimeout(() => {
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

    setTimeout(() => {
      mouseDown(cell);
      mouseUp(cell);
      clicks++;
    }, 0);

    setTimeout(() => {
      mouseDown(cell);
      mouseUp(cell);
      clicks++;
    }, 100);

    setTimeout(() => {
      expect(validationResult).toBe(false);
      expect(getDataAtCell(0, 0)).toEqual('A1');
      done();
    }, 300);
  });

  it('should listen to key changes after cell is corrected (allowInvalid: false)', (done) => {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      allowInvalid: false,
      columns: [
        {data: 'id',
          type: 'numeric',
          validator(val, cb) {
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

    onAfterValidate.calls.reset();

    keyDownUp('enter'); // should be ignored

    setTimeout(() => {
      expect(isEditorVisible()).toBe(true);
      document.activeElement.value = '999';

      onAfterValidate.calls.reset();
      keyDownUp('enter'); // should be accepted
    }, 200);

    setTimeout(() => {
      expect(isEditorVisible()).toBe(false);
      expect(getSelected()).toEqual([3, 0, 3, 0]);

      keyDownUp('arrow_up');
      expect(getSelected()).toEqual([2, 0, 2, 0]);
      done();
    }, 400);
  });

  it('should allow keyboard movement when cell is being validated (move DOWN)', (done) => {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      allowInvalid: false,
      columns: [
        {data: 'id',
          type: 'numeric',
          validator(val, cb) {
            setTimeout(() => {
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

    setTimeout(() => {
      expect(isEditorVisible()).toBe(false);
      expect(getSelected()).toEqual([5, 0, 5, 0]); // only enterMove and first arrow_down is performed
      done();
    }, 200);
  });

  it('should not allow keyboard movement until cell is validated (move UP)', (done) => {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      allowInvalid: false,
      columns: [
        {data: 'id',
          type: 'numeric',
          validator(val, cb) {
            setTimeout(() => {
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

    setTimeout(() => {
      expect(isEditorVisible()).toBe(false);
      expect(getSelected()).toEqual([1, 0, 1, 0]);
      done();
    }, 200);
  });

  it('should not allow keyboard movement until cell is validated (move RIGHT)', (done) => {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      allowInvalid: false,
      columns: [
        {data: 'id',
          type: 'numeric',
          validator(val, cb) {
            setTimeout(() => {
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
    keyDownUp('enter'); // should be accepted but only after 100 ms
    expect(getSelected()).toEqual([3, 0, 3, 0]);

    keyDownUp('arrow_right');
    keyDownUp('arrow_right');
    expect(isEditorVisible()).toBe(true);
    expect(getSelected()).toEqual([3, 2, 3, 2]);

    setTimeout(() => {
      expect(isEditorVisible()).toBe(false);
      expect(getSelected()).toEqual([3, 2, 3, 2]);
      done();
    }, 200);
  });

  it('should not allow keyboard movement until cell is validated (move LEFT)', function(done) {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    hot = handsontable({
      data: arrayOfObjects(),
      allowInvalid: false,
      columns: [
        {data: 'name'},
        {data: 'lastName'},
        {data: 'id',
          type: 'numeric',
          validator(val, cb) {
            setTimeout(() => {
              cb(parseInt(val, 10) > 100);
            }, 100);
          }}
      ],
      afterValidate: onAfterValidate
    });

    selectCell(2, 2);

    keyDownUp('enter');
    document.activeElement.value = '999';
    keyDownUp('enter'); // should be accepted but only after 100 ms
    expect(getSelected()).toEqual([3, 2, 3, 2]);

    this.$container.simulate('keydown', {keyCode: Handsontable.helper.KEY_CODES.ARROW_LEFT});
    this.$container.simulate('keyup', {keyCode: Handsontable.helper.KEY_CODES.ARROW_LEFT});
    this.$container.simulate('keydown', {keyCode: Handsontable.helper.KEY_CODES.ARROW_LEFT});
    this.$container.simulate('keyup', {keyCode: Handsontable.helper.KEY_CODES.ARROW_LEFT});

    expect(isEditorVisible()).toBe(true);
    expect(getSelected()).toEqual([3, 0, 3, 0]);

    setTimeout(() => {
      expect(isEditorVisible()).toBe(false);
      expect(getSelected()).toEqual([3, 0, 3, 0]);
      done();
    }, 200);
  });

  it('should not validate cell if editing has been canceled', (done) => {
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
    keyDownUp(Handsontable.helper.KEY_CODES.ENTER); // open editor
    keyDownUp(Handsontable.helper.KEY_CODES.ESCAPE); // cancel editing

    setTimeout(() => {
      expect(onAfterValidate).not.toHaveBeenCalled();
      done();
    }, 100);
  });

  it('should not validate cell if editing has been canceled when columns is a function', (done) => {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns(column) {
        var colMeta = null;

        if (column === 0) {
          colMeta = {data: 'id'};

        } else if (column === 1) {
          colMeta = {data: 'name'};

        } else if (column === 2) {
          colMeta = {data: 'lastName'};

        }

        return colMeta;
      },
      afterValidate: onAfterValidate
    });

    selectCell(0, 0);
    keyDownUp(Handsontable.helper.KEY_CODES.ENTER); // open editor
    keyDownUp(Handsontable.helper.KEY_CODES.ESCAPE); // cancel editing

    setTimeout(() => {
      expect(onAfterValidate).not.toHaveBeenCalled();
      done();
    }, 100);
  });

  it('should leave cell invalid if editing has been canceled', (done) => {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'id',
          validator(value, cb) {
            cb(false);
          }},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate: onAfterValidate
    });

    setDataAtCell(0, 0, 'foo');

    setTimeout(() => {
      expect(getCellMeta(0, 0).valid).toBe(false);

      selectCell(0, 0);
      keyDownUp(Handsontable.helper.KEY_CODES.ENTER); // open editor
      keyDownUp(Handsontable.helper.KEY_CODES.ESCAPE); // cancel editing

      expect(getCellMeta(0, 0).valid).toBe(false);
      done();
    }, 200);
  });

  it('should leave cell invalid if editing has been canceled when columns is a function', (done) => {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns(column) {
        var colMeta = null;

        if (column === 0) {
          colMeta = {
            data: 'id',
            validator(value, cb) {
              cb(false);
            }
          };

        } else if (column === 1) {
          colMeta = {data: 'name'};

        } else if (column === 2) {
          colMeta = {data: 'lastName'};
        }

        return colMeta;
      },
      afterValidate: onAfterValidate
    });

    setDataAtCell(0, 0, 'foo');

    setTimeout(() => {
      expect(getCellMeta(0, 0).valid).toBe(false);

      selectCell(0, 0);
      keyDownUp(Handsontable.helper.KEY_CODES.ENTER); // open editor
      keyDownUp(Handsontable.helper.KEY_CODES.ESCAPE); // cancel editing

      expect(getCellMeta(0, 0).valid).toBe(false);
      done();
    }, 200);
  });

  it('should open an appropriate editor after cell value is valid again', (done) => {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    var hot = handsontable({
      data: arrayOfObjects(),
      columns: [
        {
          data: 'id',
          validator(value, cb) {
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

    keyDownUp(Handsontable.helper.KEY_CODES.ENTER); // open editor
    activeEditor.setValue('foo');
    keyDownUp(Handsontable.helper.KEY_CODES.ENTER); // save changes, close editor

    setTimeout(() => {
      onAfterValidate.calls.reset();
      activeEditor = hot.getActiveEditor();

      expect(activeEditor.isOpened()).toBe(true); // value is invalid, so editor stays opened
      expect(activeEditor.row).toEqual(0);
      expect(activeEditor.col).toEqual(0);

      activeEditor.setValue(2);

      keyDownUp(Handsontable.helper.KEY_CODES.ENTER); // save changes and move to cell below (row: 1, col: ś0)
    }, 200);

    setTimeout(() => {
      keyDownUp(Handsontable.helper.KEY_CODES.ENTER); // open editor

      activeEditor = hot.getActiveEditor();
      expect(activeEditor.row).toEqual(1);
      expect(activeEditor.col).toEqual(0);
      done();
    }, 400);
  });

  it('should open an appropriate editor after cell value is valid again when columns is a function', (done) => {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    var hot = handsontable({
      data: arrayOfObjects(),
      columns(column) {
        var colMeta = null;

        if (column === 0) {
          colMeta = {
            data: 'id',
            validator(value, cb) {
              cb(value == parseInt(value, 10));
            },
            allowInvalid: false
          };

        } else if (column === 1) {
          colMeta = {data: 'name'};

        } else if (column === 2) {
          colMeta = {data: 'lastName'};

        }

        return colMeta;
      },
      afterValidate: onAfterValidate
    });

    selectCell(0, 0);

    var activeEditor = hot.getActiveEditor();

    expect(activeEditor.row).toEqual(0);
    expect(activeEditor.col).toEqual(0);

    keyDownUp(Handsontable.helper.KEY_CODES.ENTER); // open editor
    activeEditor.setValue('foo');
    keyDownUp(Handsontable.helper.KEY_CODES.ENTER); // save changes, close editor

    setTimeout(() => {
      onAfterValidate.calls.reset();
      activeEditor = hot.getActiveEditor();

      expect(activeEditor.isOpened()).toBe(true); // value is invalid, so editor stays opened
      expect(activeEditor.row).toEqual(0);
      expect(activeEditor.col).toEqual(0);

      activeEditor.setValue(2);

      keyDownUp(Handsontable.helper.KEY_CODES.ENTER); // save changes and move to cell below (row: 1, col: ś0)
    }, 200);

    setTimeout(() => {
      keyDownUp(Handsontable.helper.KEY_CODES.ENTER); // open editor

      activeEditor = hot.getActiveEditor();
      expect(activeEditor.row).toEqual(1);
      expect(activeEditor.col).toEqual(0);
      done();
    }, 400);
  });

  it('should call the validation callback only once, when using the validateCells method on a mixed set of data', (done) => {
    var onValidate = jasmine.createSpy('onValidate');
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    var hot = handsontable({
      data: [
        {id: 'sth', name: 'Steve'},
        {id: 'sth else', name: 'Bob'}
      ],
      columns: [
        {
          data: 'id',
          validator(value, cb) {
            cb(value == parseInt(value, 10));
          }
        },
        {data: 'name'}
      ],
      afterValidate: onAfterValidate
    });

    hot.validateCells(onValidate);

    setTimeout(() => {
      expect(onValidate).toHaveBeenCalledWith(false);
      expect(onValidate.calls.count()).toEqual(1);
      done();
    }, 200);
  });

  it('should call the validation callback only once, when using the validateCells method on a mixed set of data and when columns is a function', (done) => {
    var onValidate = jasmine.createSpy('onValidate');
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    var hot = handsontable({
      data: [
        {id: 'sth', name: 'Steve'},
        {id: 'sth else', name: 'Bob'}
      ],
      columns(column) {
        var colMeta = null;

        if (column === 0) {
          colMeta = {
            data: 'id',
            validator(value, cb) {
              cb(value == parseInt(value, 10));
            }
          };

        } else if (column === 1) {
          colMeta = {data: 'name'};
        }

        return colMeta;
      },
      afterValidate: onAfterValidate
    });

    hot.validateCells(onValidate);

    setTimeout(() => {
      expect(onValidate).toHaveBeenCalledWith(false);
      expect(onValidate.calls.count()).toEqual(1);
      done();
    }, 200);
  });
});
