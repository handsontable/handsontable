/* eslint no-console: off */
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

    it('should print information about key invalidation right after the Handsontable root element', () => {
      handsontable({}, true);

      const info = spec().$container[0].nextSibling;

      expect(info.className).toBe('handsontable hot-display-license-info');
      expect(info.innerText).toBe([
        'The license key for Handsontable is missing. Use your purchased key to activate the product. ',
        'Alternatively, you can activate Handsontable to use for non-commercial purposes ',
        'by passing the key: \'non-commercial-and-evaluation\'. ',
        'Read more about it in the documentation or contact us at support@handsontable.com.',
      ].join(''));
    });

    it('should destroy all DOM elements related to the invalidation information for specific HoT instance only', () => {
      const element2 = $('<div id="hot2"></div>').appendTo('body');

      const hot1 = handsontable({}, true);
      const hot2 = new Handsontable(element2[0], {});

      expect(document.querySelectorAll('.hot-display-license-info').length).toBe(2);

      hot1.destroy();

      expect(document.querySelectorAll('.hot-display-license-info').length).toBe(1);

      hot2.destroy();
      element2.remove();

      expect(document.querySelectorAll('.hot-display-license-info').length).toBe(0);
    });
  });
});
