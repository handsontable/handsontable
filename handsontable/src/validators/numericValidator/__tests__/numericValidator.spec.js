describe('numericValidator', () => {
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

  it('should validate an empty string (default behavior)', async() => {
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

    await setDataAtCell(2, 0, '');
    await sleep(100);

    expect(onAfterValidate).toHaveBeenCalledWith(true, '', 2, 'id');
  });

  it('should not validate non numeric string', async() => {
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

    await setDataAtCell(2, 0, 'test');
    await sleep(100);

    expect(onAfterValidate).toHaveBeenCalledWith(false, 'test', 2, 'id');
  });

  it('should validate numeric string', async() => {
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

    await setDataAtCell(2, 0, '123');
    await sleep(100);

    expect(onAfterValidate).toHaveBeenCalledWith(true, 123, 2, 'id');
  });

  it('should validate signed numeric string', async() => {
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

    await setDataAtCell(2, 0, '-123');
    await sleep(100);

    expect(onAfterValidate).toHaveBeenCalledWith(true, -123, 2, 'id');
  });

  it('should validate large-number scientific notation', async() => {
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

    await setDataAtCell(2, 0, '1e+23');
    await sleep(100);

    expect(onAfterValidate).toHaveBeenCalledWith(true, 1e+23, 2, 'id');
  });

  it('should validate small-number scientific notation', async() => {
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

    await setDataAtCell(2, 0, '1e-23');
    await sleep(100);

    expect(onAfterValidate).toHaveBeenCalledWith(true, 1e-23, 2, 'id');
  });

  describe('allowEmpty', () => {
    it('should not validate an empty string when allowEmpty is set as `false`', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'id', type: 'numeric', allowEmpty: false },
          { data: 'name' },
          { data: 'lastName' }
        ],
        afterValidate: onAfterValidate
      });

      await setDataAtCell(2, 0, '');
      await sleep(100);

      expect(onAfterValidate).toHaveBeenCalledWith(false, '', 2, 'id');
    });

    it('should not validate `null` when allowEmpty is set as `false`', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'id', type: 'numeric', allowEmpty: false },
          { data: 'name' },
          { data: 'lastName' }
        ],
        afterValidate: onAfterValidate
      });

      await setDataAtCell(2, 0, null);
      await sleep(100);

      expect(onAfterValidate).toHaveBeenCalledWith(false, null, 2, 'id');
    });

    it('should not validate `undefined` when allowEmpty is set as `false`', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'id', type: 'numeric', allowEmpty: false },
          { data: 'name' },
          { data: 'lastName' }
        ],
        afterValidate: onAfterValidate
      });

      await setDataAtCell(2, 0);
      await sleep(100);

      expect(onAfterValidate).toHaveBeenCalledWith(false, undefined, 2, 'id');
    });

    it('should validate 0 when allowEmpty is set as `false`', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'id', type: 'numeric', allowEmpty: false },
          { data: 'name' },
          { data: 'lastName' }
        ],
        afterValidate: onAfterValidate
      });

      await setDataAtCell(2, 0, 0);
      await sleep(100);

      expect(onAfterValidate).toHaveBeenCalledWith(true, 0, 2, 'id');
    });

    it('should add / remove `htInvalid` class properly when validating non-numeric data', async() => {
      handsontable({
        data: [
          { id: 1, name: 'Ted', salary: 10000 },
          { id: 2, name: 'Frank', salary: '5300' },
          { id: 3, name: 'Joan', salary: 'non-numeric value' }
        ],
        columns: [
          { data: 'id' },
          { data: 'name' },
          { data: 'salary', type: 'numeric', allowInvalid: false }
        ]
      });

      await validateCells();
      await sleep(200);

      expect($(getCell(1, 2)).hasClass(getSettings().invalidCellClassName)).toBe(false);
      expect($(getCell(2, 2)).hasClass(getSettings().invalidCellClassName)).toBe(true);

      await setDataAtCell(2, 2, 8000);
      await sleep(200);

      expect($(getCell(2, 2)).hasClass(getSettings().invalidCellClassName)).toBe(false);
    });
  });
});
