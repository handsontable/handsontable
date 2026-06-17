describe('dateValidator', () => {
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
      { date: '2015-01-01', name: 'Ted', lastName: 'Right' },
      { date: '2015-01-01', name: 'Frank', lastName: 'Honest' },
      { date: '2015-01-41', name: 'Joan', lastName: 'Well' },
      { date: '2015-51-01', name: 'Sid', lastName: 'Strong' }
    ];
  };

  it('should validate an empty string (default behavior)', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'date', type: 'date' },
        { data: 'name' },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });

    await setDataAtCell(0, 0, '');

    await waitForNextAnimationFrames(2);

    expect(onAfterValidate).toHaveBeenCalledWith(true, null, 0, 'date');
  });

  it('should not positively validate a non-date string', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'date', type: 'date' },
        { data: 'name' },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });

    await setDataAtCell(0, 0, 'wat');

    await waitForNextAnimationFrames(2);

    expect(onAfterValidate).toHaveBeenCalledWith(false, 'wat', 0, 'date');
  });

  it('should not positively validate a incorrect date string', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'date', type: 'date' },
        { data: 'name' },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });

    await setDataAtCell(0, 0, '2014-33-01');

    await waitForNextAnimationFrames(2);

    expect(onAfterValidate).toHaveBeenCalledWith(false, '2014-33-01', 0, 'date');
  });

  it('should not positively validate a date string in wrong format', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'date', type: 'date' },
        { data: 'name' },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });

    await setDataAtCell(1, 0, '01/01/15');

    await waitForNextAnimationFrames(2);

    expect(onAfterValidate).toHaveBeenCalledWith(false, '01/01/15', 1, 'date');
  });

  it('should not positively validate a date string in wrong format (if custom format is provided)', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'date', type: 'date' },
        { data: 'name' },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });

    await setDataAtCell(1, 0, '01/01/2015');

    await waitForNextAnimationFrames(2);

    expect(onAfterValidate).toHaveBeenCalledWith(false, '01/01/2015', 1, 'date');
  });

  it('should positively validate a date string in correct format', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'date', type: 'date' },
        { data: 'name' },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });

    await setDataAtCell(1, 0, '2015-01-01');

    await waitForNextAnimationFrames(2);

    expect(onAfterValidate).toHaveBeenCalledWith(true, '2015-01-01', 1, 'date');
  });

  it('should positively validate a valid ISO 8601 date string', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'date', type: 'date' },
        { data: 'name' },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });

    await setDataAtCell(0, 0, '2023-05-15');

    await waitForNextAnimationFrames(2);

    expect(onAfterValidate).toHaveBeenCalledWith(true, '2023-05-15', 0, 'date');
  });

  it('should not positively validate a non-date string and not close editor when `allowInvalid` is false', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'date', type: 'date', allowInvalid: false },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });

    await setDataAtCell(0, 0, 'not-a-date');
    await waitForNextAnimationFrames(2);

    expect(onAfterValidate).toHaveBeenCalledWith(false, 'not-a-date', 0, 'date');
    expect(getDataAtCell(0, 0)).toEqual('2015-01-01');
  });

  it('should not cause an infinite loop when a non-date value is pasted into a date cell with `allowInvalid: false` (#9246)', async() => {
    const afterChangeSpy = jasmine.createSpy('afterChange');
    const afterValidateSpy = jasmine.createSpy('afterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'date', type: 'date' },
        { data: 'name' }
      ],
      allowInvalid: false,
      afterChange: afterChangeSpy,
      afterValidate: afterValidateSpy
    });

    await setDataAtCell(0, 0, '50000');

    await waitForNextAnimationFrames(10);

    // afterChange should fire at most twice: once for the paste, once for the revert
    expect(afterChangeSpy.calls.count()).toBeLessThan(5);
    // The cell value should be reverted to the original valid date
    expect(getDataAtCell(0, 0)).toEqual('2015-01-01');
    // Validation should mark the numeric value as invalid
    expect(afterValidateSpy).toHaveBeenCalledWith(false, '50000', 0, 'date');
  });

  it('should populate all pasted values in the table when ISO dates are used', async() => {
    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'date', type: 'date' },
        { data: 'lastName' }
      ],
    });

    await setDataAtCell([
      [0, 0, '2018-02-02'],
      [1, 0, '2018-02-11'],
      [2, 0, '2017-02-10'],
      [3, 0, '2015-01-11'],
    ]);

    await waitForNextAnimationFrames(2);

    expect(countRows()).toBe(4);
    expect(getDataAtCell(0, 0)).toBe('2018-02-02');
    expect(getDataAtCell(1, 0)).toBe('2018-02-11');
    expect(getDataAtCell(2, 0)).toBe('2017-02-10');
    expect(getDataAtCell(3, 0)).toBe('2015-01-11');
  });

  describe('allowEmpty', () => {
    it('should not validate an empty string when allowEmpty is set as `false`', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'date', type: 'date', allowEmpty: false },
          { data: 'name' },
          { data: 'lastName' }
        ],
        afterValidate: onAfterValidate
      });

      await setDataAtCell(1, 0, '');

      await waitForNextAnimationFrames(2);

      expect(onAfterValidate).toHaveBeenCalledWith(false, null, 1, 'date');
    });

    it('should not validate `null` when allowEmpty is set as `false`', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'date', type: 'date', allowEmpty: false },
          { data: 'name' },
          { data: 'lastName' }
        ],
        afterValidate: onAfterValidate
      });

      await setDataAtCell(1, 0, null);

      await waitForNextAnimationFrames(2);

      expect(onAfterValidate).toHaveBeenCalledWith(false, null, 1, 'date');
    });

    it('should not validate `undefined` when allowEmpty is set as `false`', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'date', type: 'date', allowEmpty: false },
          { data: 'name' },
          { data: 'lastName' }
        ],
        afterValidate: onAfterValidate
      });

      await setDataAtCell(1, 0);

      await waitForNextAnimationFrames(2);

      expect(onAfterValidate).toHaveBeenCalledWith(false, undefined, 1, 'date');
    });
  });

  describe('intl-date alias', () => {
    it('should validate an empty string (default behavior)', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'date', type: 'intl-date' },
          { data: 'name' },
          { data: 'lastName' }
        ],
        afterValidate: onAfterValidate
      });

      await setDataAtCell(0, 0, '');

      await waitForNextAnimationFrames(2);

      expect(onAfterValidate).toHaveBeenCalledWith(true, null, 0, 'date');
    });

    it('should not positively validate a non-ISO date string', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'date', type: 'intl-date' },
          { data: 'name' },
          { data: 'lastName' }
        ],
        afterValidate: onAfterValidate
      });

      await setDataAtCell(0, 0, '01/01/2015');

      await waitForNextAnimationFrames(2);

      expect(onAfterValidate).toHaveBeenCalledWith(false, '01/01/2015', 0, 'date');
    });

    it('should positively validate a valid ISO date string', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'date', type: 'intl-date' },
          { data: 'name' },
          { data: 'lastName' }
        ],
        afterValidate: onAfterValidate
      });

      await setDataAtCell(1, 0, '2015-03-18');

      await waitForNextAnimationFrames(2);

      expect(onAfterValidate).toHaveBeenCalledWith(true, '2015-03-18', 1, 'date');
    });

    describe('allowEmpty', () => {
      it('should not validate an empty string when allowEmpty is set as `false`', async() => {
        const onAfterValidate = jasmine.createSpy('onAfterValidate');

        handsontable({
          data: arrayOfObjects(),
          columns: [
            { data: 'date', type: 'intl-date', allowEmpty: false },
            { data: 'name' },
            { data: 'lastName' }
          ],
          afterValidate: onAfterValidate
        });

        await setDataAtCell(1, 0, '');

        await waitForNextAnimationFrames(2);

        expect(onAfterValidate).toHaveBeenCalledWith(false, null, 1, 'date');
      });
    });
  });

  describe('ISO 8601 date validation', () => {
    using('data set', [
      { value: '2023-01-02', isValid: true },
      { value: '2023-01-01', isValid: true },
      { value: '2000-02-29', isValid: true }, // leap year
      { value: '1899-12-30', isValid: true },
    ], ({ value, isValid }) => {
      it('should validate positively', async() => {
        const onAfterValidateSpy = jasmine.createSpy('onAfterValidate');

        handsontable({
          data: [[]],
          columns: [
            { type: 'date' },
          ],
          afterValidate: onAfterValidateSpy
        });

        await setDataAtCell(0, 0, value);

        await waitForNextAnimationFrames(2);

        expect(onAfterValidateSpy).toHaveBeenCalledWith(isValid, value, 0, 0);
      });
    });

    using('data set', [
      { value: '01/02/2023' }, // DD/MM/YYYY — not ISO
      { value: '01/02/23' }, // DD/MM/YY — not ISO
      { value: '2023-13-01' }, // invalid month
      { value: '2023-00-01' }, // zero month
      { value: '2023-01-32' }, // invalid day
      { value: '2023-01' }, // incomplete
      { value: '20230101' }, // no separators
    ], ({ value }) => {
      it('should validate negatively', async() => {
        const onAfterValidateSpy = jasmine.createSpy('onAfterValidate');

        handsontable({
          data: [[]],
          columns: [
            { type: 'date' },
          ],
          afterValidate: onAfterValidateSpy
        });

        await setDataAtCell(0, 0, value);

        await waitForNextAnimationFrames(2);

        expect(onAfterValidateSpy).toHaveBeenCalledWith(false, value, 0, 0);
      });
    });
  });
});
