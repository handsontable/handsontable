const id = 'testContainer';

describe('Date Editor', () => {
  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should close the editor after select the date', async() => {
    const hot = handsontable({
      data: [
        ['01/14/2006'],
        ['12/01/2008'],
        ['11/19/2011'],
        ['02/02/2004'],
        ['07/24/2011'],
      ],
      columns: [{ type: 'date', dateFormat: 'MM/DD/YYYY' }],
    });

    const cell = hot.getCell(0, 0);

    expect(getSelected()).toBeUndefined();

    triggerTouchEvent('touchstart', cell);
    triggerTouchEvent('touchend', cell);
    triggerTouchEvent('touchstart', cell);
    triggerTouchEvent('touchend', cell);

    await sleep(100);

    expect($('.pika-single').is(':visible')).toBe(true);

    const datePickerFirstButton = document.querySelector('.pika-button');

    triggerTouchEvent('touchstart', datePickerFirstButton);
    triggerTouchEvent('touchend', datePickerFirstButton);

    await sleep(100);

    expect($('.pika-single').is(':visible')).toBe(false);

  });

  it('should display the correct date in the cell after select the date', async() => {
    const hot = handsontable({
      data: [
        ['01/14/2006'],
        ['12/01/2008'],
        ['11/19/2011'],
        ['02/02/2004'],
        ['07/24/2011'],
      ],
      columns: [{ type: 'date', dateFormat: 'MM/DD/YYYY' }],
    });

    const cell = hot.getCell(0, 0);

    expect(getSelected()).toBeUndefined();

    triggerTouchEvent('touchstart', cell);
    triggerTouchEvent('touchend', cell);
    triggerTouchEvent('touchstart', cell);
    triggerTouchEvent('touchend', cell);

    const datePickerFirstButton = document.querySelector('.pika-button');

    triggerTouchEvent('touchstart', datePickerFirstButton);
    triggerTouchEvent('touchend', datePickerFirstButton);

    await sleep(100);

    expect(getDataAtCell(0, 0)).toMatch('01/01/2006');
  });
});
