import getOptionsList, { TYPES } from 'handsontable/plugins/filters/constants';
import {
  applyAvailableConditionsRule,
  isAvailableConditionsSetting,
  resolveAvailableConditionsRule,
} from 'handsontable/plugins/filters/availableConditions';

const SEPARATOR = '---------';
const DATA_TYPES = Object.keys(TYPES);

/**
 * The list the "Filter by condition" select would show, as condition keys and separators.
 */
function listKeys(type: string, setting?: unknown, onUnknownName?: (name: string, listType: string) => void) {
  return getOptionsList(type, setting, onUnknownName)
    .map(item => (item.name === SEPARATOR ? SEPARATOR : item.key));
}

describe('Filters -> availableConditions', () => {
  describe('isAvailableConditionsSetting', () => {
    it('should accept the three documented shapes', () => {
      expect(isAvailableConditionsSetting(undefined, DATA_TYPES)).toBe(true);
      expect(isAvailableConditionsSetting([], DATA_TYPES)).toBe(true);
      expect(isAvailableConditionsSetting(['eq', SEPARATOR, 'gt'], DATA_TYPES)).toBe(true);
      expect(isAvailableConditionsSetting({ exclude: ['not_between'] }, DATA_TYPES)).toBe(true);
      expect(isAvailableConditionsSetting({
        numeric: { exclude: ['not_between'] },
        text: ['contains', 'begins_with'],
        'intl-date': [],
      }, DATA_TYPES)).toBe(true);
    });

    it('should reject values that are not one of those shapes', () => {
      expect(isAvailableConditionsSetting(true, DATA_TYPES)).toBe(false);
      // Kept free on purpose: it can mean "hide the Filter by condition section" later without a break.
      expect(isAvailableConditionsSetting(false, DATA_TYPES)).toBe(false);
      expect(isAvailableConditionsSetting('eq', DATA_TYPES)).toBe(false);
      expect(isAvailableConditionsSetting(null, DATA_TYPES)).toBe(false);
      expect(isAvailableConditionsSetting(['eq', 1], DATA_TYPES)).toBe(false);
      expect(isAvailableConditionsSetting({ exclude: 'eq' }, DATA_TYPES)).toBe(false);
      expect(isAvailableConditionsSetting({ include: ['eq'] }, DATA_TYPES)).toBe(false);
    });

    it('should reject a per-type map that mixes in `exclude`, an unknown type, or a nested map', () => {
      // An object with `exclude` is read as a rule, so a per-type map cannot also carry one.
      expect(isAvailableConditionsSetting({ exclude: ['eq'], numeric: ['gt'] }, DATA_TYPES)).toBe(false);
      expect(isAvailableConditionsSetting({ dropdown: ['eq'] }, DATA_TYPES)).toBe(false);
      expect(isAvailableConditionsSetting({ numeric: { text: ['eq'] } }, DATA_TYPES)).toBe(false);
    });
  });

  describe('resolveAvailableConditionsRule', () => {
    it('should return a rule as is, for every data type', () => {
      const rule = { exclude: ['eq'] };

      expect(resolveAvailableConditionsRule(rule, 'numeric')).toBe(rule);
      expect(resolveAvailableConditionsRule(rule, 'text')).toBe(rule);
    });

    it('should pick the entry of a per-type map, and nothing for a type the map leaves out', () => {
      const setting = { numeric: ['gt'], text: { exclude: ['contains'] } };

      expect(resolveAvailableConditionsRule(setting, 'numeric')).toEqual(['gt']);
      expect(resolveAvailableConditionsRule(setting, 'text')).toEqual({ exclude: ['contains'] });
      expect(resolveAvailableConditionsRule(setting, 'date')).toBeUndefined();
      expect(resolveAvailableConditionsRule(undefined, 'date')).toBeUndefined();
    });
  });

  describe('getOptionsList', () => {
    it('should return the stock list when no setting applies', () => {
      expect(listKeys('numeric')).toEqual(TYPES.numeric);
      expect(listKeys('numeric', { text: ['eq'] })).toEqual(TYPES.numeric);
    });

    it('should drop the excluded conditions and keep the rest in the stock order', () => {
      expect(listKeys('numeric', { exclude: ['not_between'] })).toEqual([
        'none', SEPARATOR,
        'empty', 'not_empty', SEPARATOR,
        'eq', 'neq', SEPARATOR,
        'gt', 'gte', 'lt', 'lte', 'between',
      ]);
    });

    it('should drop the separators an exclusion leaves at the end or side by side', () => {
      expect(listKeys('text', { exclude: ['eq', 'neq', 'contains', 'not_contains'] })).toEqual([
        'none', SEPARATOR,
        'empty', 'not_empty', SEPARATOR,
        'begins_with', 'ends_with',
      ]);
    });

    it('should show an allow-list in the given order, after "none"', () => {
      expect(listKeys('text', ['eq', 'neq', SEPARATOR, 'empty', 'not_empty'])).toEqual([
        'none', SEPARATOR,
        'eq', 'neq', SEPARATOR,
        'empty', 'not_empty',
      ]);
    });

    it('should keep "none" first even when an allow-list names it elsewhere or leaves it out', () => {
      expect(listKeys('numeric', ['gt', 'none', 'lt'])).toEqual(['none', SEPARATOR, 'gt', 'lt']);
      expect(listKeys('numeric', { exclude: ['none'] })[0]).toBe('none');
    });

    it('should show only "none" for an empty allow-list', () => {
      expect(listKeys('numeric', [])).toEqual(['none']);
      expect(listKeys('numeric', [SEPARATOR, SEPARATOR])).toEqual(['none']);
    });

    it('should list a condition named twice only once', () => {
      expect(listKeys('numeric', ['gt', 'gt', 'lt'])).toEqual(['none', SEPARATOR, 'gt', 'lt']);
    });

    it('should leave out, and report, allow-listed names the data type does not offer', () => {
      const unknown: string[][] = [];

      expect(listKeys('numeric', ['gt', 'begins_with', 'no_such_condition'], (name, listType) => {
        unknown.push([name, listType]);
      })).toEqual(['none', SEPARATOR, 'gt']);
      expect(unknown).toEqual([
        ['begins_with', 'numeric'],
        ['no_such_condition', 'numeric'],
      ]);
    });

    it('should not report excluded names the data type does not offer', () => {
      // One grid-level exclusion is meant to cover every column, so a name only some types offer
      // must not warn on the others.
      const onUnknownName = jest.fn();

      expect(listKeys('text', { exclude: ['not_between'] }, onUnknownName)).toEqual(TYPES.text);
      expect(onUnknownName).not.toHaveBeenCalled();
    });

    it('should apply a per-type entry by the list the column type falls back to', () => {
      // A type with no list of its own (`dropdown`, a custom type, `mixed`) uses the text list, so
      // it follows the `text` entry.
      expect(listKeys('dropdown', { text: ['contains'] })).toEqual(['none', SEPARATOR, 'contains']);
      expect(listKeys('intl-date', {
        'intl-date': { exclude: ['intl_date_today', 'intl_date_tomorrow', 'intl_date_yesterday'] },
      })).toEqual([
        'none', SEPARATOR,
        'empty', 'not_empty', SEPARATOR,
        'eq', 'neq', SEPARATOR,
        'intl_date_before', 'intl_date_before_or_equal', 'intl_date_after',
        'intl_date_after_or_equal', 'intl_date_between',
      ]);
    });

    it('should return fresh descriptor copies, never the registered ones', () => {
      const [none] = getOptionsList('numeric', ['gt']);

      none.name = 'changed';

      expect(getOptionsList('numeric', ['gt'])[0].name).not.toBe('changed');
    });
  });

  describe('applyAvailableConditionsRule', () => {
    it('should not change the default list it was given', () => {
      const defaults = [...TYPES.numeric];

      applyAvailableConditionsRule(defaults, { exclude: ['gt'] });
      applyAvailableConditionsRule(defaults, ['lt']);

      expect(defaults).toEqual(TYPES.numeric);
    });
  });
});
