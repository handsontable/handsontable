describe('intlTimeValidator', () => {
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
      { time: '16:10:05', name: 'Ted', lastName: 'Right' },
      { time: '17:15:25', name: 'Frank', lastName: 'Honest' },
      { time: '14:65:45', name: 'Joan', lastName: 'Well' },
      { time: '33:25:05', name: 'Sid', lastName: 'Strong' }
    ];
  };

  it('should validate an empty string (default behavior)', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'time', type: 'intl-time' },
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
        { data: 'time', type: 'intl-time' },
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
        { data: 'time', type: 'intl-time' },
        { data: 'name' },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });

    await setDataAtCell(0, 0, '30:10:25');

    await waitForNextAnimationFrames(2);

    expect(onAfterValidate).toHaveBeenCalledWith(false, '30:10:25', 0, 'time');
  });
});
