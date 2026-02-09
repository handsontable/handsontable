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
    throw Error(`Filter condition "${name}" does not exist.`);
  }

  const { condition, descriptor } = conditions[name];
  let conditionArguments = args;

  if (descriptor.inputValuesDecorator) {
    conditionArguments = (descriptor.inputValuesDecorator as Function)(conditionArguments);
  }

  return function(dataRow: { value: unknown; meta: { type?: string; locale?: string; dateFormat?: string; instance?: unknown; [key: string]: unknown } }) {
    return condition.apply(dataRow.meta.instance, [].concat([dataRow], [conditionArguments]));
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
    throw Error(`Filter condition "${name}" does not exist.`);
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
