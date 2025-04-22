describe('timeValidator', () => {
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
      { time: '4:10:05 am', name: 'Ted', lastName: 'Right' },
      { time: '17:15:25', name: 'Frank', lastName: 'Honest' },
      { time: '14:65:45 am', name: 'Joan', lastName: 'Well' },
      { time: '33:25:05', name: 'Sid', lastName: 'Strong' }
    ];
  };

  it('should validate an empty string (default behavior)', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'time', type: 'time' },
        { data: 'name' },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });

    setDataAtCell(0, 0, '');

    await sleep(100);

    expect(onAfterValidate).toHaveBeenCalledWith(true, '', 0, 'time');
  });

  it('should not positively validate a non-date format', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'time', type: 'time' },
        { data: 'name' },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });

    setDataAtCell(0, 0, 'nd');

    await sleep(100);

    expect(onAfterValidate).toHaveBeenCalledWith(false, 'nd', 0, 'time');
  });

  it('should not positively validate a incorrect time string', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'time', type: 'time' },
        { data: 'name' },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });

    setDataAtCell(0, 0, '30:10:25');

    await sleep(100);

    expect(onAfterValidate).toHaveBeenCalledWith(false, '30:10:25', 0, 'time');
  });

  it('should not positively validate a time string in not default format', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'time', type: 'time' },
        { data: 'name' },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });

    setDataAtCell(1, 0, '20:20:01');

    await sleep(100);

    expect(onAfterValidate).toHaveBeenCalledWith(false, '20:20:01', 1, 'time');
  });

  it('should not positively validate a time string in wrong format (if custom format is provided)', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'time', type: 'time', timeFormat: 'HH:mm:ss' },
        { data: 'name' },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });

    setDataAtCell(1, 0, '5:10:15 am');

    await sleep(100);

    expect(onAfterValidate).toHaveBeenCalledWith(false, '5:10:15 am', 1, 'time');
  });

  it('should positively validate a date string in correct format (if custom format is provided)', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'time', type: 'time', timeFormat: 'HH:mm:ss' },
        { data: 'name' },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });

    setDataAtCell(1, 0, '16:32:03');

    await sleep(100);

    expect(onAfterValidate).toHaveBeenCalledWith(true, '16:32:03', 1, 'time');
  });

  describe('allowEmpty', () => {
    it('should not validate an empty string when allowEmpty is set as `false`', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'time', type: 'time', timeFormat: 'HH:mm', allowEmpty: false },
          { data: 'name' },
          { data: 'lastName' }
        ],
        afterValidate: onAfterValidate
      });

      setDataAtCell(1, 0, '');

      await sleep(100);

      expect(onAfterValidate).toHaveBeenCalledWith(false, '', 1, 'time');
    });

    it('should not validate `null` when allowEmpty is set as `false`', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'time', type: 'time', timeFormat: 'HH:mm', allowEmpty: false },
          { data: 'name' },
          { data: 'lastName' }
        ],
        afterValidate: onAfterValidate
      });

      setDataAtCell(1, 0, null);

      await sleep(100);

      expect(onAfterValidate).toHaveBeenCalledWith(false, null, 1, 'time');
    });

    it('should not validate `undefined` when allowEmpty is set as `false`', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'time', type: 'time', timeFormat: 'HH:mm', allowEmpty: false },
          { data: 'name' },
          { data: 'lastName' }
        ],
        afterValidate: onAfterValidate
      });

      setDataAtCell(1, 0);

      await sleep(100);

      expect(onAfterValidate).toHaveBeenCalledWith(false, undefined, 1, 'time');
    });
  });

  describe('correctFormat', () => {
    it('should not make any changes to entered string if correctFormat is not set', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'time', type: 'time', timeFormat: 'h:mm:ss a' },
          { data: 'name' },
          { data: 'lastName' }
        ],
        afterValidate: onAfterValidate
      });

      setDataAtCell(1, 0, '13:00:00');

      await sleep(100);

      expect(onAfterValidate).toHaveBeenCalledWith(false, '13:00:00', 1, 'time');
    });

    it('should not make any changes to entered string if correctFormat is set to false', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'time', type: 'time', timeFormat: 'h:mm:ss a', correctFormat: false },
          { data: 'name' },
          { data: 'lastName' }
        ],
        afterValidate: onAfterValidate
      });

      setDataAtCell(1, 0, '13:00:00');

      await sleep(100);

      expect(onAfterValidate).toHaveBeenCalledWith(false, '13:00:00', 1, 'time');
    });

    it('should rewrite the string to the correct format if a time-string in different format is provided', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'time', type: 'time', timeFormat: 'h:mm:ss a', correctFormat: true },
          { data: 'lastName' }
        ],
        afterValidate: onAfterValidate
      });

      setDataAtCell(1, 0, '16:35:01');

      await sleep(100);

      expect(onAfterValidate).toHaveBeenCalledWith(true, '16:35:01', 1, 'time');

      await sleep(30);

      expect(getDataAtCell(1, 0)).toEqual('4:35:01 pm');
    });

    it('should rewrite the string to the correct format if a time in micro-timestamp format is provided', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'time', type: 'time', timeFormat: 'HH:mm:ss', correctFormat: true },
          { data: 'lastName' }
        ],
        afterValidate: onAfterValidate
      });

      const currentDateTime = new Date();

      setDataAtCell(1, 0, currentDateTime.getTime()); // timestamp in milliseconds

      await sleep(100);

      expect(onAfterValidate).toHaveBeenCalledWith(true, currentDateTime.getTime(), 1, 'time');

      await sleep(30);

      const addLeadingZero = function(number) {
        return number.toString().padStart(2, '0');
      };

      expect(getDataAtCell(1, 0))
        .toEqual(`${addLeadingZero(currentDateTime.getHours())}:${addLeadingZero(currentDateTime.getMinutes())}:${
          addLeadingZero(currentDateTime.getSeconds())}`);
    });

    it('should rewrite the string to the correct format if a time in ISO8601 format is provided', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'time', type: 'time', timeFormat: 'HH:mm:ss', correctFormat: true },
          { data: 'lastName' }
        ],
        afterValidate: onAfterValidate
      });

      const currentDateTime = new Date();

      setDataAtCell(1, 0, currentDateTime.toISOString()); // ISO-formatted datetime, sth like '2016-02-19T12:40:04.983Z'

      await sleep(100);

      expect(onAfterValidate)
        .toHaveBeenCalledWith(true, currentDateTime.toISOString(), 1, 'time');

      await sleep(30);

      const addLeadingZero = function(number) {
        return number.toString().padStart(2, '0');
      };

      expect(getDataAtCell(1, 0))
        .toEqual(`${addLeadingZero(currentDateTime.getHours())}:${addLeadingZero(currentDateTime.getMinutes())}:${
          addLeadingZero(currentDateTime.getSeconds())}`);
    });

    it('should rewrite one and two-digit number to the correct format at hours', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'time', type: 'time', timeFormat: 'hh:mm:ss a', correctFormat: true },
          { data: 'lastName' }
        ],
        afterValidate: onAfterValidate
      });

      setDataAtCell(1, 0, '19');

      await sleep(100);

      expect(onAfterValidate).toHaveBeenCalledWith(true, '19', 1, 'time');

      await sleep(30);

      expect(getDataAtCell(1, 0)).toEqual('07:00:00 pm');
    });

    it('should rewrite one and two-digit number to the correct format at minutes', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'time', type: 'time', timeFormat: 'mm:ss', correctFormat: true },
          { data: 'lastName' }
        ],
        afterValidate: onAfterValidate
      });

      setDataAtCell(1, 0, '57');
      await sleep(100);

      expect(onAfterValidate).toHaveBeenCalledWith(true, '57', 1, 'time');

      await sleep(100);

      expect(getDataAtCell(1, 0)).toEqual('57:00');
    });

    it('should not try to correct format of non-date strings', (done) => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'time', type: 'time', timeFormat: 'HH:mm:ss', correctFormat: true },
          { data: 'name' },
          { data: 'lastName' }
        ],
        afterValidate: onAfterValidate
      });

      setDataAtCell(1, 0, 'test non-time string');

      setTimeout(() => {
        expect(onAfterValidate).toHaveBeenCalledWith(false, 'test non-time string', 1, 'time');
        done();
      }, 100);
    });

    it('should populate all pasted values in the table when `correctFormat` is enabled (#dev-793)', async() => {
      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'time', type: 'time', timeFormat: 'HH:mm:ss', correctFormat: true },
          { data: 'lastName' }
        ],
      });

      setDataAtCell([
        [2, 0, '1:30:22'],
        [3, 0, '2:33:10'],
        [4, 0, '03:1:22'],
        [5, 0, '22:22:22'],
      ]);

      await sleep(100);

      expect(countRows()).toBe(6);
    });
  });

  describe('Time formats', () => {
    describe('with `correctFormat` disabled', () => {
      using('data set', [
        { value: '23:15', timeFormat: 'HH:mm', isValid: true },
        { value: '11:15 AM', timeFormat: 'hh:mm A', isValid: true },
        { value: '11:15 am', timeFormat: 'hh:mm a', isValid: true },
        { value: '23:15:22:33', timeFormat: 'HH:mm:mm:ss', isValid: true },
        { value: '1:2:3:4', timeFormat: 'H:m:m:s', isValid: true },
        { value: '23:15:22:33 +02:00', timeFormat: 'HH:mm:mm:ss Z', isValid: true },
        { value: '23:15:22:33 +0200', timeFormat: 'HH:mm:mm:ss ZZ', isValid: true },

        // Improper format:
        { value: '01:02:03:04', timeFormat: 'H:m:m:s', isValid: false },
        { value: '23:15:22:33 +02:00', timeFormat: 'HH:mm:mm:ss ZZ', isValid: true },
      ], ({ value, timeFormat, isValid }) => {
        it('should validate positively', async() => {
          const onAfterValidateSpy = jasmine.createSpy('onAfterValidate');

          handsontable({
            data: [[]],
            columns: [
              { type: 'time', timeFormat },
            ],
            afterValidate: onAfterValidateSpy
          });

          setDataAtCell(0, 0, value);

          await sleep(50);

          expect(onAfterValidateSpy).toHaveBeenCalledWith(isValid, value, 0, 0);
        });
      });

      using('data set', [
        { value: '23:65', timeFormat: 'HH:mm' },
        { value: '23:155', timeFormat: 'HH:mm' },
        { value: '23:15 PM', timeFormat: 'hh:mm A' },
        { value: '23:15 pm', timeFormat: 'hh:mm a' },
        { value: '23:15:22:33 +2:00', timeFormat: 'HH:mm:mm:ss Z' },
      ], ({ value, timeFormat }) => {
        it('should validate negatively', async() => {
          const onAfterValidateSpy = jasmine.createSpy('onAfterValidate');

          handsontable({
            data: [[]],
            columns: [
              { type: 'time', timeFormat },
            ],
            afterValidate: onAfterValidateSpy
          });

          setDataAtCell(0, 0, value);

          await sleep(50);

          expect(onAfterValidateSpy).toHaveBeenCalledWith(false, value, 0, 0);
        });
      });
    });

    describe('with `correctFormat` enabled', () => {
      using('data set', [
        { value: '23:15', timeFormat: 'HH:mm' },
        { value: '11:15 AM', timeFormat: 'hh:mm A' },
        { value: '11:15 am', timeFormat: 'hh:mm a' },
        { value: '23:15:22:33', timeFormat: 'HH:mm:mm:ss' },
        { value: '1:2:3:4', timeFormat: 'H:m:m:s' },
        { value: '23:15:22:33 +02:00', timeFormat: 'HH:mm:mm:ss Z' },
        { value: '23:15:22:33 +0200', timeFormat: 'HH:mm:mm:ss ZZ' },

        // Improper format:
        { value: '01:02:03:04', timeFormat: 'H:m:m:s' },
        { value: '23:15:22:33 +02:00', timeFormat: 'HH:mm:mm:ss ZZ' },
        { value: '23:155', timeFormat: 'HH:mm' },
        { value: '23:15 PM', timeFormat: 'hh:mm A' },
        { value: '23:15 pm', timeFormat: 'hh:mm a' },
        { value: '23:15:22:33 +2:00', timeFormat: 'HH:mm:mm:ss Z' },
      ], ({ value, timeFormat }) => {
        it('should validate positively', async() => {
          const onAfterValidateSpy = jasmine.createSpy('onAfterValidate');

          handsontable({
            data: [[]],
            columns: [
              { type: 'time', timeFormat, correctFormat: true },
            ],
            afterValidate: onAfterValidateSpy
          });

          setDataAtCell(0, 0, value);

          await sleep(50);

          expect(onAfterValidateSpy).toHaveBeenCalledWith(true, value, 0, 0);
        });
      });

      using('data set', [
        { value: '23:65', timeFormat: 'HH:mm' },
      ], ({ value, timeFormat }) => {
        it('should validate negatively', async() => {
          const onAfterValidateSpy = jasmine.createSpy('onAfterValidate');

          handsontable({
            data: [[]],
            columns: [
              { type: 'time', timeFormat, correctFormat: true },
            ],
            afterValidate: onAfterValidateSpy
          });

          setDataAtCell(0, 0, value);

          await sleep(50);

          expect(onAfterValidateSpy).toHaveBeenCalledWith(false, value, 0, 0);
        });
      });
    });
  });
});
