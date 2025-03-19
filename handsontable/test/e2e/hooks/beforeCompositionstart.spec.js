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

  describe('beforeCompositionstart', () => {
    it('should be fired after typing characters using IME', () => {
      const beforeCompositionstart = jasmine.createSpy('beforeCompositionstart');

      handsontable({
        data: createSpreadsheetData(5, 5),
        beforeCompositionstart,
      });

      listen();

      const event = new Event('compositionstart', {
        data: 'c',
      });

      document.documentElement.dispatchEvent(event);

      expect(beforeCompositionstart).toHaveBeenCalledTimes(1);
    });
  });
});
