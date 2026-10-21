import generatedSchema from './schema.generated';
import { Hooks } from '../core/hooks';
import { DEPRECATED_HOOKS } from '../core/hooks/constants';
import type { JsonSchemaObject } from './types';

/**
 * Freezes an object and everything it holds.
 *
 * @param {object} value The object to freeze.
 * @returns {object} The same object.
 */
function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }

  return value;
}

/**
 * Builds the schema node of a hook callback.
 *
 * @param {string} hookName The hook name.
 * @returns {JsonSchemaObject}
 */
function createHookNode(hookName: string): JsonSchemaObject {
  return {
    description: `The \`${hookName}\` hook callback.`,
    ...(DEPRECATED_HOOKS.has(hookName) ? { deprecated: true } : {}),
    // JSON can hold only the values Handsontable skips for a hook: `null` and `false`.
    enum: [null, false],
    'x-handsontable': { levels: ['grid'], hook: true, runtimeTypes: ['function'] },
  };
}

/**
 * Builds the published schema: the generated options plus one property per hook registered
 * when the module loads. The hooks come from the hook registry, not from the generator, so the
 * list cannot drift from what `addHook()` accepts.
 *
 * @returns {JsonSchemaObject}
 */
function buildSchema(): JsonSchemaObject {
  const properties: Record<string, JsonSchemaObject> = { ...generatedSchema.properties };

  Hooks.getSingleton().getRegistered().forEach((hookName: string) => {
    properties[hookName] ??= createHookNode(hookName);
  });

  return deepFreeze({ ...generatedSchema, properties });
}

/**
 * The JSON Schema (draft 2020-12) of the Handsontable settings: every grid option, the options of
 * a `columns` entry (`$defs.columnSettings`) and of a `cell` entry (`$defs.cellSettings`), and
 * the hooks. The object is frozen and JSON-serializable.
 *
 * A value JSON cannot hold, such as a function, is listed in the node's
 * `x-handsontable.runtimeTypes` and not in its `type`. Each option's `x-handsontable` also lists
 * the levels it is read at (`levels`), its plugin (`plugin`), and, for `type`, `editor`,
 * `renderer` and `validator`, the registry its names come from (`registry`). A JSON Schema
 * validator that rejects unknown keywords needs `x-handsontable` registered as an annotation.
 */
export const settingsSchema: JsonSchemaObject = buildSchema();
