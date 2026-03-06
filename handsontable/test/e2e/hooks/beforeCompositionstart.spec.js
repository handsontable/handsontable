describe('Hook', () => {
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

  describe('beforeCompositionStart', () => {
    it('should be fired after typing characters using IME', async() => {
      const beforeCompositionStart = jasmine.createSpy('beforeCompositionStart');

      handsontable({
        data: createSpreadsheetData(5, 5),
        beforeCompositionStart,
      });

      await listen();

      const event = new Event('compositionstart', {
        data: 'c',
      });

      document.documentElement.dispatchEvent(event);

      expect(beforeCompositionStart).toHaveBeenCalledTimes(1);
    });
  });
});
