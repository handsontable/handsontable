import { SEPARATOR } from '../contextMenu/predefinedItems';
import { hasOwnProperty, isPlainObject } from '../../helpers/object';

/**
 * An allow-list of condition names, shown in this order. `'---------'` adds a separator.
 */
export type AvailableConditionsList = string[];

/**
 * The default list for the column's data type, minus the listed condition names.
 */
export interface AvailableConditionsExclusion {
  exclude: string[];
}

/**
 * One rule that applies to a single column.
 */
export type AvailableConditionsRule = AvailableConditionsList | AvailableConditionsExclusion;

/**
 * The `availableConditions` setting: one rule, or one rule per data type.
 */
export type AvailableConditions = AvailableConditionsRule | { [dataType: string]: AvailableConditionsRule };

const EXCLUDE_KEY = 'exclude';

/**
 * Checks if the value is an array of strings.
 */
function isNameList(value: unknown): value is string[] {
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
 * Checks if the value is a single-column rule.
 */
function isRule(value: unknown): value is AvailableConditionsRule {
  return isNameList(value) || isExclusion(value);
}

/**
 * Checks if the value is a valid `availableConditions` setting.
 *
 * An object that has an `exclude` key is read as a rule, any other object as a per-type map. So a
 * per-type map cannot carry `exclude`, and its keys must be data types the condition lists exist for.
 *
 * @param {*} value The setting value.
 * @param {string[]} dataTypes The data types that have their own condition list.
 * @returns {boolean}
 */
export function isAvailableConditionsSetting(value: unknown, dataTypes: string[]): boolean {
  if (value === undefined || isRule(value)) {
    return true;
  }

  if (!isPlainObject(value) || hasOwnProperty(value, EXCLUDE_KEY)) {
    return false;
  }

  return Object.entries(value)
    .every(([dataType, rule]) => dataTypes.includes(dataType) && isRule(rule));
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
 * Drops leading, trailing, and doubled separators.
 */
function tidySeparators(names: string[]): string[] {
  const result: string[] = [];

  names.forEach((name) => {
    if (name === SEPARATOR && (result.length === 0 || result[result.length - 1] === SEPARATOR)) {
      return;
    }

    result.push(name);
  });

  while (result[result.length - 1] === SEPARATOR) {
    result.pop();
  }

  return result;
}

/**
 * Applies a rule to the default condition names of a data type.
 *
 * The first default name (the "none" condition) always stays first, because the condition select
 * resets to its first item. An allow-list can only pick names from the defaults; any other name is
 * dropped and reported through `onUnknownName`. Excluding a name the defaults do not have is not
 * reported, so a single grid-level exclusion can cover columns of every type.
 *
 * @param {string[]} defaultNames The stock condition names for the data type, "none" first.
 * @param {Array|object} rule The rule to apply.
 * @param {Function} [onUnknownName] Called with each allow-listed name the defaults do not have.
 * @returns {string[]}
 */
export function applyAvailableConditionsRule(
  defaultNames: string[],
  rule: AvailableConditionsRule,
  onUnknownName: (name: string) => void = () => {},
): string[] {
  const [noneName] = defaultNames;
  let names: string[];

  if (Array.isArray(rule)) {
    const known = new Set(defaultNames);
    const picked = new Set<string>();

    names = rule.filter((name) => {
      if (name === SEPARATOR) {
        return true;
      }

      if (!known.has(name)) {
        onUnknownName(name);

        return false;
      }

      if (picked.has(name)) {
        return false;
      }

      picked.add(name);

      return true;
    });

  } else {
    const excluded = new Set(rule.exclude);

    names = defaultNames.filter(name => name === SEPARATOR || !excluded.has(name));
  }

  return tidySeparators([noneName, SEPARATOR, ...names.filter(name => name !== noneName)]);
}
