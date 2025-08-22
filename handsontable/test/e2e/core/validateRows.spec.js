describe('Core.validateColumns', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    this.$container.data('handsontable')?.destroy();
    this.$container.remove();
  });

  it('should call callback with first argument as `true` if all cells are valid - on validateRows', async() => {
    const onValidate = jasmine.createSpy('onValidate');
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: createSpreadsheetData(2, 2),
      validator(value, callback) {
        callback(true);
      },
      afterValidate: onAfterValidate
    });

    await validateRows([0, 1], onValidate);

    await sleep(100); // wait for async validation

    expect(onValidate).toHaveBeenCalledWith(true);
  });

  it('should call callback with first argument as `false` if one of cells is invalid - on validateRows', async() => {
    const onValidate = jasmine.createSpy('onValidate');
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: createSpreadsheetData(2, 2),
      validator(value, callback) {
        callback(false);
      },
      afterValidate: onAfterValidate
    });

    await validateRows([0, 1], onValidate);

    await sleep(100); // wait for async validation

    expect(onValidate).toHaveBeenCalledWith(false);
  });

  it('should not throw error after calling validateRows without second argument', async() => {
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
      validateRows([]);
    }).not.toThrow();
    expect(() => {
      // eslint-disable-next-line handsontable/require-await
      validateRows([0, 1]);
    }).not.toThrow();
    expect(() => {
      // eslint-disable-next-line handsontable/require-await
      validateRows([100, 101]);
    }).not.toThrow();
  });

  it('should add class name `htInvalid` to an cell that does not validate - on validateRows', async() => {
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

    await validateRows([], () => {
      // eslint-disable-next-line handsontable/require-await
      render();
    });

    await sleep(150);

    expect(spec().$container.find('td.htInvalid').length).toEqual(0);
    expect(spec().$container.find('td:not(.htInvalid)').length).toEqual(4);

    await loadData(createSpreadsheetData(2, 2));

    await validateRows([0], () => {
      // eslint-disable-next-line handsontable/require-await
      render();
    });

    await sleep(150);

    expect(spec().$container.find('td.htInvalid').length).toEqual(1);
    expect(spec().$container.find('td:not(.htInvalid)').length).toEqual(3);

    await loadData(createSpreadsheetData(2, 2));

    await validateRows([1], () => {
      // eslint-disable-next-line handsontable/require-await
      render();
    });

    await sleep(150);

    expect(spec().$container.find('td.htInvalid').length).toEqual(0);
    expect(spec().$container.find('td:not(.htInvalid)').length).toEqual(4);

    await loadData(createSpreadsheetData(2, 2));

    await validateRows([0, 1], () => {
      // eslint-disable-next-line handsontable/require-await
      render();
    });

    await sleep(150);

    expect(spec().$container.find('td.htInvalid').length).toEqual(1);
    expect(spec().$container.find('td:not(.htInvalid)').length).toEqual(3);

    await loadData(createSpreadsheetData(2, 2));

    await validateRows([0, 1, 100], () => {
      // eslint-disable-next-line handsontable/require-await
      render();
    });

    await sleep(150);

    expect(spec().$container.find('td.htInvalid').length).toEqual(1);
    expect(spec().$container.find('td:not(.htInvalid)').length).toEqual(3);

    await loadData(createSpreadsheetData(2, 2));

    await validateRows([100, 101], () => {
      // eslint-disable-next-line handsontable/require-await
      render();
    });

    await sleep(150);

    expect(spec().$container.find('td.htInvalid').length).toEqual(0);
    expect(spec().$container.find('td:not(.htInvalid)').length).toEqual(4);
  });

  it('should call the validation callback only once, when using the validateRows method on a mixed set of data', async() => {
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
    await promisfy(resolve => validateRows([0, 1], (...args) => {
      onValidate(...args);
      resolve();
    }));

    expect(onValidate).toHaveBeenCalledWith(false);
    expect(onValidate.calls.count()).toEqual(1);
  });

  it('should call the validation callback only once, when using the validateRows method on a mixed set of data and when columns is a function', async() => {
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
    await promisfy(resolve => validateRows([0, 1], (...args) => {
      onValidate(...args);
      resolve();
    }));

    expect(onValidate).toHaveBeenCalledWith(false);
    expect(onValidate.calls.count()).toEqual(1);
  });
});
