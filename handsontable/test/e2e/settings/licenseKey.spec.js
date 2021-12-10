describe('settings', () => {
  describe('licenseKey', () => {
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

    it('should add info under table about missing license key', () => {
      handsontable({});

      const info = spec().$container[0].nextSibling;

      expect(info.innerText).toBe([
        'The license key for Handsontable is missing. Use your purchased key to activate the product. ',
        'Alternatively, you can activate Handsontable to use for non-commercial purposes ',
        'by passing the key: \'non-commercial-and-evaluation\'. ',
        'Read more about it in the documentation or contact us at support@handsontable.com.',
      ].join(''));
    });

    it('should add info under table about invalid license key', () => {
      handsontable({
        licenseKey: 'invalidKey'
      });

      const info = spec().$container[0].nextSibling;

      expect(info.innerText).toBe([
        'The license key for Handsontable is invalid. ',
        'Read more on how to install it properly or contact us at support@handsontable.com.',
      ].join(''));
    });

    it('should not add info under table if non-commercial key is used', () => {
      handsontable({
        licenseKey: 'non-commercial-and-evaluation'
      });

      expect(spec().$container[0].nextSibling).toBe(null);
    });
  });
});
