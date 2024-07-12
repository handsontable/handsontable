describe('Core_validate', () => {
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

    const hot = handsontable({
      data: arrayOfObjects(),
      validator(value, callback) {
        validatorCallback = callback;
      }
    });

    hot.validateCells();

    await sleep(100);

    hot.destroy();
    spec().$container.remove();

    expect(() => { validatorCallback(false); }).not.toThrow();
    expect(validatorCallback(false)).toBe(undefined);
  });

  it('should call beforeValidate', () => {
    let fired = null;

    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'id', type: 'numeric' },
        { data: 'name' },
        { data: 'lastName' }
      ],
      beforeValidate() {
        fired = true;
      }
    });
    setDataAtCell(2, 0, 'test');

    expect(fired).toEqual(true);
  });

  it('should call beforeValidate when columns is a function', () => {
    let fired = null;

    handsontable({
      data: arrayOfObjects(),
      columns(column) {
        let colMeta = {};

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
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'id', type: 'numeric' },
        { data: 'name' },
        { data: 'lastName' }
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
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns(column) {
        let colMeta = {};

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
    const onAfterValidate = jasmine.createSpy('onAfterValidate');
    let result = null;

    onAfterValidate.and.callFake((valid, value) => {
      result = value;
    });

    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'id', type: 'numeric' },
        { data: 'name' },
        { data: 'lastName' }
      ],
      beforeValidate() {
        return 999;
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
    const onAfterValidate = jasmine.createSpy('onAfterValidate');
    let result = null;

    onAfterValidate.and.callFake((valid, value) => {
      result = value;
    });

    handsontable({
      data: arrayOfObjects(),
      columns(column) {
        let colMeta = {};

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
        return 999;
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
    setDataAtCell(2, 0, 123);

    setTimeout(() => {
      expect(onAfterValidate).toHaveBeenCalledWith(true, 123, 2, 'id');
      done();
    }, 200);
  });

  it('should be able to define custom validator function when columns is a function', (done) => {
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
    setDataAtCell(2, 0, 123);

    setTimeout(() => {
      expect(onAfterValidate).toHaveBeenCalledWith(true, 123, 2, 'id');
      done();
    }, 200);
  });

  it('should be able to define custom validator RegExp', (done) => {
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

    setDataAtCell(2, 0, 'test');

    setTimeout(() => {
      expect(onAfterValidate).toHaveBeenCalledWith(false, 'test', 2, 'id');
      done();
    }, 200);
  });

  it('should be able to define custom validator RegExp when columns is a function', (done) => {
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
    setDataAtCell(2, 0, 'test');

    setTimeout(() => {
      expect(onAfterValidate).toHaveBeenCalledWith(false, 'test', 2, 'id');
      done();
    }, 200);
  });

  it('this in validator should point to cellProperties', (done) => {
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
    setDataAtCell(2, 0, 123);

    setTimeout(() => {
      expect(result.instance).toEqual(getInstance());
      done();
    }, 200);
  });

  it('this in validator should point to cellProperties when columns is a function', (done) => {
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
    setDataAtCell(2, 0, 123);

    setTimeout(() => {
      expect(result.instance).toEqual(getInstance());
      done();
    }, 200);
  });

  it('should not throw error after calling validateCells without first argument', (done) => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 2),
      validator(value, callb) {
        if (value === 'B1') {
          callb(false);
        } else {
          callb(true);
        }
      },
      afterValidate: onAfterValidate
    });

    expect(() => hot.validateCells()).not.toThrow();

    setTimeout(() => {
      expect(spec().$container.find('td.htInvalid').length).toEqual(1);
      expect(spec().$container.find('td:not(.htInvalid)').length).toEqual(3);
      done();
    }, 200);
  });

  it('should throw error after calling validateRows first argument not array', (done) => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 2),
      validator(value, callb) {
        callb(true);
      },
      afterValidate: onAfterValidate
    });

    expect(() => hot.validateRows()).toThrow();
    expect(() => hot.validateRows(0, () => {})).toThrow();
    expect(() => hot.validateRows({}, () => {})).toThrow();
    expect(() => hot.validateRows(() => {})).toThrow();
    done();
  });

  it('should throw error after calling validateColumns first argument not array', (done) => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 2),
      validator(value, callb) {
        callb(true);
      },
      afterValidate: onAfterValidate
    });

    expect(() => hot.validateColumns()).toThrow();
    expect(() => hot.validateColumns(0, () => {})).toThrow();
    expect(() => hot.validateColumns({}, () => {})).toThrow();
    expect(() => hot.validateColumns(() => {})).toThrow();
    done();
  });

  it('should not throw error after calling validateRows without second argument', (done) => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 2),
      validator(value, callb) {
        callb(true);
      },
      afterValidate: onAfterValidate
    });

    expect(() => hot.validateRows([])).not.toThrow();
    expect(() => hot.validateRows([0, 1])).not.toThrow();
    expect(() => hot.validateRows([100, 101])).not.toThrow();
    done();
  });

  it('should not throw error after calling validateColumns without second argument', (done) => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 2),
      validator(value, callb) {
        callb(true);
      },
      afterValidate: onAfterValidate
    });

    expect(() => hot.validateColumns([])).not.toThrow();
    expect(() => hot.validateColumns([0, 1])).not.toThrow();
    expect(() => hot.validateColumns([100, 101])).not.toThrow();
    done();
  });

  it('should add class name `htInvalid` to an cell that does not validate - on validateCells', (done) => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 2),
      validator(value, callb) {
        if (value === 'B1') {
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

  it('should add class name `htInvalid` to an cell that does not validate - on validateRows', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 2),
      validator(value, callb) {
        if (value === 'B1') {
          callb(false);
        } else {
          callb(true);
        }
      },
      afterValidate: onAfterValidate
    });

    hot.validateRows([], () => {
      hot.render();
    });

    await sleep(150);
    expect(spec().$container.find('td.htInvalid').length).toEqual(0);
    expect(spec().$container.find('td:not(.htInvalid)').length).toEqual(4);

    hot.loadData(Handsontable.helper.createSpreadsheetData(2, 2));

    hot.validateRows([0], () => {
      hot.render();
    });

    await sleep(150);
    expect(spec().$container.find('td.htInvalid').length).toEqual(1);
    expect(spec().$container.find('td:not(.htInvalid)').length).toEqual(3);

    hot.loadData(Handsontable.helper.createSpreadsheetData(2, 2));

    hot.validateRows([1], () => {
      hot.render();
    });

    await sleep(150);
    expect(spec().$container.find('td.htInvalid').length).toEqual(0);
    expect(spec().$container.find('td:not(.htInvalid)').length).toEqual(4);

    hot.loadData(Handsontable.helper.createSpreadsheetData(2, 2));

    hot.validateRows([0, 1], () => {
      hot.render();
    });

    await sleep(150);
    expect(spec().$container.find('td.htInvalid').length).toEqual(1);
    expect(spec().$container.find('td:not(.htInvalid)').length).toEqual(3);

    hot.loadData(Handsontable.helper.createSpreadsheetData(2, 2));

    hot.validateRows([0, 1, 100], () => {
      hot.render();
    });

    await sleep(150);
    expect(spec().$container.find('td.htInvalid').length).toEqual(1);
    expect(spec().$container.find('td:not(.htInvalid)').length).toEqual(3);

    hot.loadData(Handsontable.helper.createSpreadsheetData(2, 2));

    hot.validateRows([100, 101], () => {
      hot.render();
    });

    await sleep(150);
    expect(spec().$container.find('td.htInvalid').length).toEqual(0);
    expect(spec().$container.find('td:not(.htInvalid)').length).toEqual(4);
  });

  it('should add class name `htInvalid` to an cell that does not validate - on validateColumns', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 2),
      validator(value, callb) {
        if (value === 'B1') {
          callb(false);
        } else {
          callb(true);
        }
      },
      afterValidate: onAfterValidate
    });

    await promisfy(resolve => hot.validateColumns([], resolve));

    expect(spec().$container.find('td.htInvalid').length).toEqual(0);
    expect(spec().$container.find('td:not(.htInvalid)').length).toEqual(4);

    hot.loadData(Handsontable.helper.createSpreadsheetData(2, 2));

    await promisfy(resolve => hot.validateColumns([0], resolve));

    expect(spec().$container.find('td.htInvalid').length).toEqual(0);
    expect(spec().$container.find('td:not(.htInvalid)').length).toEqual(4);

    hot.loadData(Handsontable.helper.createSpreadsheetData(2, 2));

    await promisfy(resolve => hot.validateColumns([1], resolve));

    expect(spec().$container.find('td.htInvalid').length).toEqual(1);
    expect(spec().$container.find('td:not(.htInvalid)').length).toEqual(3);

    hot.loadData(Handsontable.helper.createSpreadsheetData(2, 2));

    await promisfy(resolve => hot.validateColumns([0, 1], resolve));

    expect(spec().$container.find('td.htInvalid').length).toEqual(1);
    expect(spec().$container.find('td:not(.htInvalid)').length).toEqual(3);

    hot.loadData(Handsontable.helper.createSpreadsheetData(2, 2));

    await promisfy(resolve => hot.validateColumns([0, 1, 100], resolve));

    expect(spec().$container.find('td.htInvalid').length).toEqual(1);
    expect(spec().$container.find('td:not(.htInvalid)').length).toEqual(3);

    hot.loadData(Handsontable.helper.createSpreadsheetData(2, 2));

    await promisfy(resolve => hot.validateColumns([100, 101], resolve));

    expect(spec().$container.find('td.htInvalid').length).toEqual(0);
    expect(spec().$container.find('td:not(.htInvalid)').length).toEqual(4);
  });

  it('should add class name `htInvalid` to an cell that does not validate - when we trigger validateCell', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 2),
      validator(value, cb) {
        cb(false);
      },
      afterValidate: onAfterValidate
    });

    expect(spec().$container.find('td:not(.htInvalid)').length).toEqual(4);

    hot.validateCell(hot.getDataAtCell(1, 1), hot.getCellMeta(1, 1), () => {});

    await sleep(200);

    expect(spec().$container.find('td.htInvalid').length).toEqual(1);
    expect(spec().$container.find('td:not(.htInvalid)').length).toEqual(3);
  });

  it('should remove class name `htInvalid` from an cell that does validate - when we change validator rules', (done) => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');
    let isValid = false;
    const validator = function() {
      return isValid;
    };
    const hot = handsontable({
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
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 2),
      validator(value, callb) {
        if (value === 'test') {
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

  it('should not add class name `htInvalid` for cancelled changes - on edit', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 2),
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

    setDataAtCell(0, 0, 'test');

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
      data: Handsontable.helper.createSpreadsheetData(2, 2),
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

    setDataAtCell(0, 0, 'test');

    await sleep(500);

    // establishing that validation was called and the cell was set to invalid
    expect(onAfterValidate).toHaveBeenCalled();
    expect(getDataAtCell(0, 0)).toEqual('test');
    expect(onAfterValidate.calls.count()).toEqual(1);
    expect(spec().$container.find('td.htInvalid').length).toEqual(1);
    expect(spec().$container.find('tr:eq(0) td:eq(0)').hasClass('htInvalid')).toEqual(true);

    // setting flag to have 'beforeChange' reject changes, then change value
    allowChange = false;
    setDataAtCell(0, 0, 'test2');

    await sleep(500);

    // establishing that the value was rejected
    expect(getDataAtCell(0, 0)).toEqual('test');
    // and that validation was not called a second time
    expect(onAfterValidate.calls.count()).toEqual(1);
    // and that the cell is still marked invalid
    expect(spec().$container.find('td.htInvalid').length).toEqual(1);
    expect(spec().$container.find('tr:eq(0) td:eq(0)').hasClass('htInvalid')).toEqual(true);
  });

  it('should add class name `htInvalid` to a cell without removing other classes', (done) => {
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
    const onAfterValidate = jasmine.createSpy('onAfterValidate');
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 2),
      afterValidate: onAfterValidate
    });

    setDataAtCell(0, 0, 'test');

    setTimeout(() => {
      expect(spec().$container.find('td.htInvalid').length).toEqual(0);
      updateSettings({
        validator(value, callb) {
          if (value === 'test') {
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

  it('should add class name `htInvalid` to an cell that does not validate - after validateRows', (done) => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 2),
      afterValidate: onAfterValidate
    });

    setDataAtCell(0, 0, 'test');

    setTimeout(() => {
      expect(spec().$container.find('td.htInvalid').length).toEqual(0);
      updateSettings({
        validator(value, callb) {
          if (value === 'test') {
            callb(false);
          } else {
            callb(true);
          }
        }
      });

      onAfterValidate.calls.reset();

      hot.validateRows([0], () => {});
    }, 200);

    setTimeout(() => {
      expect(spec().$container.find('td.htInvalid').length).toEqual(1);
      expect(spec().$container.find('tr:eq(0) td:eq(0)').hasClass('htInvalid')).toEqual(true);
      done();
    }, 400);
  });

  it('should add class name `htInvalid` to an cell that does not validate - after validateColumns', (done) => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 2),
      afterValidate: onAfterValidate
    });

    setDataAtCell(0, 0, 'test');

    setTimeout(() => {
      expect(spec().$container.find('td.htInvalid').length).toEqual(0);
      updateSettings({
        validator(value, callb) {
          if (value === 'test') {
            callb(false);
          } else {
            callb(true);
          }
        }
      });

      onAfterValidate.calls.reset();

      hot.validateColumns([0], () => {});
    }, 200);

    setTimeout(() => {
      expect(spec().$container.find('td.htInvalid').length).toEqual(1);
      expect(spec().$container.find('tr:eq(0) td:eq(0)').hasClass('htInvalid')).toEqual(true);
      done();
    }, 400);
  });

  it('should remove class name `htInvalid` when cell is edited to validate', (done) => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 2),
      validator(value, callb) {
        if (value === 'A1') {
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
    const onValidate = jasmine.createSpy('onValidate');
    const onAfterValidate = jasmine.createSpy('onAfterValidate');
    const hot = handsontable({
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

  it('should call callback with first argument as `true` if all cells are valid - on validateRows', (done) => {
    const onValidate = jasmine.createSpy('onValidate');
    const onAfterValidate = jasmine.createSpy('onAfterValidate');
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 2),
      validator(value, callback) {
        callback(true);
      },
      afterValidate: onAfterValidate
    });

    hot.validateRows([0, 1], onValidate);

    setTimeout(() => {
      expect(onValidate).toHaveBeenCalledWith(true);
      done();
    }, 200);
  });

  it('should call callback with first argument as `true` if all cells are valid - on validateColumns', (done) => {
    const onValidate = jasmine.createSpy('onValidate');
    const onAfterValidate = jasmine.createSpy('onAfterValidate');
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 2),
      validator(value, callback) {
        callback(true);
      },
      afterValidate: onAfterValidate
    });

    hot.validateColumns([0, 1], onValidate);

    setTimeout(() => {
      expect(onValidate).toHaveBeenCalledWith(true);
      done();
    }, 200);
  });

  it('should call callback with first argument as `false` if one of cells is invalid', (done) => {
    const onValidate = jasmine.createSpy('onValidate');
    const onAfterValidate = jasmine.createSpy('onAfterValidate');
    const hot = handsontable({
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

  it('should call callback with first argument as `false` if one of cells is invalid - on validateRows', (done) => {
    const onValidate = jasmine.createSpy('onValidate');
    const onAfterValidate = jasmine.createSpy('onAfterValidate');
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 2),
      validator(value, callback) {
        callback(false);
      },
      afterValidate: onAfterValidate
    });

    hot.validateRows([0, 1], onValidate);

    setTimeout(() => {
      expect(onValidate).toHaveBeenCalledWith(false);
      done();
    }, 200);
  });

  it('should call callback with first argument as `false` if one of cells is invalid - on validateColumns', (done) => {
    const onValidate = jasmine.createSpy('onValidate');
    const onAfterValidate = jasmine.createSpy('onAfterValidate');
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 2),
      validator(value, callback) {
        callback(false);
      },
      afterValidate: onAfterValidate
    });

    hot.validateColumns([0, 1], onValidate);

    setTimeout(() => {
      expect(onValidate).toHaveBeenCalledWith(false);
      done();
    }, 200);
  });

  it('should not allow for changes where data is invalid (multiple changes, async)', (done) => {
    let validatedChanges;

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
    const onAfterValidate = jasmine.createSpy('onAfterValidate');
    const onBeforeChange = jasmine.createSpy('onBeforeChange');
    const hot = handsontable({
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
    const onAfterValidate = jasmine.createSpy('onAfterValidate');
    const onBeforeChange = jasmine.createSpy('onBeforeChange');
    const hot = handsontable({
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
    const onAfterValidate = jasmine.createSpy('onAfterValidate');
    const onAfterChange = jasmine.createSpy('onAfterChange');
    const hot = handsontable({
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
    const onAfterValidate = jasmine.createSpy('onAfterValidate');
    const onAfterChange = jasmine.createSpy('onAfterChange');
    const hot = handsontable({
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
    keyDownUp('enter');
    document.activeElement.value = 'Ted';

    onAfterValidate.calls.reset();
    onAfterChange.calls.reset();

    keyDownUp('enter');

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
      data: Handsontable.helper.createSpreadsheetData(5, 2),
      allowInvalid: false,
      afterValidate: onAfterValidate,
      afterChange: onAfterChange,
      validator(value, callback) {
        setTimeout(() => {
          callback(false);
        }, 100);
      }
    });

    selectCell(0, 0);
    keyDownUp('enter');
    document.activeElement.value = 'Ted';

    onAfterValidate.calls.reset();
    onAfterChange.calls.reset();

    keyDownUp('enter');

    expect(document.activeElement.nodeName).toEqual('TEXTAREA');

    await sleep(200);

    expect(isEditorVisibleBeforeChange).toBe(true);
    expect(isEditorVisibleAfterChange).toBe(false);
    expect(isEditorVisible()).toBe(true);
  });

  it('should validate edited cell after selecting another cell', async() => {
    let validatedValue;

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator(value, callback) {
        setTimeout(() => {
          validatedValue = value;
          callback(true);
        }, 50);
      }
    });

    selectCell(0, 0);
    keyDownUp('enter');

    document.activeElement.value = 'Ted';

    selectCell(0, 1);
    await sleep(150);

    expect(validatedValue).toEqual('Ted');
  });

  it('should leave the new value in editor if it does not validate (async validation), after hitting ENTER', (done) => {
    let validationResult;

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator(value, callback) {
        setTimeout(() => {
          validationResult = value.length === 2;
          callback(validationResult);
        }, 100);
      }
    });

    selectCell(0, 0);
    keyDownUp('enter');

    document.activeElement.value = 'Ted';

    keyDownUp('enter');

    setTimeout(() => {
      expect(validationResult).toBe(false);
      expect(document.activeElement.value).toEqual('Ted');
      done();
    }, 200);
  });

  it('should leave the new value in editor if it does not validate (sync validation), after hitting ENTER', (done) => {
    let validationResult;

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator(value, callback) {
        validationResult = value.length === 2;
        callback(validationResult);
      }
    });

    selectCell(0, 0);
    keyDownUp('enter');

    document.activeElement.value = 'Ted';

    keyDownUp('enter');

    setTimeout(() => {
      expect(validationResult).toBe(false);
      expect(document.activeElement.value).toEqual('Ted');
      done();
    }, 200);
  });

  it('should leave the new value in editor if it does not validate (async validation), after selecting another cell', (done) => {
    let validationResult;

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator(value, callback) {
        setTimeout(() => {
          validationResult = value.length === 2;
          callback(validationResult);
        }, 100);
      }
    });
    selectCell(0, 0);
    keyDownUp('enter');

    document.activeElement.value = 'Ted';

    selectCell(1, 0);

    setTimeout(() => {
      expect(validationResult).toBe(false);
      expect(document.activeElement.value).toEqual('Ted');
      done();
    }, 200);
  });

  it('should leave the new value in editor if it does not validate (sync validation), after selecting another cell', (done) => {
    let validationResult;

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator(value, callback) {
        validationResult = value.length === 2;
        callback(validationResult);
      }
    });
    selectCell(0, 0);
    keyDownUp('enter');

    document.activeElement.value = 'Ted';

    selectCell(1, 0);

    setTimeout(() => {
      expect(validationResult).toBe(false);
      expect(document.activeElement.value).toEqual('Ted');
      done();
    }, 200);
  });

  it('should remove htInvalid class properly after cancelling change, when physical indexes are not equal to visual indexes', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2),
      columnSorting: {
        column: 0,
        sortOrder: 'desc'
      },
      allowInvalid: false,
      validator(value, callback) {
        setTimeout(() => {
          callback(value.length === 2);
        }, 100);
      }
    });

    selectCell(0, 0);
    keyDownUp('enter');

    document.activeElement.value = 'Ted';

    keyDownUp('enter');

    await sleep(300);

    const $cell = $(getCell(0, 0));

    expect($cell.hasClass('htInvalid')).toEqual(false);
  });

  it('should not attempt to remove the htInvalid class if the validated cell is no longer rendered', (done) => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(20, 2),
      columnSorting: {
        column: 0,
        sortOrder: 'desc'
      },
      allowInvalid: false,
      validator(value, callback) {
        setTimeout(() => {
          callback(value.length === 2);
        }, 100);
      },
      height: 40
    });

    selectCell(0, 0);
    keyDownUp('enter');

    document.activeElement.value = 'Ted';

    selectCell(19, 0);

    setTimeout(() => {
      const $cell = $(getCell(0, 0));

      expect($cell.hasClass('htInvalid')).toEqual(false);
      done();
    }, 200);
  });

  it('should close the editor and save the new value if validation fails and allowInvalid is set to "true"', async() => {
    let validationResult;

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2),
      allowInvalid: true,
      validator(value, callback) {
        setTimeout(() => {
          validationResult = value.length === 2;
          callback(validationResult);
        }, 100);
      }
    });
    selectCell(0, 0);
    keyDownUp('enter');

    document.activeElement.value = 'Ted';

    selectCell(1, 0);

    await sleep(200);
    expect(validationResult).toBe(false);
    expect(getDataAtCell(0, 0)).toEqual('Ted');
    expect(getCell(0, 0).className).toMatch(/htInvalid/);
  });

  it('should close the editor and save the new value after double clicking on a cell, if the previously edited cell validated correctly', async() => {
    let validationResult;

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator(value, callback) {
        setTimeout(() => {

          validationResult = value.length === 2;
          callback(validationResult);
        }, 100);
      }
    });

    selectCell(0, 0);
    keyDownUp('enter');

    expect(isEditorVisible()).toBe(true);

    document.activeElement.value = 'AA';

    expect(document.activeElement.value).toEqual('AA');

    const cell = $(getCell(1, 0));

    await sleep();

    mouseDown(cell);
    mouseUp(cell);

    await sleep(100);

    mouseDown(cell);
    mouseUp(cell);

    await sleep(200);

    expect(isEditorVisible()).toBe(false);
    expect(validationResult).toBe(true);
    expect(getDataAtCell(0, 0)).toEqual('AA');
  });

  it('should close the editor and restore the original value after double clicking on a cell, if the previously edited cell have not validated', (done) => {
    let validationResult;

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2),
      allowInvalid: false,
      validator(value, callback) {
        setTimeout(() => {
          validationResult = value.length === 2;
          callback(validationResult);
        }, 100);
      }
    });
    selectCell(0, 0);
    keyDownUp('enter');

    document.activeElement.value = 'AAA';

    expect(document.activeElement.value).toEqual('AAA');

    const cell = $(getCell(1, 0));

    setTimeout(() => {
      mouseDown(cell);
      mouseUp(cell);
    }, 0);

    setTimeout(() => {
      mouseDown(cell);
      mouseUp(cell);
    }, 100);

    setTimeout(() => {
      expect(validationResult).toBe(false);
      expect(getDataAtCell(0, 0)).toEqual('A1');
      done();
    }, 300);
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
    selectCell(2, 0);

    keyDownUp('enter');
    document.activeElement.value = '99';

    onAfterValidate.calls.reset();

    keyDownUp('enter'); // should be ignored

    await sleep(200);

    expect(isEditorVisible()).toBe(true);
    document.activeElement.value = '999';

    onAfterValidate.calls.reset();
    keyDownUp('enter'); // should be accepted

    await sleep(200);

    expect(isEditorVisible()).toBe(false);
    expect(getSelected()).toEqual([[3, 0, 3, 0]]);

    keyDownUp('arrowup');
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
            }, 100);
          } },
        { data: 'name' },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });
    selectCell(2, 0);

    keyDownUp('enter');
    document.activeElement.value = '999';
    keyDownUp('enter');

    expect(getSelected()).toEqual([[3, 0, 3, 0]]);

    keyDownUp('arrowdown');
    keyDownUp('arrowdown');

    expect(isEditorVisible()).toBe(true);
    expect(getSelected()).toEqual([[5, 0, 5, 0]]);

    await sleep(200);

    expect(isEditorVisible()).toBe(false);
    expect(getSelected()).toEqual([[5, 0, 5, 0]]); // only enterMove and first arrow_down is performed
  });

  it('should not allow keyboard movement until cell is validated (move UP)', (done) => {
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
            }, 100);
          } },
        { data: 'name' },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });

    selectCell(2, 0);

    keyDownUp('enter');
    document.activeElement.value = '999';
    keyDownUp('enter');

    expect(getSelected()).toEqual([[3, 0, 3, 0]]);

    keyDownUp('arrowup');
    keyDownUp('arrowup');
    expect(isEditorVisible()).toBe(true);
    expect(getSelected()).toEqual([[1, 0, 1, 0]]);

    setTimeout(() => {
      expect(isEditorVisible()).toBe(false);
      expect(getSelected()).toEqual([[1, 0, 1, 0]]);
      done();
    }, 200);
  });

  it('should not allow keyboard movement until cell is validated (move RIGHT)', (done) => {
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
            }, 100);
          } },
        { data: 'name' },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });

    selectCell(2, 0);

    keyDownUp('enter');
    document.activeElement.value = '999';
    keyDownUp('enter'); // should be accepted but only after 100 ms
    expect(getSelected()).toEqual([[3, 0, 3, 0]]);

    keyDownUp('arrowright');
    keyDownUp('arrowright');
    expect(isEditorVisible()).toBe(true);
    expect(getSelected()).toEqual([[3, 2, 3, 2]]);

    setTimeout(() => {
      expect(isEditorVisible()).toBe(false);
      expect(getSelected()).toEqual([[3, 2, 3, 2]]);
      done();
    }, 200);
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
            }, 100);
          } }
      ],
      afterValidate: onAfterValidate
    });

    selectCell(2, 2);

    keyDownUp('enter');
    document.activeElement.value = '999';
    keyDownUp('enter'); // should be accepted but only after 100 ms
    expect(getSelected()).toEqual([[3, 2, 3, 2]]);

    keyDownUp('arrowleft');
    keyDownUp('arrowleft');

    expect(isEditorVisible()).toBe(true);
    expect(getSelected()).toEqual([[3, 0, 3, 0]]);

    await sleep(300);

    expect(isEditorVisible()).toBe(false);
    expect(getSelected()).toEqual([[3, 0, 3, 0]]);
  });

  it('should not validate cell if editing has been canceled', (done) => {
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

    selectCell(0, 0);
    keyDownUp('enter'); // open editor
    keyDownUp('escape'); // cancel editing

    setTimeout(() => {
      expect(onAfterValidate).not.toHaveBeenCalled();
      done();
    }, 100);
  });

  it('should not validate cell if editing has been canceled when columns is a function', (done) => {
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

    selectCell(0, 0);
    keyDownUp('enter'); // open editor
    keyDownUp('escape'); // cancel editing

    setTimeout(() => {
      expect(onAfterValidate).not.toHaveBeenCalled();
      done();
    }, 100);
  });

  it('should leave cell invalid if editing has been canceled', (done) => {
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

    setDataAtCell(0, 0, 'foo');

    setTimeout(() => {
      expect(getCellMeta(0, 0).valid).toBe(false);

      selectCell(0, 0);
      keyDownUp('enter'); // open editor
      keyDownUp('escape'); // cancel editing

      expect(getCellMeta(0, 0).valid).toBe(false);
      done();
    }, 200);
  });

  it('should leave cell invalid if editing has been canceled when columns is a function', (done) => {
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

    setDataAtCell(0, 0, 'foo');

    setTimeout(() => {
      expect(getCellMeta(0, 0).valid).toBe(false);

      selectCell(0, 0);
      keyDownUp('enter'); // open editor
      keyDownUp('escape'); // cancel editing

      expect(getCellMeta(0, 0).valid).toBe(false);
      done();
    }, 200);
  });

  it('should open an appropriate editor after cell value is valid again', (done) => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    const hot = handsontable({
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

    selectCell(0, 0);

    let activeEditor = hot.getActiveEditor();

    expect(activeEditor.row).toEqual(0);
    expect(activeEditor.col).toEqual(0);

    keyDownUp('enter'); // open editor
    activeEditor.setValue('foo');
    keyDownUp('enter'); // save changes, close editor

    setTimeout(() => {
      onAfterValidate.calls.reset();
      activeEditor = hot.getActiveEditor();

      expect(activeEditor.isOpened()).toBe(true); // value is invalid, so editor stays opened
      expect(activeEditor.row).toEqual(0);
      expect(activeEditor.col).toEqual(0);

      activeEditor.setValue(2);

      keyDownUp('enter'); // save changes and move to cell below (row: 1, col: ś0)
    }, 200);

    setTimeout(() => {
      keyDownUp('enter'); // open editor

      activeEditor = hot.getActiveEditor();
      expect(activeEditor.row).toEqual(1);
      expect(activeEditor.col).toEqual(0);
      done();
    }, 400);
  });

  it('should open an appropriate editor after cell value is valid again when columns is a function', (done) => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    const hot = handsontable({
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

    selectCell(0, 0);

    let activeEditor = hot.getActiveEditor();

    expect(activeEditor.row).toEqual(0);
    expect(activeEditor.col).toEqual(0);

    keyDownUp('enter'); // open editor
    activeEditor.setValue('foo');
    keyDownUp('enter'); // save changes, close editor

    setTimeout(() => {
      onAfterValidate.calls.reset();
      activeEditor = hot.getActiveEditor();

      expect(activeEditor.isOpened()).toBe(true); // value is invalid, so editor stays opened
      expect(activeEditor.row).toEqual(0);
      expect(activeEditor.col).toEqual(0);

      activeEditor.setValue(2);

      keyDownUp('enter'); // save changes and move to cell below (row: 1, col: ś0)
    }, 200);

    setTimeout(() => {
      keyDownUp('enter'); // open editor

      activeEditor = hot.getActiveEditor();
      expect(activeEditor.row).toEqual(1);
      expect(activeEditor.col).toEqual(0);
      done();
    }, 400);
  });

  it('should call the validation callback only once, when using the validateCells method on a mixed set of data', (done) => {
    const onValidate = jasmine.createSpy('onValidate');
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    const hot = handsontable({
      data: [
        { id: 'sth', name: 'Steve' },
        { id: 'sth else', name: 'Bob' }
      ],
      columns: [
        {
          data: 'id',
          validator(value, cb) {
            cb(value === parseInt(value, 10));
          }
        },
        { data: 'name' }
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

  it('should call the validation callback only once, when using the validateRows method on a mixed set of data', (done) => {
    const onValidate = jasmine.createSpy('onValidate');
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    const hot = handsontable({
      data: [
        { id: 'sth', name: 'Steve' },
        { id: 'sth else', name: 'Bob' }
      ],
      columns: [
        {
          data: 'id',
          validator(value, cb) {
            cb(value === parseInt(value, 10));
          }
        },
        { data: 'name' }
      ],
      afterValidate: onAfterValidate
    });

    hot.validateRows([0, 1], onValidate);

    setTimeout(() => {
      expect(onValidate).toHaveBeenCalledWith(false);
      expect(onValidate.calls.count()).toEqual(1);
      done();
    }, 200);
  });

  it('should call the validation callback only once, when using the validateColumns method on a mixed set of data', (done) => {
    const onValidate = jasmine.createSpy('onValidate');
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    const hot = handsontable({
      data: [
        { id: 'sth', name: 'Steve' },
        { id: 'sth else', name: 'Bob' }
      ],
      columns: [
        {
          data: 'id',
          validator(value, cb) {
            cb(value === parseInt(value, 10));
          }
        },
        { data: 'name' }
      ],
      afterValidate: onAfterValidate
    });

    hot.validateColumns([0, 1], onValidate);

    setTimeout(() => {
      expect(onValidate).toHaveBeenCalledWith(false);
      expect(onValidate.calls.count()).toEqual(1);
      done();
    }, 200);
  });

  it('should call the validation callback only once, when using the validateCells method on a mixed set of data and when columns is a function', (done) => {
    const onValidate = jasmine.createSpy('onValidate');
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    const hot = handsontable({
      data: [
        { id: 'sth', name: 'Steve' },
        { id: 'sth else', name: 'Bob' }
      ],
      columns(column) {
        let colMeta = null;

        if (column === 0) {
          colMeta = {
            data: 'id',
            validator(value, cb) {
              cb(value === parseInt(value, 10));
            }
          };

        } else if (column === 1) {
          colMeta = { data: 'name' };
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

  it('should call the validation callback only once, when using the validateRows method on a mixed set of data and when columns is a function', (done) => {
    const onValidate = jasmine.createSpy('onValidate');
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    const hot = handsontable({
      data: [
        { id: 'sth', name: 'Steve' },
        { id: 'sth else', name: 'Bob' }
      ],
      columns(column) {
        let colMeta = null;

        if (column === 0) {
          colMeta = {
            data: 'id',
            validator(value, cb) {
              cb(value === parseInt(value, 10));
            }
          };

        } else if (column === 1) {
          colMeta = { data: 'name' };
        }

        return colMeta;
      },
      afterValidate: onAfterValidate
    });

    hot.validateRows([0, 1], onValidate);

    setTimeout(() => {
      expect(onValidate).toHaveBeenCalledWith(false);
      expect(onValidate.calls.count()).toEqual(1);
      done();
    }, 200);
  });

  it('should call the validation callback only once, when using the validateColumns method on a mixed set of data and when columns is a function', (done) => {
    const onValidate = jasmine.createSpy('onValidate');
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    const hot = handsontable({
      data: [
        { id: 'sth', name: 'Steve' },
        { id: 'sth else', name: 'Bob' }
      ],
      columns(column) {
        let colMeta = null;

        if (column === 0) {
          colMeta = {
            data: 'id',
            validator(value, cb) {
              cb(value === parseInt(value, 10));
            }
          };

        } else if (column === 1) {
          colMeta = { data: 'name' };
        }

        return colMeta;
      },
      afterValidate: onAfterValidate
    });

    hot.validateColumns([0, 1], onValidate);

    setTimeout(() => {
      expect(onValidate).toHaveBeenCalledWith(false);
      expect(onValidate.calls.count()).toEqual(1);
      done();
    }, 200);
  });

  it('should call the callback in the `done` function using the renderable indexes (passing them to the renderer)', async() => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(1, 4),
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

    spyOn(hot.view._wt.wtSettings.settings, 'cellRenderer');

    hot.validateCells();

    await sleep(200);

    const mostRecentRendererCallArgs = hot.view._wt.wtSettings.settings.cellRenderer.calls.mostRecent().args;

    // The `date` column (the one that is being validated) should be described as the `1` (renderable) column.
    expect(mostRecentRendererCallArgs[1]).toEqual(1);
  });
});
