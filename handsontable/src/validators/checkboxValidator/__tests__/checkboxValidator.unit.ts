import { checkboxValidator, VALIDATOR_TYPE } from '../';
import type { CellProperties } from '../../../settings';

describe('checkboxValidator (DEV-355)', () => {
  const validate = (value: unknown, meta: Partial<CellProperties> = {}) => {
    let result: boolean | undefined;

    checkboxValidator.call(meta as CellProperties, value, (valid) => {
      result = valid;
    });

    return result;
  };

  it('should be registered under the `checkbox` name', () => {
    expect(VALIDATOR_TYPE).toBe('checkbox');
    expect(checkboxValidator.VALIDATOR_TYPE).toBe('checkbox');
  });

  it('should accept the default templates in any letter case', () => {
    expect(validate(true)).toBe(true);
    expect(validate(false)).toBe(true);
    expect(validate('TRUE')).toBe(true);
    expect(validate('false')).toBe(true);
  });

  it('should accept custom templates and reject the defaults then', () => {
    const meta = { checkedTemplate: 'yes', uncheckedTemplate: 'no' };

    expect(validate('yes', meta)).toBe(true);
    expect(validate('NO', meta)).toBe(true);
    expect(validate(true, meta)).toBe(false);
  });

  it('should reject a value that matches neither template', () => {
    expect(validate('Ted')).toBe(false);
    expect(validate('1')).toBe(false);
    expect(validate({})).toBe(false);
  });

  it('should accept an empty value unless `allowEmpty` is `false`', () => {
    expect(validate(null)).toBe(true);
    expect(validate('')).toBe(true);
    expect(validate(undefined, { allowEmpty: true })).toBe(true);
    expect(validate('', { allowEmpty: false })).toBe(false);
  });

  it('should accept an empty value that is itself a template, whatever `allowEmpty` says', () => {
    expect(validate('', { uncheckedTemplate: '', allowEmpty: false })).toBe(true);
    expect(validate('', { checkedTemplate: '', uncheckedTemplate: 'X', allowEmpty: false })).toBe(true);
    // `null` reads as `''` in the matcher, the same as the renderer reads it, so it matches that template.
    expect(validate(null, { uncheckedTemplate: '', allowEmpty: false })).toBe(true);
    expect(validate(null, { checkedTemplate: 'X', uncheckedTemplate: 'Y', allowEmpty: false })).toBe(false);
  });
});
