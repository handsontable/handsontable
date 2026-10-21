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
}

/**
 * What the generator writes next to the schema for `validateSettings()` alone. Not published.
 */
export interface GeneratedSchemaInternals {
  /**
   * The keys a settings object may hold that are not documented options (`preventWheel`,
   * `_userDefinedMetaProps`).
   */
  internalOptions: string[];
  /**
   * The keys of the plugins that ship with Handsontable. Any other registered plugin is a
   * third-party one, and its keys are accepted at every level.
   */
  builtInPlugins: string[];
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
  /**
   * `false` when `properties` lists every key the object accepts, so any other key is a mistake.
   */
  additionalProperties?: boolean;
  required?: string[];
  minimum?: number;
  'x-handsontable'?: SettingsSchemaAnnotations;
}

/**
 * What a reported problem is about. A minor release can add a code, so a `switch` over the codes
 * needs a `default` branch; the `(string & {})` member keeps such code compiling.
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
  | 'unknownDataProperty'
  | (string & {});

/**
 * How sure the check is. An `error` is a setting Handsontable ignores or cannot use. A `warning`
 * is a likely mistake that may be intended: a data property that the sampled rows do not have
 * (`unknownDataProperty`), or an option of a plugin that is off (`pluginDisabled`).
 */
export type SettingsProblemSeverity = 'error' | 'warning';

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
   * Whether the problem makes the settings invalid (`error`) or only looks like a mistake (`warning`).
   */
  severity: SettingsProblemSeverity;
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
   * `true` when no problem of the `error` severity was found. Warnings do not make settings invalid.
   */
  valid: boolean;
  /**
   * The problems found, errors and warnings, in the order of the settings object.
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
   * What the settings object is, named as in the schema's `x-handsontable.levels`: the grid
   * settings (`'grid'`, the default), one entry of `columns` (`'columns'`), the object a `cells`
   * function returns (`'cells'`), or one entry of `cell` (`'cell'`).
   */
  level?: SettingsSchemaLevel;
}
