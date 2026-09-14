import { dropdownValidator } from '../dropdownValidator';
import { autocompleteValidator } from '../../autocompleteValidator/autocompleteValidator';

const SOURCE = ['yellow', 'red', 'green'];

/**
 * Runs a validator and returns the result it reported.
 *
 * @param {Function} validator The validator under test.
 * @param {object} cellProperties The object the validator is called on.
 * @param {*} value The value to validate.
 * @returns {boolean|undefined}
 */
function validate(validator, cellProperties, value) {
  let result;

  validator.call(cellProperties, value, (valid) => {
    result = valid;
  });

  return result;
}

describe('dropdownValidator', () => {
  // DEV-2911. A dropdown is always strict: its editor forces `strict` onto the cell it prepares.
  // The validator used to read `strict` from the meta, so a cell whose editor never ran kept the
  // column's `strict: false` and accepted any value.
  describe('when the cell meta carries `strict: false`', () => {
    it('should validate a value outside the source negatively', () => {
      expect(validate(dropdownValidator, { strict: false, source: SOURCE }, 'purple')).toBe(false);
    });

    it('should validate a value from the source positively', () => {
      expect(validate(dropdownValidator, { strict: false, source: SOURCE }, 'red')).toBe(true);
    });

    it('should query a function source, calling it on the cell meta', () => {
      const cellProperties = {
        strict: false,
        source: jasmine.createSpy('source').and.callFake((query, process) => process(SOURCE)),
      };

      expect(validate(dropdownValidator, cellProperties, 'purple')).toBe(false);
      expect(cellProperties.source).toHaveBeenCalledTimes(1);
      expect(cellProperties.source.calls.first().object).toBe(cellProperties);
      expect(cellProperties.source.calls.first().args[0]).toBe('purple');
    });

    it('should not write `strict` onto the cell meta', () => {
      const cellProperties = { strict: false, source: SOURCE };

      validate(dropdownValidator, cellProperties, 'purple');

      expect(cellProperties.strict).toBe(false);
    });

    it('should validate any value positively when the cell has no source', () => {
      // The only branch where the forced strict mode is not what decides the result. A cell with
      // no `source` has nothing to check against, so it must not start rejecting values.
      expect(validate(dropdownValidator, { strict: false }, 'purple')).toBe(true);
      expect(validate(dropdownValidator, {}, 'purple')).toBe(true);
    });

    it('should still apply `allowEmpty` to an empty value', () => {
      expect(validate(dropdownValidator, { strict: false, source: SOURCE, allowEmpty: true }, '')).toBe(true);
      expect(validate(dropdownValidator, { strict: false, source: SOURCE, allowEmpty: false }, '')).toBe(false);
    });

    it('should leave the autocomplete validator accepting any value', () => {
      // The control: flexible mode is what `strict: false` means for an autocomplete cell.
      expect(validate(autocompleteValidator, { strict: false, source: SOURCE }, 'purple')).toBe(true);
    });
  });
});
