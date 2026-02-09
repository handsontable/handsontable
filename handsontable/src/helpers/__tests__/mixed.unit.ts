/* eslint no-console: off */
import {
  stringify,
  isDefined,
  isUndefined,
  isEmpty,
  isRegExp,
} from '../mixed';

let mockMoment = jest.requireActual('moment')();

jest.mock('moment', () => {
  return () => mockMoment;
});

describe('Mixed helper', () => {
  describe('stringify', () => {
    it('should convert properly `null` to `string`', () => {
      const toConvert = null;

      expect(stringify(toConvert)).toBe('');
    });

    it('should convert properly `boolean` to `string`', () => {
      const toConvert = true;

      expect(stringify(toConvert)).toBe('true');
    });

    it('should convert properly `number` to `string`', () => {
      const toConvert = 1;

      expect(stringify(toConvert)).toBe('1');
    });

    it('should convert properly `string` to `string`', () => {
      const toConvert = '2';

      expect(stringify(toConvert)).toBe('2');
    });

    it('should convert properly `object` to `string`', () => {
      const toConvert = { id: null };

      expect(stringify(toConvert)).toBe('[object Object]');
    });

    it('should convert properly `array` to `string`', () => {
      const toConvert = ['One', 'Two', 3];

      expect(stringify(toConvert)).toBe('One,Two,3');
    });

    it('should convert properly `RegExp` to `string`', () => {
      const toConvert = /^\d$/;

      expect(stringify(toConvert)).toBe('/^\\d$/');
    });

    it('should convert properly `function` to `string`', () => {
      const toConvert = function() {};

      expect(stringify(toConvert)).toMatch(/function/i);
    });

    it('should convert properly `undefined` to `string`', () => {
      let toConvert;

      expect(stringify(toConvert)).toBe('');
    });
  });

  describe('isDefined', () => {
    it('should return true when a variable is defined', () => {
      const toCheck = [];

      expect(isDefined(toCheck)).toBeTruthy();
    });

    it('should return false when a variable is not defined', () => {
      let toCheck;

      expect(isDefined(toCheck)).toBeFalsy();
    });
  });

  describe('isUndefined', () => {
    it('should check if a variable is defined', () => {
      let toCheck;

      expect(isUndefined(toCheck)).toBeTruthy();
    });

    it('should return false when a variable is not defined', () => {
      const toCheck = [];

      expect(isUndefined(toCheck)).toBeFalsy();
    });
  });

  describe('isEmpty', () => {
    it('should check if a variable is null, empty string or undefined', () => {
      expect(isEmpty(undefined)).toBeTruthy();
      expect(isEmpty('')).toBeTruthy();
      expect(isEmpty(null)).toBeTruthy();
    });

    it('should return false when a variable isn\'t null, empty string or undefined', () => {
      expect(isEmpty(NaN)).toBeFalsy();
      expect(isEmpty(0)).toBeFalsy();
      expect(isEmpty('a')).toBeFalsy();
      expect(isEmpty([])).toBeFalsy();
      expect(isEmpty({})).toBeFalsy();
    });
  });

  describe('isRegExp', () => {
    it('should check if a variable is a valid regular expression', () => {
      expect(isRegExp(undefined)).toBeFalsy();
      expect(isRegExp('')).toBeFalsy();
      expect(isRegExp(null)).toBeFalsy();
      expect(isRegExp(0)).toBeFalsy();
      expect(isRegExp(1)).toBeFalsy();
      expect(isRegExp('foo')).toBeFalsy();
      expect(isRegExp({ a: /\d+/ })).toBeFalsy();

      expect(isRegExp(/\d+/)).toBeTruthy();
      expect(isRegExp(new RegExp('d+'))).toBeTruthy();
    });
  });

  describe('_injectProductInfo', () => {
    const LICENSE_TEST_KEY = 'd0134-95841-770f2-c4f21-3751d'; // expired on 24/05/2011
    let _injectProductInfo;

    beforeEach(() => {
      // Isolates the tests (resets the internal function state) by resetting the module cache.
      jest.resetModules();
      // eslint-disable-next-line global-require
      _injectProductInfo = require('../mixed')._injectProductInfo;
    });

    it('should not print any information if the license key is not expired (1 day to expire)', () => {
      mockMoment = jest.requireActual('moment')('23/05/2011', 'DD/MM/YYYY');

      spyOn(console, 'warn');
      spyOn(console, 'info');
      spyOn(console, 'log');
      spyOn(console, 'error');

      const element = document.createElement('div').appendChild(document.createElement('div'));

      _injectProductInfo(LICENSE_TEST_KEY, element);

      expect(element.parentNode.querySelector('.hot-display-license-info')).toBe(null);
      expect(console.error).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('should not print any information if the license key is not expired (2 day to expire)', () => {
      mockMoment = jest.requireActual('moment')('22/05/2011', 'DD/MM/YYYY');

      spyOn(console, 'warn');
      spyOn(console, 'info');
      spyOn(console, 'log');
      spyOn(console, 'error');

      const element = document.createElement('div').appendChild(document.createElement('div'));

      _injectProductInfo(LICENSE_TEST_KEY, element);

      expect(element.parentNode.querySelector('.hot-display-license-info')).toBe(null);
      expect(console.error).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('should not print any information if the license key is not expired (1 year to expire)', () => {
      mockMoment = jest.requireActual('moment')('24/05/2010', 'DD/MM/YYYY');

      spyOn(console, 'warn');
      spyOn(console, 'info');
      spyOn(console, 'log');
      spyOn(console, 'error');

      const element = document.createElement('div').appendChild(document.createElement('div'));

      _injectProductInfo(LICENSE_TEST_KEY, element);

      expect(element.parentNode.querySelector('.hot-display-license-info')).toBe(null);
      expect(console.error).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('should not print any information if the expiration date is the same as the release date', () => {
      mockMoment = jest.requireActual('moment')('24/05/2010', 'DD/MM/YYYY');

      spyOn(console, 'warn');
      spyOn(console, 'info');
      spyOn(console, 'log');
      spyOn(console, 'error');

      const element = document.createElement('div').appendChild(document.createElement('div'));

      _injectProductInfo(LICENSE_TEST_KEY, element);

      expect(element.parentNode.querySelector('.hot-display-license-info')).toBe(null);
      expect(console.error).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('should print information about expiration of the the license key (key expired 1 day ago)', () => {
      mockMoment = jest.requireActual('moment')('25/05/2011', 'DD/MM/YYYY');

      spyOn(console, 'warn');
      spyOn(console, 'info');
      spyOn(console, 'log');
      spyOn(console, 'error');

      const element = document.createElement('div').appendChild(document.createElement('div'));

      _injectProductInfo(LICENSE_TEST_KEY, element);

      expect(element.parentNode.querySelector('.hot-display-license-info').innerHTML).toBe([
        'The license key for Handsontable expired on May 25, 2011, and is not valid for the installed ',
        `version ${process.env.HOT_VERSION}. <a href="https://handsontable.com/pricing" target="_blank">Renew</a> `,
        'your license key or downgrade to a version released prior to May 25, 2011. If you need any ',
        'help, contact us at <a href="mailto:sales@handsontable.com">sales@handsontable.com</a>.',
      ].join(''));
      expect(console.error).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith([
        'The license key for Handsontable expired on May 25, 2011, and is not valid for the installed ',
        `version ${process.env.HOT_VERSION}. Renew your license key at handsontable.com or downgrade `,
        'to a version released prior to May 25, 2011. If you need any help, contact us at sales@handsontable.com.',
      ].join(''));
    });

    it('should print information about expiration of the the license key (key expired 2 days ago)', () => {
      mockMoment = jest.requireActual('moment')('26/05/2011', 'DD/MM/YYYY');

      spyOn(console, 'warn');
      spyOn(console, 'info');
      spyOn(console, 'log');
      spyOn(console, 'error');

      const element = document.createElement('div').appendChild(document.createElement('div'));

      _injectProductInfo(LICENSE_TEST_KEY, element);

      expect(element.parentNode.querySelector('.hot-display-license-info').innerHTML).toBe([
        'The license key for Handsontable expired on May 26, 2011, and is not valid for the installed ',
        `version ${process.env.HOT_VERSION}. <a href="https://handsontable.com/pricing" target="_blank">Renew</a> `,
        'your license key or downgrade to a version released prior to May 26, 2011. If you need any ',
        'help, contact us at <a href="mailto:sales@handsontable.com">sales@handsontable.com</a>.',
      ].join(''));
      expect(console.error).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith([
        'The license key for Handsontable expired on May 26, 2011, and is not valid for the installed ',
        `version ${process.env.HOT_VERSION}. Renew your license key at handsontable.com or downgrade `,
        'to a version released prior to May 26, 2011. If you need any help, contact us at sales@handsontable.com.',
      ].join(''));
    });

    it('should print information about expiration of the the license key (key expired 1 year ago)', () => {
      mockMoment = jest.requireActual('moment')('24/05/2012', 'DD/MM/YYYY');

      spyOn(console, 'warn');
      spyOn(console, 'info');
      spyOn(console, 'log');
      spyOn(console, 'error');

      const element = document.createElement('div').appendChild(document.createElement('div'));

      _injectProductInfo(LICENSE_TEST_KEY, element);

      expect(element.parentNode.querySelector('.hot-display-license-info').innerHTML).toBe([
        'The license key for Handsontable expired on May 24, 2012, and is not valid for the installed ',
        `version ${process.env.HOT_VERSION}. <a href="https://handsontable.com/pricing" target="_blank">Renew</a> `,
        'your license key or downgrade to a version released prior to May 24, 2012. If you need any ',
        'help, contact us at <a href="mailto:sales@handsontable.com">sales@handsontable.com</a>.',
      ].join(''));
      expect(console.error).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      // expect(console.log).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith([
        'The license key for Handsontable expired on May 24, 2012, and is not valid for the installed ',
        `version ${process.env.HOT_VERSION}. Renew your license key at handsontable.com or downgrade `,
        'to a version released prior to May 24, 2012. If you need any help, contact us at sales@handsontable.com.',
      ].join(''));
    });

    it('should print information about missing license key', () => {
      spyOn(console, 'warn');
      spyOn(console, 'info');
      spyOn(console, 'log');
      spyOn(console, 'error');

      const element = document.createElement('div').appendChild(document.createElement('div'));

      _injectProductInfo('', element);

      expect(element.parentNode.querySelector('.hot-display-license-info').innerHTML).toBe([
        'The license key for Handsontable is missing. Use your purchased key to activate the product. ',
        'Alternatively, you can activate Handsontable to use for non-commercial purposes ',
        'by passing the key: \'non-commercial-and-evaluation\'. ',
        '<a href="https://handsontable.com/docs/tutorial-license-key.html" target="_blank">Read more</a> ',
        'about it in the documentation or contact us at <a href="mailto:support@handsontable.com">',
        'support@handsontable.com</a>.',
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
      spyOn(console, 'warn');
      spyOn(console, 'info');
      spyOn(console, 'log');
      spyOn(console, 'error');

      const element = document.createElement('div').appendChild(document.createElement('div'));

      _injectProductInfo('invalidKey', element);

      expect(element.parentNode.querySelector('.hot-display-license-info').innerHTML).toBe([
        'The license key for Handsontable is invalid. ',
        '<a href="https://handsontable.com/docs/tutorial-license-key.html" target="_blank">Read more</a> ',
        'on how to install it properly or contact us at <a href="mailto:support@handsontable.com">',
        'support@handsontable.com</a>.',
      ].join(''));
      expect(console.error).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith([
        'The license key for Handsontable is invalid. ',
        'If you need any help, contact us at support@handsontable.com.',
      ].join(''));
    });

    it('should print information about invalidation only once in the console and always in the DOM', () => {
      spyOn(console, 'warn');
      spyOn(console, 'info');
      spyOn(console, 'log');
      spyOn(console, 'error');

      const element = document.createElement('div').appendChild(document.createElement('div'));

      _injectProductInfo('invalidKey', element);

      expect(element.parentNode.querySelector('.hot-display-license-info').innerHTML).toBe([
        'The license key for Handsontable is invalid. ',
        '<a href="https://handsontable.com/docs/tutorial-license-key.html" target="_blank">Read more</a> ',
        'on how to install it properly or contact us at <a href="mailto:support@handsontable.com">',
        'support@handsontable.com</a>.',
      ].join(''));
      expect(console.error).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith([
        'The license key for Handsontable is invalid. ',
        'If you need any help, contact us at support@handsontable.com.',
      ].join(''));

      const element2 = document.createElement('div').appendChild(document.createElement('div'));

      _injectProductInfo('invalidKey', element2);

      expect(element2.parentNode.querySelector('.hot-display-license-info').innerHTML).toBe([
        'The license key for Handsontable is invalid. ',
        '<a href="https://handsontable.com/docs/tutorial-license-key.html" target="_blank">Read more</a> ',
        'on how to install it properly or contact us at <a href="mailto:support@handsontable.com">',
        'support@handsontable.com</a>.',
      ].join(''));
      expect(console.error).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledTimes(1);
    });

    it('should not print any information if non-commercial key is used', () => {
      spyOn(console, 'warn');
      spyOn(console, 'info');
      spyOn(console, 'log');
      spyOn(console, 'error');

      const element = document.createElement('div').appendChild(document.createElement('div'));

      _injectProductInfo('non-commercial-and-evaluation', element);

      expect(element.parentNode.querySelector('.hot-display-license-info')).toBe(null);
      expect(console.error).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
    });
  });
});
