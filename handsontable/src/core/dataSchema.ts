/**
 * Serializes a schema in key order, or returns `null` when it cannot be serialized.
 *
 * @param {*} schema The `dataSchema` value.
 * @returns {string|null}
 */
function serializeSchema(schema: unknown): string | null {
  try {
    return JSON.stringify(schema) ?? null;
  } catch {
    return null;
  }
}

/**
 * Checks whether an `updateSettings()` call changes the `dataSchema` option.
 *
 * A schema given as an object or an array is compared by content and key order, so an equal one that a framework
 * wrapper re-sends on every render is not a change. The key order counts because the columns of the grid follow it.
 * A function is compared by reference: it has no content to compare. A schema that cannot be serialized counts
 * as changed.
 *
 * @param {*} previous The `dataSchema` before the update.
 * @param {*} next The `dataSchema` in the update payload, `undefined` when the payload does not carry it.
 * @returns {boolean}
 */
export function isDataSchemaChanged(previous: unknown, next: unknown): boolean {
  if (next === undefined || next === previous) {
    return false;
  }

  if (typeof next === 'function' || typeof previous === 'function') {
    return true;
  }

  const serializedNext = serializeSchema(next);

  return serializedNext === null || serializedNext !== serializeSchema(previous);
}
