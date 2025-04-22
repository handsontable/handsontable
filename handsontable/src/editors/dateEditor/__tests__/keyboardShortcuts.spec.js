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

  describe('"ArrowUp"', () => {
    it('should allow navigating around the date picker after opening the date editor, without closing it', () => {
      handsontable({
        data: getDates(),
        columns: [{ type: 'date', dateFormat: 'MM/DD/YYYY' }],
      });

      const getSelectedButton = () => getActiveEditor().datePicker.querySelector('.is-selected button');

      selectCell(0, 0);

      keyDownUp('enter');
      keyDownUp('arrowup');

      expect(getSelectedButton().getAttribute('data-pika-day')).toEqual('7');
      expect(getSelectedButton().getAttribute('data-pika-month')).toEqual('0');
      expect(getSelectedButton().getAttribute('data-pika-year')).toEqual('2006');

      expect(getActiveEditor().isOpened()).toBe(true);

      keyDownUp('arrowup');

      expect(getSelectedButton().getAttribute('data-pika-day')).toEqual('31');
      expect(getSelectedButton().getAttribute('data-pika-month')).toEqual('11');
      expect(getSelectedButton().getAttribute('data-pika-year')).toEqual('2005');

      expect(getActiveEditor().isOpened()).toBe(true);
    });
  });

  describe('"ArrowDown"', () => {
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

      keyDownUp('arrowdown');

      expect(getSelectedButton().getAttribute('data-pika-day')).toEqual('28');
      expect(getSelectedButton().getAttribute('data-pika-month')).toEqual('0');
      expect(getSelectedButton().getAttribute('data-pika-year')).toEqual('2006');

      expect(getActiveEditor().isOpened()).toBe(true);
    });
  });

  describe('"ArrowRight"', () => {
    it('should allow navigating around the date picker after opening the date editor, without closing it', () => {
      handsontable({
        data: getDates(),
        columns: [{ type: 'date', dateFormat: 'MM/DD/YYYY' }],
      });

      const getSelectedButton = () => getActiveEditor().datePicker.querySelector('.is-selected button');

      selectCell(0, 0);

      keyDownUp('enter');
      keyDownUp('arrowright');

      expect(getSelectedButton().getAttribute('data-pika-day')).toEqual('15');
      expect(getSelectedButton().getAttribute('data-pika-month')).toEqual('0');
      expect(getSelectedButton().getAttribute('data-pika-year')).toEqual('2006');

      expect(getActiveEditor().isOpened()).toBe(true);

      keyDownUp('arrowright');

      expect(getSelectedButton().getAttribute('data-pika-day')).toEqual('16');
      expect(getSelectedButton().getAttribute('data-pika-month')).toEqual('0');
      expect(getSelectedButton().getAttribute('data-pika-year')).toEqual('2006');

      expect(getActiveEditor().isOpened()).toBe(true);
    });
  });

  describe('"ArrowLeft"', () => {
    it('should allow navigating around the date picker after opening the date editor, without closing it', () => {
      handsontable({
        data: getDates(),
        columns: [{ type: 'date', dateFormat: 'MM/DD/YYYY' }],
      });

      const getSelectedButton = () => getActiveEditor().datePicker.querySelector('.is-selected button');

      selectCell(0, 0);

      keyDownUp('enter');
      keyDownUp('arrowleft');

      expect(getSelectedButton().getAttribute('data-pika-day')).toEqual('13');
      expect(getSelectedButton().getAttribute('data-pika-month')).toEqual('0');
      expect(getSelectedButton().getAttribute('data-pika-year')).toEqual('2006');

      expect(getActiveEditor().isOpened()).toBe(true);

      keyDownUp('arrowleft');

      expect(getSelectedButton().getAttribute('data-pika-day')).toEqual('12');
      expect(getSelectedButton().getAttribute('data-pika-month')).toEqual('0');
      expect(getSelectedButton().getAttribute('data-pika-year')).toEqual('2006');

      expect(getActiveEditor().isOpened()).toBe(true);
    });
  });

  describe('"Enter"', () => {
    it('should commit the value', async() => {
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
  });

  describe('"Escape"', () => {
    it('should cancel the editing, keeping the previous value', async() => {
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
});
