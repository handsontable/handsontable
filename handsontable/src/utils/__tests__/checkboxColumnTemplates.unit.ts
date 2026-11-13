import { getCheckboxTemplates, isCheckedValue, matchCheckboxTemplate } from '../checkboxColumn';

describe('checkboxColumn template matching (DEV-355)', () => {
  describe('getCheckboxTemplates', () => {
    it('should fall back to `true` and `false` when the templates are not set', () => {
      expect(getCheckboxTemplates({})).toEqual({ checked: true, unchecked: false });
    });

    it('should return the configured templates', () => {
      expect(getCheckboxTemplates({ checkedTemplate: 'yes', uncheckedTemplate: 'no' }))
        .toEqual({ checked: 'yes', unchecked: 'no' });
    });
  });

  describe('isCheckedValue', () => {
    it('should agree with matchCheckboxTemplate', () => {
      expect(isCheckedValue('TRUE', {})).toBe(true);
      expect(isCheckedValue('False', {})).toBe(false);
      expect(isCheckedValue('Ted', {})).toBe(false);
    });
  });

  describe('matchCheckboxTemplate', () => {
    it('should match the default templates by value and by text, regardless of letter case', () => {
      expect(matchCheckboxTemplate(true, {})).toBe('checked');
      expect(matchCheckboxTemplate('true', {})).toBe('checked');
      expect(matchCheckboxTemplate('TRUE', {})).toBe('checked');
      expect(matchCheckboxTemplate(false, {})).toBe('unchecked');
      expect(matchCheckboxTemplate('False', {})).toBe('unchecked');
    });

    it('should match custom templates regardless of letter case', () => {
      const meta = { checkedTemplate: 'yes', uncheckedTemplate: 'no' };

      expect(matchCheckboxTemplate('YES', meta)).toBe('checked');
      expect(matchCheckboxTemplate('No', meta)).toBe('unchecked');
      expect(matchCheckboxTemplate(true, meta)).toBeNull();
    });

    it('should match numeric templates by their text', () => {
      const meta = { checkedTemplate: 1, uncheckedTemplate: 0 };

      expect(matchCheckboxTemplate('1', meta)).toBe('checked');
      expect(matchCheckboxTemplate(0, meta)).toBe('unchecked');
    });

    it('should return `null` for a value that matches neither template', () => {
      expect(matchCheckboxTemplate('Ted', {})).toBeNull();
      expect(matchCheckboxTemplate('yes', {})).toBeNull();
      expect(matchCheckboxTemplate('1', {})).toBeNull();
      expect(matchCheckboxTemplate('', {})).toBeNull();
      expect(matchCheckboxTemplate(null, {})).toBeNull();
    });

    it('should lowercase with the cell locale', () => {
      // Turkish lowercases a dotted capital İ to a plain "i", so "İ" matches an "i" template only
      // under the Turkish locale.
      const meta = { checkedTemplate: 'i', uncheckedTemplate: 'x' };

      expect(matchCheckboxTemplate('İ', { ...meta, locale: 'tr-TR' })).toBe('checked');
      expect(matchCheckboxTemplate('İ', { ...meta, locale: 'en-US' })).toBeNull();
    });
  });

  describe('templates that differ only in letter case', () => {
    it('should keep both states by matching either template exactly first', () => {
      const meta = { checkedTemplate: 'Y', uncheckedTemplate: 'y' };

      expect(matchCheckboxTemplate('Y', meta)).toBe('checked');
      expect(matchCheckboxTemplate('y', meta)).toBe('unchecked');
    });
  });
});
