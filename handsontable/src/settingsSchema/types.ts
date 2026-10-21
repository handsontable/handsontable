import type { HotInstance } from '../core/types';

/**
 * The levels an option can be set at: the grid settings, an entry of `columns`, the object a
 * `cells` function returns, and an entry of `cell`.
 */
export type SettingsSchemaLevel = 'grid' | 'columns' | 'cells' | 'cell';

/**
 * The JSON types a schema node names.
 */
export type JsonSchemaType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null';

/**
 * The Handsontable-specific annotations of a schema node, under the `x-handsontable` keyword.
 */
export interface SettingsSchemaAnnotations {
  /**
   * The levels the option is read at. Set on the options only.
   */
  levels?: SettingsSchemaLevel[];
  /**
   * The plugin the option belongs to, by its registered name (`Filters`).
   */
  plugin?: string;
  /**
   * The version the option was added in.
   */
  since?: string;
  /**
   * The registry a string value names an item of.
   */
  registry?: 'cellType' | 'editor' | 'renderer' | 'validator';
  /**
   * The runtime types the value may also have, which JSON cannot hold: `function`, `RegExp`,
   * `HTMLElement`, `Date`, `Map`, `Set`, or `object` (an instance of a class).
   */
  runtimeTypes?: string[];
  /**
   * `true` for a hook callback.
   */
  hook?: boolean;
  /**
   * On the root: the keys a settings object may hold that are not documented options.
   */
  internalOptions?: string[];
}

/**
 * A node of the settings JSON Schema (draft 2020-12): the subset of keywords the schema uses.
 */
export interface JsonSchemaObject {
  $schema?: string;
  $id?: string;
  $ref?: string;
  $defs?: Record<string, JsonSchemaObject>;
  title?: string;
  description?: string;
  deprecated?: boolean;
  type?: JsonSchemaType | JsonSchemaType[];
  enum?: unknown[];
  anyOf?: JsonSchemaObject[];
  not?: JsonSchemaObject;
  items?: JsonSchemaObject;
  properties?: Record<string, JsonSchemaObject>;
  required?: string[];
  minimum?: number;
  'x-handsontable'?: SettingsSchemaAnnotations;
}

/**
 * What a reported problem is about.
 */
export type SettingsProblemCode =
  | 'invalidSettings'
  | 'unknownOption'
  | 'wrongLevel'
  | 'invalidType'
  | 'invalidValue'
  | 'unknownCellType'
  | 'unknownEditor'
  | 'unknownRenderer'
  | 'unknownValidator'
  | 'pluginNotRegistered'
  | 'pluginDisabled'
  | 'unknownDataProperty';

/**
 * One problem `validateSettings()` found.
 */
export interface SettingsProblem {
  /**
   * Where the problem is, such as `columns[3].type`. An empty string means the whole object.
   */
  path: string;
  /**
   * What the problem is about.
   */
  code: SettingsProblemCode;
  /**
   * A sentence that says what is wrong, for a person or a model to act on.
   */
  message: string;
}

/**
 * The result of `validateSettings()`.
 */
export interface SettingsValidationResult {
  /**
   * `true` when no problem was found.
   */
  valid: boolean;
  /**
   * The problems found, in the order of the settings object.
   */
  problems: SettingsProblem[];
}

/**
 * The options of `validateSettings()`.
 */
export interface ValidateSettingsOptions {
  /**
   * The instance the settings are meant for. Its data rows are used to check `columns[].data`
   * when the settings carry no `data`, and its settings decide whether a plugin is on when the
   * settings do not say, as for an `updateSettings()` payload.
   */
  hot?: HotInstance;
  /**
   * What the settings object is: the grid settings (default), one entry of `columns`, or the
   * settings of one cell.
   */
  level?: 'grid' | 'column' | 'cell';
}
