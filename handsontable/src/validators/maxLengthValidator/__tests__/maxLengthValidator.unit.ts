import type { CellProperties } from '../../../settings';
import { isMaxLengthActive, maxLengthValidator, withMaxLength } from '../maxLengthValidator';

type Meta = { maxLength?: unknown, [key: string]: unknown };

/**
 * Runs a validator on the given cell meta and returns what it reported to its callback.
 *
 * @param {Function} validator The validator under test.
 * @param {object} meta The object the validator is called on (the cell meta).
 * @param {*} value The validated value.
 * @returns {boolean|undefined} The reported result, `undefined` when the callback was not called.
 */
function validate(validator: typeof maxLengthValidator, meta: Meta, value: unknown): boolean | undefined {
  let result: boolean | undefined;

  validator.call(meta as unknown as CellProperties, value, (valid: boolean) => {
    result = valid;
  });

  return result;
}

describe('isMaxLengthActive', () => {
  it('should be inactive for the default `Infinity`', () => {
    expect(isMaxLengthActive(Infinity)).toBe(false);
  });

  it('should be inactive for `NaN`, a negative number and `-Infinity`', () => {
    expect(isMaxLengthActive(NaN)).toBe(false);
    expect(isMaxLengthActive(-1)).toBe(false);
    expect(isMaxLengthActive(-Infinity)).toBe(false);
  });

  it('should be inactive for a value that is not a number', () => {
    expect(isMaxLengthActive(undefined)).toBe(false);
    expect(isMaxLengthActive(null)).toBe(false);
    expect(isMaxLengthActive('5')).toBe(false);
    expect(isMaxLengthActive(true)).toBe(false);
    expect(isMaxLengthActive({})).toBe(false);
  });

  it('should be active for `0` and for a finite positive number', () => {
    expect(isMaxLengthActive(0)).toBe(true);
    expect(isMaxLengthActive(5)).toBe(true);
  });
});

describe('maxLengthValidator', () => {
  it('should accept a string that is shorter than the limit', () => {
    expect(validate(maxLengthValidator, { maxLength: 3 }, 'ab')).toBe(true);
  });

  it('should accept a string whose length equals the limit', () => {
    expect(validate(maxLengthValidator, { maxLength: 3 }, 'abc')).toBe(true);
  });

  it('should reject a string that is one character over the limit', () => {
    expect(validate(maxLengthValidator, { maxLength: 3 }, 'abcd')).toBe(false);
  });

  it('should accept an empty string, also with `maxLength: 0`', () => {
    expect(validate(maxLengthValidator, { maxLength: 3 }, '')).toBe(true);
    expect(validate(maxLengthValidator, { maxLength: 0 }, '')).toBe(true);
  });

  it('should reject any text when `maxLength` is `0`', () => {
    expect(validate(maxLengthValidator, { maxLength: 0 }, 'a')).toBe(false);
  });

  it('should count an emoji as one character', () => {
    expect(validate(maxLengthValidator, { maxLength: 3 }, '😀😀😀')).toBe(true);
    expect(validate(maxLengthValidator, { maxLength: 3 }, '😀😀😀😀')).toBe(false);
    expect(validate(maxLengthValidator, { maxLength: 1 }, '😀')).toBe(true);
  });

  it('should always accept a value that is not a string', () => {
    expect(validate(maxLengthValidator, { maxLength: 1 }, 123456)).toBe(true);
    expect(validate(maxLengthValidator, { maxLength: 1 }, null)).toBe(true);
    expect(validate(maxLengthValidator, { maxLength: 1 }, undefined)).toBe(true);
    expect(validate(maxLengthValidator, { maxLength: 1 }, true)).toBe(true);
    expect(validate(maxLengthValidator, { maxLength: 1 }, ['abc', 'def'])).toBe(true);
  });

  it('should accept any string when the limit is inactive', () => {
    expect(validate(maxLengthValidator, { maxLength: Infinity }, 'a very long text')).toBe(true);
    expect(validate(maxLengthValidator, {}, 'a very long text')).toBe(true);
    expect(validate(maxLengthValidator, { maxLength: -1 }, 'a very long text')).toBe(true);
  });

  it('should read the limit from the object it is called on', () => {
    expect(validate(maxLengthValidator, { maxLength: 2 }, 'abc')).toBe(false);
    expect(validate(maxLengthValidator, { maxLength: 5 }, 'abc')).toBe(true);
  });
});

describe('withMaxLength', () => {
  describe('without a configured validator', () => {
    it('should return the length validator itself', () => {
      expect(withMaxLength()).toBe(maxLengthValidator);
    });
  });

  describe('with a function validator', () => {
    it('should call the configured validator and pass its result through when the value fits', () => {
      const rejecting = jest.fn((value, callback) => callback(false));
      const accepting = jest.fn((value, callback) => callback(true));

      expect(validate(withMaxLength(rejecting), { maxLength: 3 }, 'abc')).toBe(false);
      expect(rejecting).toHaveBeenCalledTimes(1);
      expect(validate(withMaxLength(accepting), { maxLength: 3 }, 'abc')).toBe(true);
      expect(accepting).toHaveBeenCalledTimes(1);
    });

    it('should not call the configured validator for a value that is too long', () => {
      const configured = jest.fn((value, callback) => callback(true));

      // The configured validator would accept it, so `false` can only come from the length check.
      expect(validate(withMaxLength(configured), { maxLength: 3 }, 'abcd')).toBe(false);
      expect(configured).not.toHaveBeenCalled();
    });

    it('should call the configured validator with the value and the cell meta as `this`', () => {
      const meta = { maxLength: 5 };
      let receivedThis: unknown;
      let receivedValue: unknown;

      const configured = function(this: unknown, value: unknown, callback: (valid: boolean) => void) {
        receivedThis = this;
        receivedValue = value;
        callback(true);
      };

      validate(withMaxLength(configured), meta, 'abc');

      expect(receivedThis).toBe(meta);
      expect(receivedValue).toBe('abc');
    });

    it('should wait for a configured validator that answers asynchronously', () => {
      let release: ((valid: boolean) => void) | undefined;
      const configured = (value: unknown, callback: (valid: boolean) => void) => {
        release = callback;
      };
      let result: boolean | undefined;

      withMaxLength(configured).call({ maxLength: 3 } as unknown as CellProperties, 'abc', (valid) => {
        result = valid;
      });

      expect(result).toBeUndefined();
      release!(true);
      expect(result).toBe(true);
    });

    it('should let a non-string value reach the configured validator', () => {
      const configured = jest.fn((value, callback) => callback(false));

      expect(validate(withMaxLength(configured), { maxLength: 1 }, 12345)).toBe(false);
      expect(configured).toHaveBeenCalledWith(12345, expect.any(Function));
    });
  });

  describe('with a RegExp validator', () => {
    it('should require the value to match the expression and to fit the limit', () => {
      const validator = withMaxLength(/^\d+$/);

      expect(validate(validator, { maxLength: 3 }, '123')).toBe(true);
      expect(validate(validator, { maxLength: 3 }, '12a')).toBe(false);
      expect(validate(validator, { maxLength: 3 }, '1234')).toBe(false);
    });

    it('should give a stable result when a global expression is tested repeatedly', () => {
      const validator = withMaxLength(/\d/g);
      const results = [];

      for (let i = 0; i < 4; i++) {
        results.push(validate(validator, { maxLength: 3 }, '123'));
      }

      expect(results).toEqual([true, true, true, true]);
    });

    it('should give a stable result when a sticky expression is tested repeatedly', () => {
      const validator = withMaxLength(/\d/y);
      const results = [];

      for (let i = 0; i < 4; i++) {
        results.push(validate(validator, { maxLength: 3 }, '1'));
      }

      expect(results).toEqual([true, true, true, true]);
    });

    it('should not test the expression for a value that is too long', () => {
      const expression = /\d/g;

      expression.lastIndex = 7;

      expect(validate(withMaxLength(expression), { maxLength: 2 }, '12345')).toBe(false);
      expect(expression.lastIndex).toBe(7);
    });
  });
});
