describe('NumericEditor keyboard shortcut', () => {
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

  describe('"Tab"', () => {
    it('should not throw an error when pressing on the last column', async() => {
      const spy = jasmine.createSpyObj('error', ['test']);
      const prevError = window.onerror;

      window.onerror = function() {
        spy.test();

        return true;
      };

      handsontable({
        type: 'numeric',
        startRows: 5,
        startCols: 5,
        tabNavigation: true,
      });

      selectCell(0, 4);
      keyDownUp('enter');
      keyDownUp('tab');

      await sleep(50);

      expect(spy.test.calls.count()).toBe(0);

      window.onerror = prevError;
    });
  });
});
