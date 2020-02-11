import {
  stringify,
  isDefined,
  isUndefined,
  isEmpty,
  isRegExp,
} from 'handsontable/helpers/mixed';

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
});
