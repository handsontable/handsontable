import { regExpValidator } from '../regExpValidator';

/**
 * Runs a validator and returns what it reported to its callback.
 *
 * @param {Function} validator The validator under test.
 * @param {*} value The validated value.
 * @returns {boolean|undefined} The reported result.
 */
function validate(validator: ReturnType<typeof regExpValidator>, value: unknown): boolean | undefined {
  let result: boolean | undefined;

  validator(value, (valid) => {
    result = valid;
  });

  return result;
}

describe('regExpValidator', () => {
  it('should accept a value that matches the expression', () => {
    expect(validate(regExpValidator(/^\d+$/), '123')).toBe(true);
  });

  it('should reject a value that does not match the expression', () => {
    expect(validate(regExpValidator(/^\d+$/), '12a')).toBe(false);
  });

  it('should give a stable result for a global expression tested repeatedly (DEV-110)', () => {
    const validator = regExpValidator(/\d/g);
    const results = [1, 2, 3, 4].map(() => validate(validator, '123'));

    expect(results).toEqual([true, true, true, true]);
  });

  it('should give a stable result for a sticky expression tested repeatedly (DEV-110)', () => {
    const validator = regExpValidator(/\d/y);
    const results = [1, 2, 3, 4].map(() => validate(validator, '1'));

    expect(results).toEqual([true, true, true, true]);
  });

  it('should ignore a stale `lastIndex` left on the expression', () => {
    const expression = /abc/g;

    expression.lastIndex = 2;

    expect(validate(regExpValidator(expression), 'abc')).toBe(true);
  });
});
