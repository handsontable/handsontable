import getOptionsList, { TYPES, getConditionListType } from 'handsontable/plugins/filters/constants';
import {
  applyAvailableConditionsRule,
  findAvailableConditionsProblems,
  findOffListNames,
  isAvailableConditionsSetting,
  resolveAvailableConditionsRule,
} from 'handsontable/plugins/filters/availableConditions';

const SEPARATOR = '---------';

/**
 * The list the "Filter by condition" select would show, as condition keys and separators.
 */
function listKeys(type: string, setting?: unknown) {
  return getOptionsList(type, setting)
    .map(item => (item.name === SEPARATOR ? SEPARATOR : item.key));
}

describe('Filters -> availableConditions', () => {
  describe('isAvailableConditionsSetting', () => {
    it('should accept the three documented shapes', () => {
      expect(isAvailableConditionsSetting(undefined)).toBe(true);
      expect(isAvailableConditionsSetting([])).toBe(true);
      expect(isAvailableConditionsSetting(['eq', SEPARATOR, 'gt'])).toBe(true);
      expect(isAvailableConditionsSetting({ exclude: ['not_between'] })).toBe(true);
      expect(isAvailableConditionsSetting({
        numeric: { exclude: ['not_between'] },
        text: ['contains', 'begins_with'],
        'intl-date': [],
      })).toBe(true);
    });

    it('should reject values that are not one of those shapes', () => {
      expect(isAvailableConditionsSetting(true)).toBe(false);
      // Kept free on purpose: it can mean "hide the Filter by condition section" later without a break.
      expect(isAvailableConditionsSetting(false)).toBe(false);
      expect(isAvailableConditionsSetting('eq')).toBe(false);
      expect(isAvailableConditionsSetting(null)).toBe(false);
      expect(isAvailableConditionsSetting(['eq', 1])).toBe(false);
      expect(isAvailableConditionsSetting({ exclude: 'eq' })).toBe(false);
    });

    it('should reject a per-type map that mixes in `exclude`, or holds a nested map', () => {
      // An object with `exclude` is read as a rule, so a per-type map cannot also carry one.
      expect(isAvailableConditionsSetting({ exclude: ['eq'], numeric: ['gt'] })).toBe(false);
      expect(isAvailableConditionsSetting({ numeric: { text: ['eq'] } })).toBe(false);
    });

    it('should accept a per-type key no list exists for, so the valid entries next to it still apply', () => {
      // The key itself is ignored and reported by `findAvailableConditionsProblems()`; rejecting the
      // whole setting would silently drop the valid entries too.
      expect(isAvailableConditionsSetting({ numeric: ['gt'], dropdown: ['eq'] })).toBe(true);
      // `include` is not a rule key, so this reads as a per-type map with one unknown key.
      expect(isAvailableConditionsSetting({ include: ['eq'] })).toBe(true);
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

  describe('getConditionListType', () => {
    it('should keep a type that has its own list, and map any other type to text', () => {
      expect(getConditionListType('numeric')).toBe('numeric');
      expect(getConditionListType('intl-date')).toBe('intl-date');
      expect(getConditionListType('dropdown')).toBe('text');
      expect(getConditionListType('mixed')).toBe('text');
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

    it('should leave out allow-listed names the data type does not offer', () => {
      expect(listKeys('numeric', ['gt', 'begins_with', 'no_such_condition'])).toEqual(['none', SEPARATOR, 'gt']);
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

  describe('findAvailableConditionsProblems', () => {
    it('should report names no data type offers, in allow-lists and exclusions alike', () => {
      expect(findAvailableConditionsProblems(['eq', 'eqq', SEPARATOR], TYPES, SEPARATOR))
        .toEqual([{ kind: 'unknownName', name: 'eqq' }]);
      expect(findAvailableConditionsProblems({ numeric: { exclude: ['not_betwen'] } }, TYPES, SEPARATOR))
        .toEqual([{ kind: 'unknownName', name: 'not_betwen' }]);
    });

    it('should not report a name that another data type offers', () => {
      // One grid-level exclusion is meant to cover every column, so a name only some types offer
      // is not a mistake.
      expect(findAvailableConditionsProblems({ exclude: ['not_between', 'intl_date_today'] }, TYPES, SEPARATOR))
        .toEqual([]);
    });

    it('should report a per-type key no list exists for', () => {
      expect(findAvailableConditionsProblems({ numeric: ['gt'], dropdown: ['eq'] }, TYPES, SEPARATOR))
        .toEqual([{ kind: 'unknownDataType', dataType: 'dropdown' }]);
    });

    it('should report nothing for no setting', () => {
      expect(findAvailableConditionsProblems(undefined, TYPES, SEPARATOR)).toEqual([]);
    });
  });

  describe('findOffListNames', () => {
    it('should list the allow-listed names the list does not offer, and nothing for an exclusion', () => {
      expect(findOffListNames(['gt', 'contains', SEPARATOR, 'eq'], TYPES.numeric, SEPARATOR)).toEqual(['contains']);
      expect(findOffListNames({ exclude: ['contains'] }, TYPES.numeric, SEPARATOR)).toEqual([]);
      expect(findOffListNames(undefined, TYPES.numeric, SEPARATOR)).toEqual([]);
    });
  });

  describe('applyAvailableConditionsRule', () => {
    it('should not change the default list it was given', () => {
      const defaults = [...TYPES.numeric];

      applyAvailableConditionsRule(defaults, { exclude: ['gt'] }, SEPARATOR);
      applyAvailableConditionsRule(defaults, ['lt'], SEPARATOR);

      expect(defaults).toEqual(TYPES.numeric);
    });
  });
});
