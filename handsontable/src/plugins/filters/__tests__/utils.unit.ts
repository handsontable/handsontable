import { BAD_VALUE_TEXT } from 'handsontable/helpers/constants';
import {
  intersectValues,
  isBlankFilterListValue,
  toEmptyString,
  toVisualValue,
} from 'handsontable/plugins/filters/utils';
import { valueFormatter as dateValueFormatter } from 'handsontable/renderers/dateRenderer/dateRenderer';
import { valueFormatter as passwordValueFormatter } from 'handsontable/renderers/passwordRenderer/passwordRenderer';

describe('Filters utils', () => {
  describe('isBlankFilterListValue', () => {
    it('should be true only for the empty-string bucket after toEmptyString', () => {
      expect(isBlankFilterListValue('')).toBe(true);
      expect(isBlankFilterListValue(toEmptyString(null))).toBe(true);
      expect(isBlankFilterListValue(toEmptyString(undefined))).toBe(true);

      expect(isBlankFilterListValue('ab')).toBe(false);
      expect(isBlankFilterListValue('(Blank cells)')).toBe(false);
      expect(isBlankFilterListValue(0)).toBe(false);
      expect(isBlankFilterListValue(false)).toBe(false);
    });
  });

  describe('Filter-by-value blank-cell display formatting', () => {
    const blankLabel = toVisualValue('', 'Blank cells');

    it('should keep the (Blank cells) label instead of hashing it', () => {
      const items = intersectValues(['', 'ab'], ['', 'ab'], 'Blank cells');
      const meta = { hashSymbol: '*' };

      expect(blankLabel).toBe('(Blank cells)');
      expect(passwordValueFormatter(blankLabel, meta)).toBe('*************');
      expect(passwordValueFormatter(blankLabel, { hashLength: 4, hashSymbol: '#' })).toBe('####');

      const displayed = items.map((item) => {
        if (isBlankFilterListValue(item.value)) {
          return item.visualValue;
        }

        return passwordValueFormatter(item.visualValue, meta);
      });

      expect(displayed).toEqual(['(Blank cells)', '**']);
    });

    it('should keep the (Blank cells) label instead of turning it into #bad-value#', () => {
      const items = intersectValues(['', '2020-01-15'], ['', '2020-01-15'], 'Blank cells');

      expect(dateValueFormatter(blankLabel, {})).toBe(BAD_VALUE_TEXT);

      const displayed = items.map((item) => {
        if (isBlankFilterListValue(item.value)) {
          return item.visualValue;
        }

        return dateValueFormatter(item.visualValue, {});
      });

      expect(displayed[0]).toBe('(Blank cells)');
      expect(displayed[1]).not.toBe(BAD_VALUE_TEXT);
    });
  });
});
