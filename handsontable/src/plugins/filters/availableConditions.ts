import { hasOwnProperty, isPlainObject } from '../../helpers/object';

/**
 * A data type that has its own "Filter by condition" list.
 */
export type AvailableConditionsDataType = 'text' | 'numeric' | 'date' | 'intl-date' | 'intl-time' | 'intl-datetime';

/**
 * An allow-list of condition names, shown in this order. `'---------'` adds a separator.
 */
export type AvailableConditionsList = readonly string[];

/**
 * The default list for the column's data type, minus the listed condition names.
 */
export interface AvailableConditionsExclusion {
  exclude: readonly string[];
}

/**
 * One rule that applies to a single column.
 */
export type AvailableConditionsRule = AvailableConditionsList | AvailableConditionsExclusion;

/**
 * The `availableConditions` setting: one rule, or one rule per data type.
 */
export type AvailableConditions =
  AvailableConditionsRule | Partial<Record<AvailableConditionsDataType, AvailableConditionsRule>>;

/**
 * A problem found in an `availableConditions` setting, reported as a console warning.
 */
export type AvailableConditionsProblem =
  { kind: 'unknownName', name: string } |
  { kind: 'unknownDataType', dataType: string };

const EXCLUDE_KEY = 'exclude';

/**
 * Checks if the value is an array of strings.
 */
function isNameList(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every(name => typeof name === 'string');
}

/**
 * Checks if the value is an `{ exclude: string[] }` object with no other keys.
 */
function isExclusion(value: unknown): value is AvailableConditionsExclusion {
  return isPlainObject(value) &&
    Object.keys(value).length === 1 &&
    hasOwnProperty(value, EXCLUDE_KEY) &&
    isNameList(value[EXCLUDE_KEY]);
}

/**
 * Checks if a rule is an allow-list. `Array.isArray()` alone does not narrow a `readonly` array
 * out of the union.
 */
function isAllowList(rule: AvailableConditionsRule): rule is AvailableConditionsList {
  return Array.isArray(rule);
}

/**
 * Checks if the value is a single-column rule.
 */
function isRule(value: unknown): value is AvailableConditionsRule {
  return isNameList(value) || isExclusion(value);
}

/**
 * Checks if the value is a valid `availableConditions` setting.
 *
 * An object that has an `exclude` key is read as a rule, any other object as a per-type map, so a
 * per-type map cannot carry `exclude`. A per-type entry set to `undefined` keeps that type's stock
 * list. A per-type key no condition list exists for does not make the setting invalid: it is ignored,
 * and `findAvailableConditionsProblems()` reports it.
 *
 * @param {*} value The setting value.
 * @returns {boolean}
 */
export function isAvailableConditionsSetting(value: unknown): boolean {
  if (value === undefined || isRule(value)) {
    return true;
  }

  if (!isPlainObject(value) || hasOwnProperty(value, EXCLUDE_KEY)) {
    return false;
  }

  return Object.values(value).every(rule => rule === undefined || isRule(rule));
}

/**
 * Picks the rule that applies to a column of the given data type.
 *
 * @param {*} setting A valid `availableConditions` setting.
 * @param {string} dataType The data type of the column's condition list.
 * @returns {Array|object|undefined} The rule, or `undefined` when the stock list applies.
 */
export function resolveAvailableConditionsRule(
  setting: unknown,
  dataType: string
): AvailableConditionsRule | undefined {
  if (isRule(setting)) {
    return setting;
  }

  if (isPlainObject(setting) && hasOwnProperty(setting, dataType)) {
    const rule = setting[dataType];

    return isRule(rule) ? rule : undefined;
  }

  return undefined;
}

/**
 * Lists the names and per-type keys of a valid setting that match nothing.
 *
 * A name no data type offers is almost always a typo, in an allow-list and in an exclusion alike.
 * A name some other data type offers is not reported here: in an exclusion it is how one rule covers
 * columns of every type, and in an allow-list only the column it applies to can tell.
 *
 * @param {*} setting A valid `availableConditions` setting.
 * @param {object} lists The stock condition names per data type.
 * @param {string} separator The separator entry, which is not a name.
 * @returns {object[]}
 */
export function findAvailableConditionsProblems(
  setting: unknown,
  lists: Record<string, string[]>,
  separator: string,
): AvailableConditionsProblem[] {
  const problems: AvailableConditionsProblem[] = [];
  const knownNames = new Set(Object.values(lists).flat());
  const reportNames = (rule: AvailableConditionsRule) => {
    (isAllowList(rule) ? rule : rule.exclude).forEach((name) => {
      if (name !== separator && !knownNames.has(name)) {
        problems.push({ kind: 'unknownName', name });
      }
    });
  };

  if (isRule(setting)) {
    reportNames(setting);

  } else if (isPlainObject(setting)) {
    Object.entries(setting).forEach(([dataType, rule]) => {
      if (!hasOwnProperty(lists, dataType)) {
        problems.push({ kind: 'unknownDataType', dataType });
      }

      if (rule !== undefined) {
        reportNames(rule as AvailableConditionsRule);
      }
    });
  }

  return problems;
}

/**
 * Drops leading, trailing, and doubled separators.
 */
function tidySeparators(names: string[], separator: string): string[] {
  const result: string[] = [];

  names.forEach((name) => {
    if (name === separator && (result.length === 0 || result[result.length - 1] === separator)) {
      return;
    }

    result.push(name);
  });

  while (result[result.length - 1] === separator) {
    result.pop();
  }

  return result;
}

/**
 * Applies a rule to the default condition names of a data type.
 *
 * The first default name (the "none" condition) always stays first, because the condition select
 * resets to its first item. An allow-list can only pick names from the defaults; any other name is
 * dropped. Excluding a name the defaults do not have changes nothing, so a single grid-level
 * exclusion can cover columns of every type.
 *
 * @param {string[]} defaultNames The stock condition names for the data type, "none" first.
 * @param {Array|object} rule The rule to apply.
 * @param {string} separator The separator entry.
 * @returns {string[]}
 */
export function applyAvailableConditionsRule(
  defaultNames: string[],
  rule: AvailableConditionsRule,
  separator: string,
): string[] {
  const [noneName] = defaultNames;
  let names: string[];

  if (isAllowList(rule)) {
    const known = new Set(defaultNames);
    const picked = new Set<string>();

    names = rule.filter((name) => {
      if (name === separator) {
        return true;
      }

      if (!known.has(name) || picked.has(name)) {
        return false;
      }

      picked.add(name);

      return true;
    });

  } else {
    const excluded = new Set(rule.exclude);

    names = defaultNames.filter(name => name === separator || !excluded.has(name));
  }

  return tidySeparators([noneName, separator, ...names.filter(name => name !== noneName)], separator);
}

/**
 * Lists the allow-listed names a column's rule picks that its condition list does not offer.
 *
 * @param {Array|object|undefined} rule The rule that applies to the column.
 * @param {string[]} defaultNames The stock condition names of the column's list.
 * @param {string} separator The separator entry, which is not a name.
 * @returns {string[]}
 */
export function findOffListNames(
  rule: AvailableConditionsRule | undefined,
  defaultNames: string[],
  separator: string,
): string[] {
  if (rule === undefined || !isAllowList(rule)) {
    return [];
  }

  const known = new Set(defaultNames);

  return rule.filter(name => name !== separator && !known.has(name));
}
