/* eslint no-console: off */
describe('settings', () => {
  describe('licenseKey', () => {
    const id = 'testContainer';

    beforeEach(function() {
      this.$container = $(`<div id="${id}"></div>`).appendTo('#rootWrapper');
      this.$container1 = $(`<div id="${id}1"></div>`).appendTo('#rootWrapper');
    });

    afterEach(function() {
      if (this.$container) {
        destroy();
      }
    });

    it('should print information about key invalidation right after the Handsontable root element', () => {
      handsontable({}, true);

      const info = spec().$container[0].nextSibling.nextSibling;

      expect(info.className).toBe('handsontable hot-display-license-info');
      expect(info.innerText).toBe([
        'The license key for Handsontable is missing. Use your purchased key to activate the product. ',
        'Alternatively, you can activate Handsontable to use for non-commercial purposes ',
        'by passing the key: \'non-commercial-and-evaluation\'. ',
        'Read more about it in the documentation or contact us at support@handsontable.com.',
      ].join(''));
    });

    it('should destroy all DOM elements related to the invalidation information for specific HoT instance only', () => {
      const hot1 = handsontable({}, true);
      const hot2 = new Handsontable(spec().$container1[0], {});

      expect(document.querySelectorAll('.hot-display-license-info').length).toBe(2);

      hot1.destroy();

      expect(document.querySelectorAll('.hot-display-license-info').length).toBe(1);

      hot2.destroy();

      expect(document.querySelectorAll('.hot-display-license-info').length).toBe(0);
    });
  });
});
