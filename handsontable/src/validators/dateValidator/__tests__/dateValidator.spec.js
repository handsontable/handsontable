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
      { date: '01/01/2015', name: 'Ted', lastName: 'Right' },
      { date: '01/01/15', name: 'Frank', lastName: 'Honest' },
      { date: '41/01/2015', name: 'Joan', lastName: 'Well' },
      { date: '01/51/2015', name: 'Sid', lastName: 'Strong' }
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

    expect(onAfterValidate).toHaveBeenCalledWith(true, '', 0, 'date');
  });

  it('should rewrite an ISO 8601 string to the correct format if a date-string in different format is provided', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'date', type: 'date', dateFormat: 'MM/DD/YYYY', correctFormat: true },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });

    await setDataAtCell(1, 0, '2016-03-18');
    await waitForNextAnimationFrames(2);

    expect(onAfterValidate).toHaveBeenCalledWith(true, '2016-03-18', 1, 'date');
    expect(getDataAtCell(1, 0)).toEqual('03/18/2016');
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

  it('should not positively validate a non-date string and rewrite to the correct format when `allowInvalid` is false', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'date', type: 'date', dateFormat: 'MM/DD/YYYY', correctFormat: true, allowInvalid: false },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });

    await setDataAtCell(0, 0, '01/01/2015 ops');
    await waitForNextAnimationFrames(2);

    expect(onAfterValidate).toHaveBeenCalledWith(false, '01/01/2015 ops', 0, 'date');
    expect(getDataAtCell(0, 0)).toEqual('01/01/2015');
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

    await setDataAtCell(0, 0, '33/01/2014');

    await waitForNextAnimationFrames(2);

    expect(onAfterValidate).toHaveBeenCalledWith(false, '33/01/2014', 0, 'date');
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
        { data: 'date', type: 'date', dateFormat: 'DD/MM/YY' },
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

    await setDataAtCell(1, 0, '01/01/2015');

    await waitForNextAnimationFrames(2);

    expect(onAfterValidate).toHaveBeenCalledWith(true, '01/01/2015', 1, 'date');
  });

  it('should positively validate a date string in correct format (if custom format is provided)', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'date', type: 'date', dateFormat: 'DD/MM/YY' },
        { data: 'name' },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });

    await setDataAtCell(1, 0, '23/03/15');

    await waitForNextAnimationFrames(2);

    expect(onAfterValidate).toHaveBeenCalledWith(true, '23/03/15', 1, 'date');
  });

  describe('allowEmpty', () => {
    it('should not validate an empty string when allowEmpty is set as `false`', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'date', type: 'date', dateFormat: 'DD/MM/YY', allowEmpty: false },
          { data: 'name' },
          { data: 'lastName' }
        ],
        afterValidate: onAfterValidate
      });

      await setDataAtCell(1, 0, '');

      await waitForNextAnimationFrames(2);

      expect(onAfterValidate).toHaveBeenCalledWith(false, '', 1, 'date');
    });

    it('should not validate `null` when allowEmpty is set as `false`', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'date', type: 'date', dateFormat: 'DD/MM/YY', allowEmpty: false },
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
          { data: 'date', type: 'date', dateFormat: 'DD/MM/YY', allowEmpty: false },
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

  describe('correctFormat', () => {
    it('should not make any changes to entered string if correctFormat is not set', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'date', type: 'date', dateFormat: 'MM/DD/YY' },
          { data: 'name' },
          { data: 'lastName' }
        ],
        afterValidate: onAfterValidate
      });

      await setDataAtCell(1, 0, '11/23/2013');

      await waitForNextAnimationFrames(2);

      expect(onAfterValidate).toHaveBeenCalledWith(false, '11/23/2013', 1, 'date');
    });

    it('should not make any changes to entered string if correctFormat is set to false', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'date', type: 'date', dateFormat: 'MM/DD/YY', correctFormat: false },
          { data: 'name' },
          { data: 'lastName' }
        ],
        afterValidate: onAfterValidate
      });

      await setDataAtCell(1, 0, '11/23/2013');

      await waitForNextAnimationFrames(2);

      expect(onAfterValidate).toHaveBeenCalledWith(false, '11/23/2013', 1, 'date');
    });

    it('should rewrite the string to the correct format if a date-string in different format is provided', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'date', type: 'date', dateFormat: 'MM/DD/YYYY', correctFormat: true },
          { data: 'lastName' }
        ],
        afterValidate: onAfterValidate
      });

      await setDataAtCell(1, 0, '1/10/15');

      await waitForNextAnimationFrames(2);

      expect(onAfterValidate).toHaveBeenCalledWith(true, '1/10/15', 1, 'date');

      await waitForNextAnimationFrames(2);

      expect(getDataAtCell(1, 0)).toEqual('01/10/2015');
    });

    it('should rewrite the string to the correct format if a date-string in different format is provided (for non-default format)', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'date', type: 'date', dateFormat: 'DD.MM.YYYY', correctFormat: true },
          { data: 'lastName' }
        ],
        afterValidate: onAfterValidate
      });

      await setDataAtCell(1, 0, '5.3.2016');

      await waitForNextAnimationFrames(2);

      expect(onAfterValidate).toHaveBeenCalledWith(true, '5.3.2016', 1, 'date');

      await waitForNextAnimationFrames(2);

      expect(getDataAtCell(1, 0)).toEqual('05.03.2016');
    });

    it('should not try to correct format of non-date strings', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'date', type: 'date', dateFormat: 'DD/MM/YY', correctFormat: true },
          { data: 'name' },
          { data: 'lastName' }
        ],
        afterValidate: onAfterValidate
      });

      await setDataAtCell(1, 0, 'test non-date string');

      await waitForNextAnimationFrames(2);

      expect(onAfterValidate).toHaveBeenCalledWith(false, 'test non-date string', 1, 'date');
    });

    it('should not cause an infinite loop when a numeric value is pasted into a date cell with `allowInvalid: false` (#9246)', async() => {
      const afterChangeSpy = jasmine.createSpy('afterChange');
      const afterValidateSpy = jasmine.createSpy('afterValidate');

      handsontable({
        data: [
          ['03-FEBRUARY-2022', 50000]
        ],
        columns: [
          { type: 'date', dateFormat: 'DD-MMMM-YYYY', correctFormat: true },
          {}
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
      expect(getDataAtCell(0, 0)).toEqual('03-FEBRUARY-2022');
      // Validation should mark the numeric value as invalid
      expect(afterValidateSpy).toHaveBeenCalledWith(false, '50000', 0, 0);
    });

    it('should mark a numeric value that cannot be auto-corrected to a valid date as invalid when `correctFormat` is enabled (#9246)', async() => {
      const afterValidateSpy = jasmine.createSpy('afterValidate');

      handsontable({
        data: [['01/01/2020']],
        columns: [
          { type: 'date', dateFormat: 'MM/DD/YYYY', correctFormat: true }
        ],
        afterValidate: afterValidateSpy
      });

      await setDataAtCell(0, 0, '50000');

      await waitForNextAnimationFrames(2);

      expect(afterValidateSpy).toHaveBeenCalledWith(false, '50000', 0, 0);
    });

    it('should populate all pasted values in the table when `correctFormat` is enabled (#dev-793)', async() => {
      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'date', type: 'date', dateFormat: 'MM/DD/YYYY', correctFormat: true },
          { data: 'lastName' }
        ],
      });

      await setDataAtCell([
        [2, 0, '2/2/2018'],
        [3, 0, '2/11/2018'],
        [4, 0, '2/10/2017'],
        [5, 0, '1/11/2015'],
      ]);

      await waitForNextAnimationFrames(2);

      expect(countRows()).toBe(6);
    });

    it('should preserve corrected date format when batch-setting data alongside cells with async validators (#10614)', async() => {
      handsontable({
        data: [
          ['Mercedes', '2017/1/14', '1'],
          ['Citroen', '2018/12/1', '1'],
          ['Audi', '2019/11/19', ''],
          ['Opel', '2020/2/2', ''],
          ['BMW', '2021/5/5', ''],
        ],
        columns: [
          {},
          {
            type: 'date',
            dateFormat: 'YYYY-MM-DD',
            correctFormat: true,
          },
          {
            type: 'autocomplete',
            allowInvalid: false,
            strict: true,
            source: (query, callback) => {
              setTimeout(() => {
                callback(['1', '2', '3']);
              }, 100);
            }
          },
        ],
      });

      await setDataAtCell([
        [0, 1, '2017/1/14'],
        [0, 2, '1'],
        [1, 1, '2018/12/1'],
        [1, 2, '1'],
        [2, 1, '2019/11/19'],
        [2, 2, ''],
        [3, 1, '2020/2/2'],
        [3, 2, ''],
        [4, 1, '2021/5/5'],
        [4, 2, ''],
      ]);

      await sleep(300);

      expect(getDataAtCell(0, 1)).toEqual('2017-01-14');
      expect(getDataAtCell(1, 1)).toEqual('2018-12-01');
      expect(getDataAtCell(2, 1)).toEqual('2019-11-19');
      expect(getDataAtCell(3, 1)).toEqual('2020-02-02');
      expect(getDataAtCell(4, 1)).toEqual('2021-05-05');
    });

  });

  describe('Date formats', () => {
    describe('with `correctFormat` disabled', () => {
      using('data set', [
        { value: '01/02/2023', dateFormat: 'DD/MM/YYYY', isValid: true },
        { value: '01/02/23', dateFormat: 'DD/MM/YY', isValid: true },
        { value: '1/2/23', dateFormat: 'D/M/YY', isValid: true },
        { value: '01/02/23', dateFormat: 'D/M/YY', isValid: false },
        { value: '01-02-2023', dateFormat: 'DD-MM-YYYY', isValid: true },
        { value: '1-2-23', dateFormat: 'D-M-YY', isValid: true },
        { value: '1-12-23', dateFormat: 'D-M-YY', isValid: true },
        { value: '1.2.23', dateFormat: 'D.M.YY', isValid: true },
        { value: '2023 February 2nd', dateFormat: 'YYYY MMMM Do', isValid: true },
        { value: 'Feb 2nd \'23', dateFormat: 'MMM Do \'YY', isValid: true },
        { value: 'The 2nd of February \'23', dateFormat: '[The] Do [of] MMMM \'YY', isValid: true },
        { value: 'Day: 2, Month: 2, Year: 2023', dateFormat: '[Day:] D, [Month:] M, [Year:] YYYY', isValid: true },
      ], ({ value, dateFormat, isValid }) => {
        it('should validate positively', async() => {
          const onAfterValidateSpy = jasmine.createSpy('onAfterValidate');

          handsontable({
            data: [[]],
            columns: [
              { type: 'date', dateFormat },
            ],
            afterValidate: onAfterValidateSpy
          });

          await setDataAtCell(0, 0, value);

          await waitForNextAnimationFrames(2);

          expect(onAfterValidateSpy).toHaveBeenCalledWith(isValid, value, 0, 0);
        });
      });

      using('data set', [
        { value: '01/02/23', dateFormat: 'DD/MM/YYYY' },
        { value: '1/2/23', dateFormat: 'DD/MM/YY' },
        { value: '01/02/2023', dateFormat: 'D/M/YY' },
        { value: '1-2-23', dateFormat: 'DD-MM-YYYY' },
        { value: '01/02/2023', dateFormat: 'DD-MM-YYYY' },
        { value: '01-02-2023', dateFormat: 'DD.MM.YYYY' },
        { value: '1-2-2023', dateFormat: 'D-M-YY' },
        { value: '1.2.2023', dateFormat: 'D.M.YY' },
        { value: '23 February 2nd', dateFormat: 'YYYY MMMM Do' },
        { value: 'Feb 2nd \'2023', dateFormat: 'MMM Do \'YY' },
        { value: 'The 2nd of February 2023', dateFormat: '[The] Do [of] MMMM \'YY' },
        { value: 'Day: 2, Month: 2, Year: 23', dateFormat: '[Day:] D, [Month:] M, [Year:] YYYY' },
        { value: 'Day: 2, Month: 2, Year: 2023', dateFormat: '[Day:] D, [Month:] M, [Year:] YY' },
      ], ({ value, dateFormat }) => {
        it('should validate negatively', async() => {
          const onAfterValidateSpy = jasmine.createSpy('onAfterValidate');

          handsontable({
            data: [[]],
            columns: [
              { type: 'date', dateFormat },
            ],
            afterValidate: onAfterValidateSpy
          });

          await setDataAtCell(0, 0, value);

          await waitForNextAnimationFrames(2);

          expect(onAfterValidateSpy).toHaveBeenCalledWith(false, value, 0, 0);
        });
      });
    });

    describe('with `correctFormat` enabled', () => {
      using('data set', [
        { value: '01/02/2023', dateFormat: 'DD/MM/YYYY' },
        { value: '01/02/23', dateFormat: 'DD/MM/YY' },
        { value: '1/2/23', dateFormat: 'D/M/YY' },
        { value: '01/02/23', dateFormat: 'D/M/YY' }, // ?
        { value: '01-02-2023', dateFormat: 'DD-MM-YYYY' },
        { value: '1-2-23', dateFormat: 'D-M-YY' },
        { value: '1-12-23', dateFormat: 'D-M-YY' },
        { value: '1.2.23', dateFormat: 'D.M.YY' },
        { value: '2023 February 2nd', dateFormat: 'YYYY MMMM Do' },
        { value: 'Feb 2nd \'23', dateFormat: 'MMM Do \'YY' },
        { value: 'The 2nd of February \'23', dateFormat: '[The] Do [of] MMMM \'YY' },
        { value: 'Day: 2, Month: 2, Year: 2023', dateFormat: '[Day:] D, [Month:] M, [Year:] YYYY' },
        { value: '01/02/23', dateFormat: 'DD/MM/YYYY' },
        { value: '1/2/23', dateFormat: 'DD/MM/YY' },
        { value: '01/02/2023', dateFormat: 'D/M/YY' },
        { value: '1-2-23', dateFormat: 'DD-MM-YYYY' },
        { value: '01/02/2023', dateFormat: 'DD-MM-YYYY' },
        { value: '01-02-2023', dateFormat: 'DD.MM.YYYY' },
        { value: '1-2-2023', dateFormat: 'D-M-YY' },
        { value: '1.2.2023', dateFormat: 'D.M.YY' },
      ], ({ value, dateFormat }) => {
        it('should validate positively', async() => {
          const onAfterValidateSpy = jasmine.createSpy('onAfterValidate');

          handsontable({
            data: [[]],
            columns: [
              { type: 'date', dateFormat, correctFormat: true },
            ],
            afterValidate: onAfterValidateSpy
          });

          await setDataAtCell(0, 0, value);

          await waitForNextAnimationFrames(2);

          expect(onAfterValidateSpy).toHaveBeenCalledWith(true, value, 0, 0);
        });
      });

      using('data set', [
        { value: '23 February 2nd', dateFormat: 'YYYY MMMM Do' },
        { value: 'Feb 2nd \'2023', dateFormat: 'MMM Do \'YY' },
        { value: 'The 2nd of February 2023', dateFormat: '[The] Do [of] MMMM \'YY' },
        { value: 'Day: 2, Month: 2, Year: 23', dateFormat: '[Day:] D, [Month:] M, [Year:] YYYY' },
        { value: 'Day: 2, Month: 2, Year: 2023', dateFormat: '[Day:] D, [Month:] M, [Year:] YY' },
      ], ({ value, dateFormat }) => {
        it('should validate negatively', async() => {
          const onAfterValidateSpy = jasmine.createSpy('onAfterValidate');

          handsontable({
            data: [[]],
            columns: [
              { type: 'date', dateFormat, correctFormat: true },
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
});
