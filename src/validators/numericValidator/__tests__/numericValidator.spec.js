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

  it('should validate an empty string (default behavior)', (done) => {
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

    setDataAtCell(2, 0, '');

    setTimeout(() => {
      expect(onAfterValidate).toHaveBeenCalledWith(true, '', 2, 'id', undefined, undefined);
      done();
    }, 100);
  });

  it('should not validate non numeric string', (done) => {
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
      expect(onAfterValidate).toHaveBeenCalledWith(false, 'test', 2, 'id', undefined, undefined);
      done();
    }, 100);
  });

  it('should validate numeric string', (done) => {
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

    setDataAtCell(2, 0, '123');

    setTimeout(() => {
      expect(onAfterValidate).toHaveBeenCalledWith(true, 123, 2, 'id', undefined, undefined);
      done();
    }, 100);
  });

  it('should validate signed numeric string', (done) => {
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

    setDataAtCell(2, 0, '-123');

    setTimeout(() => {
      expect(onAfterValidate).toHaveBeenCalledWith(true, -123, 2, 'id', undefined, undefined);
      done();
    }, 100);
  });

  it('should validate large-number scientific notation', (done) => {
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

    setDataAtCell(2, 0, '1e+23');

    setTimeout(() => {
      expect(onAfterValidate).toHaveBeenCalledWith(true, 1e+23, 2, 'id', undefined, undefined);
      done();
    }, 100);
  });

  it('should validate small-number scientific notation', (done) => {
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

    setDataAtCell(2, 0, '1e-23');

    setTimeout(() => {
      expect(onAfterValidate).toHaveBeenCalledWith(true, 1e-23, 2, 'id', undefined, undefined);
      done();
    }, 100);
  });

  describe('allowEmpty', () => {
    it('should not validate an empty string when allowEmpty is set as `false`', (done) => {
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

      setDataAtCell(2, 0, '');

      setTimeout(() => {
        expect(onAfterValidate).toHaveBeenCalledWith(false, '', 2, 'id', undefined, undefined);
        done();
      }, 100);
    });

    it('should not validate `null` when allowEmpty is set as `false`', (done) => {
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

      setDataAtCell(2, 0, null);

      setTimeout(() => {
        expect(onAfterValidate).toHaveBeenCalledWith(false, null, 2, 'id', undefined, undefined);
        done();
      }, 100);
    });

    it('should not validate `undefined` when allowEmpty is set as `false`', (done) => {
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

      setDataAtCell(2, 0, void 0);

      setTimeout(() => {
        expect(onAfterValidate).toHaveBeenCalledWith(false, void 0, 2, 'id', undefined, undefined);
        done();
      }, 100);
    });

    it('should validate 0 when allowEmpty is set as `false`', (done) => {
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

      setDataAtCell(2, 0, 0);

      setTimeout(() => {
        expect(onAfterValidate).toHaveBeenCalledWith(true, 0, 2, 'id', undefined, undefined);
        done();
      }, 100);
    });

    it('should add / remove `htInvalid` class properly when validating non-numeric data', (done) => {
      const hot = handsontable({
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

      hot.validateCells();

      setTimeout(() => {
        expect($(getCell(1, 2)).hasClass(hot.getSettings().invalidCellClassName)).toBe(false);
        expect($(getCell(2, 2)).hasClass(hot.getSettings().invalidCellClassName)).toBe(true);

        setDataAtCell(2, 2, 8000);
      }, 200);

      setTimeout(() => {
        expect($(getCell(2, 2)).hasClass(hot.getSettings().invalidCellClassName)).toBe(false);
        done();
      }, 400);
    });
  });
});
