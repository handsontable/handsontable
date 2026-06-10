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
      { time: '04:10:05', name: 'Ted', lastName: 'Right' },
      { time: '17:15:25', name: 'Frank', lastName: 'Honest' },
      { time: '14:05:45', name: 'Joan', lastName: 'Well' },
      { time: '09:25:05', name: 'Sid', lastName: 'Strong' }
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

    await setDataAtCell(0, 0, '');

    await waitForNextAnimationFrames(2);

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

    await setDataAtCell(0, 0, 'nd');

    await waitForNextAnimationFrames(2);

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

    await setDataAtCell(0, 0, '30:10:25');

    await waitForNextAnimationFrames(2);

    expect(onAfterValidate).toHaveBeenCalledWith(false, '30:10:25', 0, 'time');
  });

  it('should not positively validate a time string in 12-hour am/pm format', async() => {
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

    await setDataAtCell(1, 0, '5:10:15 am');

    await waitForNextAnimationFrames(2);

    expect(onAfterValidate).toHaveBeenCalledWith(false, '5:10:15 am', 1, 'time');
  });

  it('should positively validate a time string in 24-hour format', async() => {
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

    await setDataAtCell(1, 0, '16:32:03');

    await waitForNextAnimationFrames(2);

    expect(onAfterValidate).toHaveBeenCalledWith(true, '16:32:03', 1, 'time');
  });

  describe('allowEmpty', () => {
    it('should not validate an empty string when allowEmpty is set as `false`', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'time', type: 'time', allowEmpty: false },
          { data: 'name' },
          { data: 'lastName' }
        ],
        afterValidate: onAfterValidate
      });

      await setDataAtCell(1, 0, '');

      await waitForNextAnimationFrames(2);

      expect(onAfterValidate).toHaveBeenCalledWith(false, '', 1, 'time');
    });

    it('should not validate `null` when allowEmpty is set as `false`', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'time', type: 'time', allowEmpty: false },
          { data: 'name' },
          { data: 'lastName' }
        ],
        afterValidate: onAfterValidate
      });

      await setDataAtCell(1, 0, null);

      await waitForNextAnimationFrames(2);

      expect(onAfterValidate).toHaveBeenCalledWith(false, null, 1, 'time');
    });

    it('should not validate `undefined` when allowEmpty is set as `false`', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'time', type: 'time', allowEmpty: false },
          { data: 'name' },
          { data: 'lastName' }
        ],
        afterValidate: onAfterValidate
      });

      await setDataAtCell(1, 0);

      await waitForNextAnimationFrames(2);

      expect(onAfterValidate).toHaveBeenCalledWith(false, undefined, 1, 'time');
    });
  });

  describe('Time formats', () => {
    describe('with valid 24-hour ISO times', () => {
      using('data set', [
        { value: '23:15', isValid: true },
        { value: '00:00', isValid: true },
        { value: '23:59:59', isValid: true },
        { value: '08:05:30.123', isValid: true },
        { value: '08:05:30.5', isValid: true },
        { value: '01:02:03:04', isValid: false },
        { value: '23:65', isValid: false },
        { value: '23:155', isValid: false },
        { value: '23:15 PM', isValid: false },
        { value: '23:15 pm', isValid: false },
      ], ({ value, isValid }) => {
        it('should validate positively', async() => {
          const onAfterValidateSpy = jasmine.createSpy('onAfterValidate');

          handsontable({
            data: [[]],
            columns: [
              { type: 'time' },
            ],
            afterValidate: onAfterValidateSpy
          });

          await setDataAtCell(0, 0, value);

          await waitForNextAnimationFrames(2);

          expect(onAfterValidateSpy).toHaveBeenCalledWith(isValid, value, 0, 0);
        });
      });
    });
  });
});
