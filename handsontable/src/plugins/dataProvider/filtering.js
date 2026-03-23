/**
 * Deep-clones a filter condition stack (for save/restore). Same shape as Filters exportConditions.
 *
 * @param {Array} stack Condition stack from getFiltersConditions.
 * @returns {Array} Cloned stack.
 */
export function cloneFilterConditionsStack(stack) {
  return stack.map(s => ({
    column: s.column,
    operation: s.operation,
    conditions: (s.conditions || []).map(c => ({
      name: c.name,
      args: Array.isArray(c.args) ? [...c.args] : [],
    })),
  }));
}

/**
 * Converts Filters plugin condition stack (physical column indexes) to query filters (prop = column data key).
 * Expects the same shape as [[Filters#exportConditions]] returns.
 *
 * @param {Core} hot Handsontable instance.
 * @param {Array} conditionsStack Array of { column, operation, conditions } (same shape as exportConditions).
 * @returns {Array<{ prop: string, operation: 'conjunction'|'disjunction', conditions: Array<{ name?: string, args: Array<*> }> }>|null} Payload or null when empty.
 */
export function conditionsStackToFiltersPayload(hot, conditionsStack) {
  if (!Array.isArray(conditionsStack) || conditionsStack.length === 0) {
    return null;
  }

  const payload = [];

  for (let i = 0; i < conditionsStack.length; i++) {
    const stack = conditionsStack[i];
    const visualCol = hot.toVisualColumn(stack.column);
    const prop = hot.colToProp(visualCol);

    if (prop === null || prop === undefined) {
      continue;
    }

    payload.push({
      prop: String(prop),
      operation: stack.operation,
      conditions: stack.conditions.map(c => ({
        name: c.name,
        args: Array.isArray(c.args) ? [...c.args] : [],
      })),
    });
  }

  return payload.length === 0 ? null : payload;
}

/**
 * Snapshot of current filter conditions for persistence across loadData, or an empty array.
 *
 * @param {Core} hot Handsontable instance.
 * @returns {Array}
 */
export function captureFilterConditionsSnapshot(hot) {
  const conditions = hot.runHooks('getFiltersConditions');

  return Array.isArray(conditions) && conditions.length > 0
    ? cloneFilterConditionsStack(conditions)
    : [];
}

/**
 * Restores filter UI from a snapshot when non-empty.
 *
 * @param {Core} hot Handsontable instance.
 * @param {Array} snapshot Cloned conditions from [[captureFilterConditionsSnapshot]].
 * @returns {void}
 */
export function restoreFilterConditionsFromSnapshot(hot, snapshot) {
  if (snapshot.length > 0) {
    hot.runHooks('setFiltersConditions', snapshot);
  }
}
