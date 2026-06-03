import { throwWithCause } from '../../helpers/errors';

export const conditions: Record<string, { condition: Function; descriptor: Record<string, unknown> }> = {};

/**
 * Get condition closure with pre-bound arguments.
 *
 * @param {string} name Condition name.
 * @param {Array} args Condition arguments.
 * @returns {Function}
 */
export function getCondition(name: string, args: unknown[]) {
  if (!conditions[name]) {
    throwWithCause(`Filter condition "${name}" does not exist.`);
  }

  const { condition, descriptor } = conditions[name];
  let conditionArguments = args;

  if (descriptor.inputValuesDecorator) {
    const decorator = descriptor.inputValuesDecorator as (args: unknown) => typeof conditionArguments;

    conditionArguments = decorator(conditionArguments);
  }

  type DataRow = {
    value: unknown;
    meta: {
      type?: string;
      locale?: string;
      dateFormat?: Intl.DateTimeFormatOptions;
      instance?: unknown;
      [key: string]: unknown
    };
  };

  return function(dataRow: DataRow): boolean {
    return (condition.apply(dataRow.meta.instance, [dataRow, conditionArguments]) as boolean);
  };
}

/**
 * Get condition object descriptor which defines some additional informations about this condition.
 *
 * @param {string} name Condition name.
 * @returns {object}
 */
export function getConditionDescriptor(name: string) {
  if (!conditions[name]) {
    throwWithCause(`Filter condition "${name}" does not exist.`);
  }

  return conditions[name].descriptor;
}

/**
 * Condition registerer.
 *
 * @param {string} name Condition name.
 * @param {Function} condition Condition function.
 * @param {object} descriptor Condition descriptor.
 */
export function registerCondition(name: string, condition: Function, descriptor: Record<string, unknown>) {
  descriptor.key = name;
  conditions[name] = {
    condition, descriptor
  };
}
