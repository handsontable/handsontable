describe('keyboard navigation', () => {
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

  function getDates() {
    return [
      ['01/14/2006'],
      ['12/01/2008'],
      ['11/19/2011'],
      ['02/02/2004'],
      ['07/24/2011']
    ];
  }

  it('should allow navigating around the date picker after opening the date editor, without closing it', () => {
    handsontable({
      data: getDates(),
      columns: [{ type: 'date', dateFormat: 'MM/DD/YYYY' }],
    });

    const getSelectedButton = () => getActiveEditor().datePicker.querySelector('.is-selected button');

    selectCell(0, 0);

    keyDownUp('enter');

    keyDownUp('arrowdown');

    expect(getSelectedButton().getAttribute('data-pika-day')).toEqual('21');
    expect(getSelectedButton().getAttribute('data-pika-month')).toEqual('0');
    expect(getSelectedButton().getAttribute('data-pika-year')).toEqual('2006');

    expect(getActiveEditor().isOpened()).toBe(true);

    keyDownUp('arrowleft');

    expect(getSelectedButton().getAttribute('data-pika-day')).toEqual('20');
    expect(getSelectedButton().getAttribute('data-pika-month')).toEqual('0');
    expect(getSelectedButton().getAttribute('data-pika-year')).toEqual('2006');

    expect(getActiveEditor().isOpened()).toBe(true);

    keyDownUp('arrowup');

    expect(getSelectedButton().getAttribute('data-pika-day')).toEqual('13');
    expect(getSelectedButton().getAttribute('data-pika-month')).toEqual('0');
    expect(getSelectedButton().getAttribute('data-pika-year')).toEqual('2006');

    expect(getActiveEditor().isOpened()).toBe(true);

    keyDownUp('arrowup');

    expect(getSelectedButton().getAttribute('data-pika-day')).toEqual('6');
    expect(getSelectedButton().getAttribute('data-pika-month')).toEqual('0');
    expect(getSelectedButton().getAttribute('data-pika-year')).toEqual('2006');

    expect(getActiveEditor().isOpened()).toBe(true);
  });

  it('should allow committing the value using the ENTER key after choosing it with the arrow keys', async() => {
    handsontable({
      data: getDates(),
      columns: [{ type: 'date', dateFormat: 'MM/DD/YYYY' }],
    });

    const getSelectedButton = () => getActiveEditor().datePicker.querySelector('.is-selected button');

    selectCell(0, 0);

    keyDownUp('enter');
    keyDownUp('arrowdown');

    expect(getSelectedButton().getAttribute('data-pika-day')).toEqual('21');
    expect(getSelectedButton().getAttribute('data-pika-month')).toEqual('0');
    expect(getSelectedButton().getAttribute('data-pika-year')).toEqual('2006');

    expect(getActiveEditor().isOpened()).toBe(true);

    keyDownUp('enter');

    await sleep(15);

    expect(getActiveEditor().isOpened()).toBe(false);

    expect(getDataAtCell(0, 0)).toEqual('01/21/2006');
  });

  it('should allow cancel the editing, keeping the previous value in the cell using the ESCPAE key after' +
    ' choosing a value it with the arrow keys', async() => {
    handsontable({
      data: getDates(),
      columns: [{ type: 'date', dateFormat: 'MM/DD/YYYY' }],
    });

    const getSelectedButton = () => getActiveEditor().datePicker.querySelector('.is-selected button');

    selectCell(0, 0);

    keyDownUp('enter');
    keyDownUp('arrowdown');

    expect(getSelectedButton().getAttribute('data-pika-day')).toEqual('21');
    expect(getSelectedButton().getAttribute('data-pika-month')).toEqual('0');
    expect(getSelectedButton().getAttribute('data-pika-year')).toEqual('2006');

    expect(getActiveEditor().isOpened()).toBe(true);

    keyDownUp('escape');

    await sleep(15);

    expect(getActiveEditor().isOpened()).toBe(false);

    expect(getDataAtCell(0, 0)).toEqual('01/14/2006');
  });
});
