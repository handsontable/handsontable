describe('Core.validator', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  const arrayOfObjects = function() {
    return [
      { id: 1, name: 'Ted', lastName: 'Right' },
      { id: 2, name: 'Frank', lastName: 'Honest' },
      { id: 3, name: 'Joan', lastName: 'Well' },
      { id: 4, name: 'Sid', lastName: 'Strong' },
      { id: 5, name: 'Jane', lastName: 'Neat' },
      { id: 6, name: 'Chuck', lastName: 'Jackson' },
      { id: 7, name: 'Meg', lastName: 'Jansen' },
      { id: 8, name: 'Rob', lastName: 'Norris' },
      { id: 9, name: 'Sean', lastName: 'O\'Hara' },
      { id: 10, name: 'Eve', lastName: 'Branson' }
    ];
  };

  it('should not throw an exception if the instance was destroyed in the meantime when validator was called', async() => {
    let validatorCallback;

    handsontable({
      data: arrayOfObjects(),
      validator(value, callback) {
        validatorCallback = callback;
      }
    });

    await validateCells();
    await sleep(100);

    destroy();
    spec().$container.remove();

    expect(() => { validatorCallback(false); }).not.toThrow();
    expect(validatorCallback(false)).toBe(undefined);
  });

  it('should be able to define custom validator function', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'id',
          validator(value, cb) {
            cb(true);
          } },
        { data: 'name' },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });

    await setDataAtCell(2, 0, 123);

    await sleep(100); // wait for async validation

    expect(onAfterValidate).toHaveBeenCalledWith(true, 123, 2, 'id');
  });

  it('should be able to define custom validator function when columns is a function', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns(column) {
        let colMeta = null;

        if (column === 0) {
          colMeta = {
            data: 'id',
            validator(value, cb) {
              cb(true);
            }
          };

        } else if (column === 1) {
          colMeta = { data: 'name' };

        } else if (column === 2) {
          colMeta = { data: 'lastName' };
        }

        return colMeta;
      },
      afterValidate: onAfterValidate
    });

    await setDataAtCell(2, 0, 123);

    await sleep(100); // wait for async validation

    expect(onAfterValidate).toHaveBeenCalledWith(true, 123, 2, 'id');
  });

  it('should be able to define custom validator RegExp', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'id', validator: /^\d+$/ },
        { data: 'name' },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });

    await setDataAtCell(2, 0, 'test');

    await sleep(100); // wait for async validation

    expect(onAfterValidate).toHaveBeenCalledWith(false, 'test', 2, 'id');
  });

  it('should be able to define custom validator RegExp when columns is a function', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns(column) {
        let colMeta = null;

        if (column === 0) {
          colMeta = { data: 'id', validator: /^\d+$/ };

        } else if (column === 1) {
          colMeta = { data: 'name' };

        } else if (column === 2) {
          colMeta = { data: 'lastName' };
        }

        return colMeta;
      },
      afterValidate: onAfterValidate
    });

    await setDataAtCell(2, 0, 'test');

    await sleep(100); // wait for async validation

    expect(onAfterValidate).toHaveBeenCalledWith(false, 'test', 2, 'id');
  });

  it('this in validator should point to cellProperties', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');
    let result = null;

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
        { data: 'name' },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });

    await setDataAtCell(2, 0, 123);

    await sleep(100); // wait for async validation

    expect(result.instance).toEqual(getInstance());
  });

  it('this in validator should point to cellProperties when columns is a function', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');
    let result = null;

    handsontable({
      data: arrayOfObjects(),
      columns(column) {
        let colMeta = null;

        if (column === 0) {
          colMeta = {
            data: 'id',
            validator(value, cb) {
              result = this;
              cb(true);
            }
          };

        } else if (column === 1) {
          colMeta = { data: 'name' };

        } else if (column === 2) {
          colMeta = { data: 'lastName' };
        }

        return colMeta;
      },
      afterValidate: onAfterValidate
    });

    await setDataAtCell(2, 0, 123);

    await sleep(100); // wait for async validation

    expect(result.instance).toEqual(getInstance());
  });

  it('should remove class name `htInvalid` from an cell that does validate - when we change validator rules', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');
    let isValid = false;
    const validator = function() {
      return isValid;
    };

    handsontable({
      data: createSpreadsheetData(2, 2),
      validator(value, cb) {
        cb(validator());
      },
      afterValidate: onAfterValidate
    });

    await validateCells(() => {});

    await sleep(100); // wait for async validation

    expect(spec().$container.find('td.htInvalid').length).toEqual(4);
    expect(spec().$container.find('td:not(.htInvalid)').length).toEqual(0);

    isValid = true;
    onAfterValidate.calls.reset();

    await validateCell(getDataAtCell(1, 1), getCellMeta(1, 1), () => {});
    await sleep(100); // wait for async validation

    expect(spec().$container.find('td.htInvalid').length).toEqual(3);
    expect(spec().$container.find('td:not(.htInvalid)').length).toEqual(1);
  });

  it('should add class name `htInvalid` to an cell that does not validate - on edit', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: createSpreadsheetData(2, 2),
      validator(value, callb) {
        if (value === 'test') {
          callb(false);
        } else {
          callb(true);
        }
      },
      afterValidate: onAfterValidate
    });

    await setDataAtCell(0, 0, 'test');

    await sleep(100); // wait for async validation

    expect(spec().$container.find('td.htInvalid').length).toEqual(1);
    expect(spec().$container.find('tr:eq(0) td:eq(0)').hasClass('htInvalid')).toEqual(true);
  });

  it('should not add class name `htInvalid` for cancelled changes - on edit', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: createSpreadsheetData(2, 2),
      validator(value, callb) {
        if (value === 'test') {
          callb(false);
        } else {
          callb(true);
        }
      },
      afterValidate: onAfterValidate,
      beforeChange: () => false
    });

    await setDataAtCell(0, 0, 'test');

    await sleep(500);

    // establishing that validation was not called
    expect(onAfterValidate).not.toHaveBeenCalled();
    // and that the changed value was cleared
    expect(getDataAtCell(0, 0)).not.toEqual('test');
    // and that the cell is not marked invalid
    expect(spec().$container.find('td.htInvalid').length).toEqual(0);
    expect(spec().$container.find('tr:eq(0) td:eq(0)').hasClass('htInvalid')).toEqual(false);
  });

  it('should not remove class name `htInvalid` for cancelled changes - on edit', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');
    let allowChange = true;

    handsontable({
      data: createSpreadsheetData(2, 2),
      validator(value, callb) {
        if (value === 'test') {
          callb(false);
        } else {
          callb(true);
        }
      },
      afterValidate: onAfterValidate,
      beforeChange: () => allowChange
    });

    await setDataAtCell(0, 0, 'test');

    await sleep(500);

    // establishing that validation was called and the cell was set to invalid
    expect(onAfterValidate).toHaveBeenCalled();
    expect(getDataAtCell(0, 0)).toEqual('test');
    expect(onAfterValidate.calls.count()).toEqual(1);
    expect(spec().$container.find('td.htInvalid').length).toEqual(1);
    expect(spec().$container.find('tr:eq(0) td:eq(0)').hasClass('htInvalid')).toEqual(true);

    // setting flag to have 'beforeChange' reject changes, then change value
    allowChange = false;
    await setDataAtCell(0, 0, 'test2');

    await sleep(500);

    // establishing that the value was rejected
    expect(getDataAtCell(0, 0)).toEqual('test');
    // and that validation was not called a second time
    expect(onAfterValidate.calls.count()).toEqual(1);
    // and that the cell is still marked invalid
    expect(spec().$container.find('td.htInvalid').length).toEqual(1);
    expect(spec().$container.find('tr:eq(0) td:eq(0)').hasClass('htInvalid')).toEqual(true);
  });

  it('should add class name `htInvalid` to a cell without removing other classes', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');
    const validator = jasmine.createSpy('validator');

    validator.and.callFake((value, callb) => {
      if (value === 123) {
        callb(false);
      } else {
        callb(true);
      }
    });

    handsontable({
      data: createSpreadsheetData(2, 2),
      type: 'numeric',
      validator,
      afterValidate: onAfterValidate
    });

    await setDataAtCell(0, 0, 123);

    await sleep(100); // wait for async validation

    expect(validator.calls.count()).toEqual(1);
    expect(spec().$container.find('tr:eq(0) td:eq(0)').hasClass('htInvalid')).toEqual(true);
    expect(spec().$container.find('tr:eq(0) td:eq(0)').hasClass('htNumeric')).toEqual(true);

    onAfterValidate.calls.reset();
    await setDataAtCell(0, 0, 124);

    await sleep(100); // wait for async validation

    expect(spec().$container.find('tr:eq(0) td:eq(0)').hasClass('htInvalid')).toEqual(false);
    expect(spec().$container.find('tr:eq(0) td:eq(0)').hasClass('htNumeric')).toEqual(true);
  });

  it('should add class name `htInvalid` to an cell that does not validate - after validateCells', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: createSpreadsheetData(2, 2),
      afterValidate: onAfterValidate
    });

    await setDataAtCell(0, 0, 'test');

    await sleep(100); // wait for async validation

    expect(spec().$container.find('td.htInvalid').length).toEqual(0);

    await updateSettings({
      validator(value, callb) {
        if (value === 'test') {
          callb(false);
        } else {
          callb(true);
        }
      }
    });

    onAfterValidate.calls.reset();

    await validateCells(() => {});

    await sleep(100); // wait for async validation

    expect(spec().$container.find('td.htInvalid').length).toEqual(1);
    expect(spec().$container.find('tr:eq(0) td:eq(0)').hasClass('htInvalid')).toEqual(true);
  });

  it('should add class name `htInvalid` to an cell that does not validate - after validateRows', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: createSpreadsheetData(2, 2),
      afterValidate: onAfterValidate
    });

    await setDataAtCell(0, 0, 'test');

    await sleep(100); // wait for async validation

    expect(spec().$container.find('td.htInvalid').length).toEqual(0);

    await updateSettings({
      validator(value, callb) {
        if (value === 'test') {
          callb(false);
        } else {
          callb(true);
        }
      }
    });

    onAfterValidate.calls.reset();

    await validateRows([0], () => {});

    await sleep(100); // wait for async validation

    expect(spec().$container.find('td.htInvalid').length).toEqual(1);
    expect(spec().$container.find('tr:eq(0) td:eq(0)').hasClass('htInvalid')).toEqual(true);
  });

  it('should add class name `htInvalid` to an cell that does not validate - after validateColumns', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: createSpreadsheetData(2, 2),
      afterValidate: onAfterValidate
    });

    await setDataAtCell(0, 0, 'test');

    await sleep(100); // wait for async validation

    expect(spec().$container.find('td.htInvalid').length).toEqual(0);

    await updateSettings({
      validator(value, callb) {
        if (value === 'test') {
          callb(false);
        } else {
          callb(true);
        }
      }
    });

    onAfterValidate.calls.reset();

    await validateColumns([0], () => {});

    await sleep(100); // wait for async validation

    expect(spec().$container.find('td.htInvalid').length).toEqual(1);
    expect(spec().$container.find('tr:eq(0) td:eq(0)').hasClass('htInvalid')).toEqual(true);
  });

  it('should remove class name `htInvalid` when cell is edited to validate', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: createSpreadsheetData(2, 2),
      validator(value, callb) {
        if (value === 'A1') {
          callb(false);
        } else {
          callb(true);
        }
      },
      afterValidate: onAfterValidate
    });

    await validateCells(() => {
      // eslint-disable-next-line handsontable/require-await
      render();
    });

    await sleep(100); // wait for async validation

    expect(spec().$container.find('tr:eq(0) td:eq(0)').hasClass('htInvalid')).toEqual(true);

    onAfterValidate.calls.reset();
    await setDataAtCell(0, 0, 'test');

    await sleep(100); // wait for async validation

    expect(spec().$container.find('tr:eq(0) td:eq(0)').hasClass('htInvalid')).toEqual(false);
  });

  it('should reset the validation state to `true` when the change is cancelled', async() => {
    handsontable({
      data: createSpreadsheetData(2, 2),
      allowInvalid: false,
      validator(value, callback) {
        callback(false);
      },
    });

    // eslint-disable-next-line handsontable/require-await
    await promisfy(resolve => validateCells(resolve));
    await setDataAtCell(0, 0, 'test');
    await sleep(100); // wait for async validation

    expect(getCellMeta(0, 0).valid).toBe(true);
  });

  it('should not allow for changes where data is invalid (multiple changes, async)', async() => {
    let validatedChanges;

    handsontable({
      data: createSpreadsheetData(5, 2),
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

    await populateFromArray(0, 0, [
      ['A1-new'],
      ['fail'],
      ['A3-new']
    ]);

    await sleep(100); // wait for async validation

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

  it('should call beforeChange exactly once after cell value edit and validator is synchronous', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');
    const onBeforeChange = jasmine.createSpy('onBeforeChange');

    handsontable({
      data: createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator(value, callback) {
        callback(true);
      },
      beforeChange: onBeforeChange,
      afterValidate: onAfterValidate
    });

    expect(onBeforeChange.calls.count()).toEqual(0);

    await setDataAtCell(0, 0, 10);
    await sleep(100); // wait for async validation

    expect(onBeforeChange.calls.count()).toEqual(1);
  });

  it('should call beforeChange exactly once after cell value edit and validator is asynchronous', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');
    const onBeforeChange = jasmine.createSpy('onBeforeChange');

    handsontable({
      data: createSpreadsheetData(5, 2),
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

    await setDataAtCell(0, 0, 10);
    await sleep(100); // wait for async validation

    expect(onBeforeChange.calls.count()).toEqual(1);
  });

  it('should call afterChange exactly once after cell value edit and validator is synchronous', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');
    const onAfterChange = jasmine.createSpy('onAfterChange');

    handsontable({
      data: createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator(value, callback) {
        callback(true);
      },
      afterChange: onAfterChange,
      afterValidate: onAfterValidate
    });

    expect(onAfterChange.calls.count()).toEqual(1); // loadData

    await setDataAtCell(0, 0, 10);
    await sleep(100); // wait for async validation

    expect(onAfterChange.calls.count()).toEqual(2);
  });

  it('should call afterChange exactly once after cell value edit and validator is asynchronous', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');
    const onAfterChange = jasmine.createSpy('onAfterChange');

    handsontable({
      data: createSpreadsheetData(5, 2),
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

    await setDataAtCell(0, 0, 10);
    await sleep(100); // wait for async validation

    expect(onAfterChange.calls.count()).toEqual(2);
  });

  it('edited cell should stay on screen until value is validated but should be closed before apply changes', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');
    const onAfterChange = jasmine.createSpy('onAfterChange');
    let isEditorVisibleBeforeChange;
    let isEditorVisibleAfterChange;

    onAfterValidate.and.callFake(() => {
      isEditorVisibleBeforeChange = isEditorVisible();
    });
    onAfterChange.and.callFake(() => {
      isEditorVisibleAfterChange = isEditorVisible();
    });

    handsontable({
      data: createSpreadsheetData(5, 2),
      allowInvalid: false,
      afterValidate: onAfterValidate,
      afterChange: onAfterChange,
      validator(value, callback) {
        setTimeout(() => {
          callback(true);
        }, 100);
      }
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    document.activeElement.value = 'Ted';

    onAfterValidate.calls.reset();
    onAfterChange.calls.reset();

    await keyDownUp('enter');

    expect(document.activeElement.nodeName).toEqual('TEXTAREA');

    await sleep(200);

    expect(isEditorVisibleBeforeChange).toBe(true);
    expect(isEditorVisibleAfterChange).toBe(false);
    expect(isEditorVisible()).toBe(false);
  });

  it('edited cell should stay on screen until value is validated and should not be closed when validator does not pass', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');
    const onAfterChange = jasmine.createSpy('onAfterChange');
    let isEditorVisibleBeforeChange;
    let isEditorVisibleAfterChange;

    onAfterValidate.and.callFake(() => {
      isEditorVisibleBeforeChange = isEditorVisible();
    });
    onAfterChange.and.callFake(() => {
      isEditorVisibleAfterChange = isEditorVisible();
    });

    handsontable({
      data: createSpreadsheetData(5, 2),
      allowInvalid: false,
      afterValidate: onAfterValidate,
      afterChange: onAfterChange,
      validator(value, callback) {
        setTimeout(() => {
          callback(false);
        }, 100);
      }
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    document.activeElement.value = 'Ted';

    onAfterValidate.calls.reset();
    onAfterChange.calls.reset();

    await keyDownUp('enter');

    expect(document.activeElement.nodeName).toEqual('TEXTAREA');

    await sleep(200);

    expect(isEditorVisibleBeforeChange).toBe(true);
    expect(isEditorVisibleAfterChange).toBe(false);
    expect(isEditorVisible()).toBe(true);
  });

  it('should validate edited cell after selecting another cell', async() => {
    let validatedValue;

    handsontable({
      data: createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator(value, callback) {
        setTimeout(() => {
          validatedValue = value;
          callback(true);
        }, 50);
      }
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    document.activeElement.value = 'Ted';

    await selectCell(0, 1);
    await sleep(150);

    expect(validatedValue).toEqual('Ted');
  });

  it('should leave the new value in editor if it does not validate (async validation), after hitting ENTER', async() => {
    let validationResult;

    handsontable({
      data: createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator(value, callback) {
        setTimeout(() => {
          validationResult = value.length === 2;
          callback(validationResult);
        }, 50);
      }
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    document.activeElement.value = 'Ted';

    await keyDownUp('enter');
    await sleep(100); // wait for async validation

    expect(validationResult).toBe(false);
    expect(document.activeElement.value).toEqual('Ted');
  });

  it('should leave the new value in editor if it does not validate (sync validation), after hitting ENTER', async() => {
    let validationResult;

    handsontable({
      data: createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator(value, callback) {
        validationResult = value.length === 2;
        callback(validationResult);
      }
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    document.activeElement.value = 'Ted';

    await keyDownUp('enter');
    await sleep(100); // wait for async validation

    expect(validationResult).toBe(false);
    expect(document.activeElement.value).toEqual('Ted');
  });

  it('should leave the new value in editor if it does not validate (async validation), after selecting another cell', async() => {
    let validationResult;

    handsontable({
      data: createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator(value, callback) {
        setTimeout(() => {
          validationResult = value.length === 2;
          callback(validationResult);
        }, 50);
      }
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    document.activeElement.value = 'Ted';

    await selectCell(1, 0);
    await sleep(100); // wait for async validation

    expect(validationResult).toBe(false);
    expect(document.activeElement.value).toEqual('Ted');
  });

  it('should leave the new value in editor if it does not validate (sync validation), after selecting another cell', async() => {
    let validationResult;

    handsontable({
      data: createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator(value, callback) {
        validationResult = value.length === 2;
        callback(validationResult);
      }
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    document.activeElement.value = 'Ted';

    await selectCell(1, 0);
    await sleep(100); // wait for async validation

    expect(validationResult).toBe(false);
    expect(document.activeElement.value).toEqual('Ted');
  });

  it('should remove htInvalid class properly after cancelling change, when physical indexes are not equal to visual indexes', async() => {
    handsontable({
      data: createSpreadsheetData(5, 2),
      columnSorting: {
        column: 0,
        sortOrder: 'desc'
      },
      allowInvalid: false,
      validator(value, callback) {
        setTimeout(() => {
          callback(value.length === 2);
        }, 50);
      }
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    document.activeElement.value = 'Ted';

    await keyDownUp('enter');
    await sleep(100); // wait for async validation

    const $cell = $(getCell(0, 0));

    expect($cell.hasClass('htInvalid')).toEqual(false);
  });

  it('should not attempt to remove the htInvalid class if the validated cell is no longer rendered', async() => {
    handsontable({
      data: createSpreadsheetData(20, 2),
      columnSorting: {
        column: 0,
        sortOrder: 'desc'
      },
      allowInvalid: false,
      validator(value, callback) {
        setTimeout(() => {
          callback(value.length === 2);
        }, 50);
      },
      height: 40
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    document.activeElement.value = 'Ted';

    await selectCell(19, 0);
    await sleep(100); // wait for async validation

    const $cell = $(getCell(0, 0));

    expect($cell.hasClass('htInvalid')).toEqual(false);
  });

  it('should close the editor and save the new value if validation fails and allowInvalid is set to "true"', async() => {
    let validationResult;

    handsontable({
      data: createSpreadsheetData(5, 2),
      allowInvalid: true,
      validator(value, callback) {
        setTimeout(() => {
          validationResult = value.length === 2;
          callback(validationResult);
        }, 50);
      }
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    document.activeElement.value = 'Ted';

    await selectCell(1, 0);
    await sleep(100); // wait for async validation

    expect(validationResult).toBe(false);
    expect(getDataAtCell(0, 0)).toEqual('Ted');
    expect(getCell(0, 0).className).toMatch(/htInvalid/);
  });

  it('should close the editor and save the new value after double clicking on a cell, if the previously edited cell validated correctly', async() => {
    let validationResult;

    handsontable({
      data: createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator(value, callback) {
        setTimeout(() => {

          validationResult = value.length === 2;
          callback(validationResult);
        }, 50);
      }
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    expect(isEditorVisible()).toBe(true);

    document.activeElement.value = 'AA';

    expect(document.activeElement.value).toEqual('AA');

    const cell = $(getCell(1, 0));

    await mouseDoubleClick(cell);
    await sleep(100); // wait for async validation

    expect(isEditorVisible()).toBe(false);
    expect(validationResult).toBe(true);
    expect(getDataAtCell(0, 0)).toEqual('AA');
  });

  it('should close the editor and restore the original value after double clicking on a cell, if the previously edited cell have not validated', async() => {
    let validationResult;

    handsontable({
      data: createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator(value, callback) {
        setTimeout(() => {
          validationResult = value.length === 2;
          callback(validationResult);
        }, 50);
      }
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    document.activeElement.value = 'AAA';

    expect(document.activeElement.value).toEqual('AAA');

    const cell = $(getCell(1, 0));

    await mouseDoubleClick(cell);
    await sleep(100); // wait for async validation

    expect(validationResult).toBe(false);
    expect(getDataAtCell(0, 0)).toEqual('A1');
  });

  it('should listen to key changes after cell is corrected (allowInvalid: false)', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      allowInvalid: false,
      columns: [
        {
          data: 'id',
          type: 'numeric',
          validator(val, cb) {
            cb(parseInt(val, 10) > 100);
          }
        },
        { data: 'name' },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });

    await selectCell(2, 0);
    await keyDownUp('enter');

    document.activeElement.value = '99';

    onAfterValidate.calls.reset();

    await keyDownUp('enter'); // should be ignored
    await sleep(200);

    expect(isEditorVisible()).toBe(true);
    document.activeElement.value = '999';

    onAfterValidate.calls.reset();

    await keyDownUp('enter'); // should be accepted
    await sleep(200);

    expect(isEditorVisible()).toBe(false);
    expect(getSelected()).toEqual([[3, 0, 3, 0]]);

    await keyDownUp('arrowup');

    expect(getSelected()).toEqual([[2, 0, 2, 0]]);
  });

  it('should allow keyboard movement when cell is being validated (move DOWN)', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      allowInvalid: false,
      columns: [
        { data: 'id',
          type: 'numeric',
          validator(val, cb) {
            setTimeout(() => {
              cb(parseInt(val, 10) > 100);
            }, 50);
          } },
        { data: 'name' },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });

    await selectCell(2, 0);
    await keyDownUp('enter');

    document.activeElement.value = '999';

    await keyDownUp('enter');

    expect(getSelected()).toEqual([[3, 0, 3, 0]]);

    await keyDownUp('arrowdown');
    await keyDownUp('arrowdown');

    expect(isEditorVisible()).toBe(true);
    expect(getSelected()).toEqual([[5, 0, 5, 0]]);

    await sleep(100); // wait for async validation

    expect(isEditorVisible()).toBe(false);
    expect(getSelected()).toEqual([[5, 0, 5, 0]]); // only enterMove and first arrow_down is performed
  });

  it('should not allow keyboard movement until cell is validated (move UP)', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      allowInvalid: false,
      columns: [
        { data: 'id',
          type: 'numeric',
          validator(val, cb) {
            setTimeout(() => {
              cb(parseInt(val, 10) > 100);
            }, 50);
          } },
        { data: 'name' },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });

    await selectCell(2, 0);
    await keyDownUp('enter');

    document.activeElement.value = '999';

    await keyDownUp('enter');

    expect(getSelected()).toEqual([[3, 0, 3, 0]]);

    await keyDownUp('arrowup');
    await keyDownUp('arrowup');

    expect(isEditorVisible()).toBe(true);
    expect(getSelected()).toEqual([[1, 0, 1, 0]]);

    await sleep(100); // wait for async validation

    expect(isEditorVisible()).toBe(false);
    expect(getSelected()).toEqual([[1, 0, 1, 0]]);
  });

  it('should not allow keyboard movement until cell is validated (move RIGHT)', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      allowInvalid: false,
      columns: [
        { data: 'id',
          type: 'numeric',
          validator(val, cb) {
            setTimeout(() => {
              cb(parseInt(val, 10) > 100);
            }, 50);
          } },
        { data: 'name' },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });

    await selectCell(2, 0);
    await keyDownUp('enter');

    document.activeElement.value = '999';

    await keyDownUp('enter'); // should be accepted but only after 100 ms

    expect(getSelected()).toEqual([[3, 0, 3, 0]]);

    await keyDownUp('arrowright');
    await keyDownUp('arrowright');

    expect(isEditorVisible()).toBe(true);
    expect(getSelected()).toEqual([[3, 2, 3, 2]]);

    await sleep(100); // wait for async validation

    expect(isEditorVisible()).toBe(false);
    expect(getSelected()).toEqual([[3, 2, 3, 2]]);
  });

  it('should not allow keyboard movement until cell is validated (move LEFT)', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      allowInvalid: false,
      columns: [
        { data: 'name' },
        { data: 'lastName' },
        { data: 'id',
          type: 'numeric',
          validator(val, cb) {
            setTimeout(() => {
              cb(parseInt(val, 10) > 100);
            }, 50);
          } }
      ],
      afterValidate: onAfterValidate
    });

    await selectCell(2, 2);
    await keyDownUp('enter');

    document.activeElement.value = '999';

    await keyDownUp('enter'); // should be accepted but only after 100 ms

    expect(getSelected()).toEqual([[3, 2, 3, 2]]);

    await keyDownUp('arrowleft');
    await keyDownUp('arrowleft');

    expect(isEditorVisible()).toBe(true);
    expect(getSelected()).toEqual([[3, 0, 3, 0]]);

    await sleep(100); // wait for async validation

    expect(isEditorVisible()).toBe(false);
    expect(getSelected()).toEqual([[3, 0, 3, 0]]);
  });

  it('should not validate cell if editing has been canceled', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'id' },
        { data: 'name' },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });

    await selectCell(0, 0);
    await keyDownUp('enter'); // open editor
    await keyDownUp('escape'); // cancel editing
    await sleep(100);

    expect(onAfterValidate).not.toHaveBeenCalled();
  });

  it('should not validate cell if editing has been canceled when columns is a function', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns(column) {
        let colMeta = null;

        if (column === 0) {
          colMeta = { data: 'id' };

        } else if (column === 1) {
          colMeta = { data: 'name' };

        } else if (column === 2) {
          colMeta = { data: 'lastName' };

        }

        return colMeta;
      },
      afterValidate: onAfterValidate
    });

    await selectCell(0, 0);
    await keyDownUp('enter'); // open editor
    await keyDownUp('escape'); // cancel editing
    await sleep(100);

    expect(onAfterValidate).not.toHaveBeenCalled();
  });

  it('should leave cell invalid if editing has been canceled', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'id',
          validator(value, cb) {
            cb(false);
          } },
        { data: 'name' },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });

    await setDataAtCell(0, 0, 'foo');

    await sleep(100);

    expect(getCellMeta(0, 0).valid).toBe(false);

    await selectCell(0, 0);
    await keyDownUp('enter'); // open editor
    await keyDownUp('escape'); // cancel editing

    expect(getCellMeta(0, 0).valid).toBe(false);
  });

  it('should leave cell invalid if editing has been canceled when columns is a function', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns(column) {
        let colMeta = null;

        if (column === 0) {
          colMeta = {
            data: 'id',
            validator(value, cb) {
              cb(false);
            }
          };

        } else if (column === 1) {
          colMeta = { data: 'name' };

        } else if (column === 2) {
          colMeta = { data: 'lastName' };
        }

        return colMeta;
      },
      afterValidate: onAfterValidate
    });

    await setDataAtCell(0, 0, 'foo');

    await sleep(100);

    expect(getCellMeta(0, 0).valid).toBe(false);

    await selectCell(0, 0);
    await keyDownUp('enter'); // open editor
    await keyDownUp('escape'); // cancel editing

    expect(getCellMeta(0, 0).valid).toBe(false);
  });

  it('should open an appropriate editor after cell value is valid again', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {
          data: 'id',
          validator(value, cb) {
            // eslint-disable-next-line
            cb(value == parseInt(value, 10));
          },
          allowInvalid: false
        },
        { data: 'name' },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });

    await selectCell(0, 0);

    let activeEditor = getActiveEditor();

    expect(activeEditor.row).toEqual(0);
    expect(activeEditor.col).toEqual(0);

    await keyDownUp('enter'); // open editor

    activeEditor.setValue('foo');

    await keyDownUp('enter'); // save changes, close editor
    await sleep(200);

    onAfterValidate.calls.reset();
    activeEditor = getActiveEditor();

    expect(activeEditor.isOpened()).toBe(true); // value is invalid, so editor stays opened
    expect(activeEditor.row).toEqual(0);
    expect(activeEditor.col).toEqual(0);

    activeEditor.setValue(2);

    await keyDownUp('enter'); // save changes and move to cell below (row: 1, col: ś0)
    await sleep(200);

    await keyDownUp('enter'); // open editor

    activeEditor = getActiveEditor();

    expect(activeEditor.row).toEqual(1);
    expect(activeEditor.col).toEqual(0);
  });

  it('should open an appropriate editor after cell value is valid again when columns is a function', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns(column) {
        let colMeta = null;

        if (column === 0) {
          colMeta = {
            data: 'id',
            validator(value, cb) {
              // eslint-disable-next-line
              cb(value == parseInt(value, 10));
            },
            allowInvalid: false
          };

        } else if (column === 1) {
          colMeta = { data: 'name' };

        } else if (column === 2) {
          colMeta = { data: 'lastName' };

        }

        return colMeta;
      },
      afterValidate: onAfterValidate
    });

    await selectCell(0, 0);

    let activeEditor = getActiveEditor();

    expect(activeEditor.row).toEqual(0);
    expect(activeEditor.col).toEqual(0);

    await keyDownUp('enter'); // open editor

    activeEditor.setValue('foo');

    await keyDownUp('enter'); // save changes, close editor
    await sleep(200);

    onAfterValidate.calls.reset();
    activeEditor = getActiveEditor();

    expect(activeEditor.isOpened()).toBe(true); // value is invalid, so editor stays opened
    expect(activeEditor.row).toEqual(0);
    expect(activeEditor.col).toEqual(0);

    activeEditor.setValue(2);

    await keyDownUp('enter'); // save changes and move to cell below (row: 1, col: ś0)
    await sleep(200);

    await keyDownUp('enter'); // open editor

    activeEditor = getActiveEditor();

    expect(activeEditor.row).toEqual(1);
    expect(activeEditor.col).toEqual(0);
  });

  it('should call the callback in the `done` function using the renderable indexes (passing them to the renderer)', async() => {
    handsontable({
      data: createSpreadsheetData(1, 4),
      hiddenColumns: {
        columns: [1]
      },
      columns: [
        { type: 'text' },
        { type: 'text' },
        { type: 'date' },
        { type: 'text' },
      ]
    });

    spyOn(tableView()._wt.wtSettings.settings, 'cellRenderer');

    // eslint-disable-next-line handsontable/require-await
    await promisfy(resolve => validateCells(resolve));

    const mostRecentRendererCallArgs = tableView()._wt.wtSettings.settings.cellRenderer.calls.mostRecent().args;

    // The `date` column (the one that is being validated) should be described as the `1` (renderable) column.
    expect(mostRecentRendererCallArgs[1]).toEqual(1);
  });
});
