describe('IntlDateType - allowEmpty', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}" style="width: 300px; height: 200px;"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should render empty string as empty when allowEmpty is true', async() => {
    handsontable({
      data: [['']],
      type: 'intl-date',
      dateFormat: { dateStyle: 'short' },
      allowEmpty: true,
    });

    expect(getCell(0, 0).innerText).toBe('');

    await setDataAtCell(0, 0, '');
    await waitForNextAnimationFrames(1);

    expect(getCell(0, 0).innerText).toBe('');
  });

  it('should render BAD_VALUE_TEXT for empty string when allowEmpty is false', async() => {
    handsontable({
      data: [['']],
      type: 'intl-date',
      dateFormat: { dateStyle: 'short' },
      allowEmpty: false,
    });

    expect(getCell(0, 0).innerText).toBe('#bad-value#');

    await setDataAtCell(0, 0, '');
    await waitForNextAnimationFrames(1);

    expect(getCell(0, 0).innerText).toBe('#bad-value#');
  });
});
