describe('Core.validateCells', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    this.$container.data('handsontable')?.destroy();
    this.$container.remove();
  });

  it('should not throw error after calling validateCells without first argument', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: createSpreadsheetData(2, 2),
      validator(value, callb) {
        if (value === 'B1') {
          callb(false);
        } else {
          callb(true);
        }
      },
      afterValidate: onAfterValidate
    });

    expect(() => {
      // eslint-disable-next-line handsontable/require-await
      validateCells();
    }).not.toThrow();

    await waitForNextAnimationFrames(2); // wait for async validation

    expect(spec().$container.find('td.htInvalid').length).toEqual(1);
    expect(spec().$container.find('td:not(.htInvalid)').length).toEqual(3);
  });

  it('should throw error after calling validateRows first argument not array', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: createSpreadsheetData(2, 2),
      validator(value, callb) {
        callb(true);
      },
      afterValidate: onAfterValidate
    });

    expect(() => {
      // eslint-disable-next-line handsontable/require-await
      validateRows();
    }).toThrow();
    expect(() => {
      // eslint-disable-next-line handsontable/require-await
      validateRows(0, () => {});
    }).toThrow();
    expect(() => {
      // eslint-disable-next-line handsontable/require-await
      validateRows({}, () => {});
    }).toThrow();
    expect(() => {
      // eslint-disable-next-line handsontable/require-await
      validateRows(() => {});
    }).toThrow();
  });

  it('should call callback with first argument as `true` if all cells are valid', async() => {
    const onValidate = jasmine.createSpy('onValidate');
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: createSpreadsheetData(2, 2),
      validator(value, callback) {
        callback(true);
      },
      afterValidate: onAfterValidate
    });

    await validateCells(onValidate);

    await waitForNextAnimationFrames(2); // wait for async validation

    expect(onValidate).toHaveBeenCalledWith(true);
  });

  it('should call callback with first argument as `false` if one of cells is invalid', async() => {
    const onValidate = jasmine.createSpy('onValidate');
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: createSpreadsheetData(2, 2),
      validator(value, callback) {
        callback(false);
      },
      afterValidate: onAfterValidate
    });

    await validateCells(onValidate);

    await waitForNextAnimationFrames(2); // wait for async validation

    expect(onValidate).toHaveBeenCalledWith(false);
  });

  it('should add class name `htInvalid` to an cell that does not validate - on validateCells', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: createSpreadsheetData(2, 2),
      validator(value, callb) {
        if (value === 'B1') {
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

    await waitForNextAnimationFrames(2); // wait for async validation

    expect(spec().$container.find('td.htInvalid').length).toEqual(1);
    expect(spec().$container.find('td:not(.htInvalid)').length).toEqual(3);
  });

  it('should call the validation callback only once, when using the validateCells method on a mixed set of data', async() => {
    const onValidate = jasmine.createSpy('onValidate');
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
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

    // eslint-disable-next-line handsontable/require-await
    await promisfy(resolve => validateCells((...args) => {
      onValidate(...args);
      resolve();
    }));

    expect(onValidate).toHaveBeenCalledWith(false);
    expect(onValidate.calls.count()).toEqual(1);
  });

  it('should call the validation callback only once, when using the validateCells method on a mixed set of data and when columns is a function', async() => {
    const onValidate = jasmine.createSpy('onValidate');
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
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

    // eslint-disable-next-line handsontable/require-await
    await promisfy(resolve => validateCells((...args) => {
      onValidate(...args);
      resolve();
    }));

    expect(onValidate).toHaveBeenCalledWith(false);
    expect(onValidate.calls.count()).toEqual(1);
  });

  it('should not permanently retain a cell meta object for every validated cell', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(200, 10),
      width: 400,
      height: 200,
      validator(value, callb) {
        callb(true);
      },
    });

    const retainedBefore = hot.getCellsMeta().length;

    // eslint-disable-next-line handsontable/require-await
    await promisfy(resolve => validateCells(() => resolve()));

    // an all-valid bulk validation retains nothing new (2,000 cells validated)
    expect(hot.getCellsMeta().length).toBe(retainedBefore);
  });

  it('should keep the invalid state of an off-viewport cell and show it after scrolling into view', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(200, 5),
      width: 400,
      height: 200,
      validator(value, callb) {
        callb(value !== 'A150'); // row 150 sits far below the initial viewport
      },
    });

    // eslint-disable-next-line handsontable/require-await
    await promisfy(resolve => validateCells(() => resolve()));

    expect(hot.getCellMeta(149, 0).valid).toBe(false);

    await scrollViewportTo({ row: 149, col: 0 });
    await waitForNextAnimationFrames(2);

    expect(spec().$container.find('td.htInvalid').length).toEqual(1);
  });

  it('should resolve the validator through the `cells` function when validating in bulk', async() => {
    const onValidate = jasmine.createSpy('onValidate');

    handsontable({
      data: createSpreadsheetData(5, 2),
      cells(row, column) {
        if (column === 0) {
          return {
            validator(value, cb) {
              cb(false);
            },
          };
        }

        return null;
      },
    });

    // eslint-disable-next-line handsontable/require-await
    await promisfy(resolve => validateCells((...args) => {
      onValidate(...args);
      resolve();
    }));

    expect(onValidate).toHaveBeenCalledWith(false);
  });
});
