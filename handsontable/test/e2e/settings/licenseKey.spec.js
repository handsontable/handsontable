/* eslint no-console: off */
describe('settings', () => {
  describe('licenseKey', () => {
    const LICENSE_TEST_KEY = 'd0134-95841-770f2-c4f21-3751d'; // expired on 24/05/2011
    const id = 'testContainer';
    const originMoment = window.moment;

    beforeEach(function() {
      this.$container = $(`<div id="${id}"></div>`).appendTo('body');
      // Injecting Handsontable within the tests allows mocking the momentJS library.
      $('head').append('<script id="dynamic-hot-script" src="../dist/handsontable.js"></script>');
    });

    afterEach(function() {
      $('#dynamic-hot-script').remove();

      if (this.$container) {
        destroy();
        this.$container.remove();
      }
    });

    it('should not print any information if the license key is not expired (1 day to expire)', () => {
      window.moment = function() {
        return originMoment('23/05/2011', 'DD/MM/YYYY');
      };
      $('head').append('<script src="../dist/handsontable.js"></script>');

      spyOn(console, 'warn');
      spyOn(console, 'info');
      spyOn(console, 'log');
      spyOn(console, 'error');

      handsontable({
        licenseKey: LICENSE_TEST_KEY,
      }, true);

      expect(spec().$container[0].nextSibling).toBe(null);
      expect(console.error).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('should not print any information if the license key is not expired (2 days to expire)', () => {
      window.moment = function() {
        return originMoment('23/05/2011', 'DD/MM/YYYY');
      };
      $('head').append('<script src="../dist/handsontable.js"></script>');

      spyOn(console, 'warn');
      spyOn(console, 'info');
      spyOn(console, 'log');
      spyOn(console, 'error');

      handsontable({
        licenseKey: LICENSE_TEST_KEY,
      }, true);

      expect(spec().$container[0].nextSibling).toBe(null);
      expect(console.error).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('should not print any information if the license key is not expired (1 year to expire)', () => {
      window.moment = function() {
        return originMoment('23/05/2011', 'DD/MM/YYYY');
      };
      $('head').append('<script src="../dist/handsontable.js"></script>');

      spyOn(console, 'warn');
      spyOn(console, 'info');
      spyOn(console, 'log');
      spyOn(console, 'error');

      handsontable({
        licenseKey: LICENSE_TEST_KEY,
      }, true);

      expect(spec().$container[0].nextSibling).toBe(null);
      expect(console.error).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('should not print any information if the expiration date is the same as the release date', () => {
      window.moment = function() {
        return originMoment('23/05/2011', 'DD/MM/YYYY');
      };
      $('head').append('<script src="../dist/handsontable.js"></script>');

      spyOn(console, 'warn');
      spyOn(console, 'info');
      spyOn(console, 'log');
      spyOn(console, 'error');

      handsontable({
        licenseKey: LICENSE_TEST_KEY,
      }, true);

      expect(spec().$container[0].nextSibling).toBe(null);
      expect(console.error).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('should print information about expiration of the the license key (key expired 1 day ago)', () => {
      window.moment = function() {
        return originMoment('23/05/2011', 'DD/MM/YYYY');
      };
      $('head').append('<script src="../dist/handsontable.js"></script>');

      spyOn(console, 'warn');
      spyOn(console, 'info');
      spyOn(console, 'log');
      spyOn(console, 'error');

      handsontable({
        licenseKey: LICENSE_TEST_KEY,
      }, true);

      const info = spec().$container[0].nextSibling;

      expect(info.innerHTML).toBe([
        'The license key for Handsontable expired on May 25, 2011, and is not valid for the installed ',
        `version ${Handsontable.version}. <a href="https://handsontable.com/pricing" target="_blank">Renew</a> your `,
        'license key or downgrade to a version released prior to May 25, 2011. If you need any ',
        'help, contact us at <a href="mailto:sales@handsontable.com">sales@handsontable.com</a>.',
      ].join(''));
      expect(console.error).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith([
        'The license key for Handsontable expired on May 25, 2011, and is not valid for the installed ',
        `version ${Handsontable.version}. Renew your license key at handsontable.com or downgrade `,
        'to a version released prior to May 25, 2011. If you need any help, contact us at sales@handsontable.com.',
      ].join(''));
    });

    it('should print information about expiration of the the license key (key expired 2 day ago)', () => {
      window.moment = function() {
        return originMoment('23/05/2011', 'DD/MM/YYYY');
      };
      $('head').append('<script src="../dist/handsontable.js"></script>');

      spyOn(console, 'warn');
      spyOn(console, 'info');
      spyOn(console, 'log');
      spyOn(console, 'error');

      handsontable({
        licenseKey: LICENSE_TEST_KEY,
      }, true);

      const info = spec().$container[0].nextSibling;

      expect(info.innerHTML).toBe([
        'The license key for Handsontable expired on May 26, 2011, and is not valid for the installed ',
        `version ${Handsontable.version}. <a href="https://handsontable.com/pricing" target="_blank">Renew</a> your `,
        'license key or downgrade to a version released prior to May 26, 2011. If you need any ',
        'help, contact us at <a href="mailto:sales@handsontable.com">sales@handsontable.com</a>.',
      ].join(''));
      expect(console.error).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith([
        'The license key for Handsontable expired on May 26, 2011, and is not valid for the installed ',
        `version ${Handsontable.version}. Renew your license key at handsontable.com or `,
        'downgrade to a version released prior to May 26, 2011. If you need any help, contact ',
        'us at sales@handsontable.com.',
      ].join(''));
    });

    it('should print information about expiration of the the license key (key expired 1 year ago)', () => {
      window.moment = function() {
        return originMoment('23/05/2011', 'DD/MM/YYYY');
      };
      $('head').append('<script src="../dist/handsontable.js"></script>');

      spyOn(console, 'warn');
      spyOn(console, 'info');
      spyOn(console, 'log');
      spyOn(console, 'error');

      handsontable({
        licenseKey: LICENSE_TEST_KEY,
      }, true);

      const info = spec().$container[0].nextSibling;

      expect(info.innerHTML).toBe([
        'The license key for Handsontable expired on May 26, 2012, and is not valid for the installed ',
        `version ${Handsontable.version}. <a href="https://handsontable.com/pricing" target="_blank">Renew</a> your `,
        'license key or downgrade to a version released prior to May 26, 2012. If you need any ',
        'help, contact us at <a href="mailto:sales@handsontable.com">sales@handsontable.com</a>.',
      ].join(''));
      expect(console.error).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith([
        'The license key for Handsontable expired on May 26, 2012, and is not valid for the installed ',
        `version ${Handsontable.version}. Renew your license key at handsontable.com or `,
        'downgrade to a version released prior to May 26, 2012. If you need any help, contact ',
        'us at sales@handsontable.com.',
      ].join(''));
    });

    it('should print information about missing license key', () => {
      spyOn(console, 'warn');
      spyOn(console, 'info');
      spyOn(console, 'log');
      spyOn(console, 'error');

      handsontable({}, true);

      const info = spec().$container[0].nextSibling;

      expect(info.innerText).toBe([
        'The license key for Handsontable is missing. Use your purchased key to activate the product. ',
        'Alternatively, you can activate Handsontable to use for non-commercial purposes ',
        'by passing the key: \'non-commercial-and-evaluation\'. ',
        'Read more about it in the documentation or contact us at support@handsontable.com.',
      ].join(''));
      expect(console.error).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith([
        'The license key for Handsontable is missing. Use your purchased key to activate the product. ',
        'Alternatively, you can activate Handsontable to use for non-commercial purposes ',
        'by passing the key: \'non-commercial-and-evaluation\'. ',
        'If you need any help, contact us at support@handsontable.com.',
      ].join(''));
    });

    it('should print information about invalid license key', () => {
      spyOn(console, 'error');
      spyOn(console, 'info');
      spyOn(console, 'log');
      spyOn(console, 'warn');

      handsontable({
        licenseKey: 'invalidKey'
      }, true);

      const info = spec().$container[0].nextSibling;

      expect(info.innerText).toBe([
        'The license key for Handsontable is invalid. ',
        'Read more on how to install it properly or contact us at support@handsontable.com.',
      ].join(''));
      expect(console.error).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith([
        'The license key for Handsontable is invalid. ',
        'If you need any help, contact us at support@handsontable.com.',
      ].join(''));
    });

    it('should not print any information if non-commercial key is used', () => {
      spyOn(console, 'error');
      spyOn(console, 'info');
      spyOn(console, 'log');
      spyOn(console, 'warn');

      handsontable({
        licenseKey: 'non-commercial-and-evaluation'
      });

      expect(spec().$container[0].nextSibling).toBe(null);
      expect(console.error).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
    });
  });
});
