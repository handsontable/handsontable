/**
 * The JSON Schema of the Handsontable settings, and a validator that checks a settings object
 * against it and against what is registered on the page.
 *
 * ```js
 * import { settingsSchema, validateSettings } from 'handsontable/settingsSchema';
 * ```
 */
export { settingsSchema } from './settingsSchema/schema';
export { validateSettings } from './settingsSchema/validateSettings';
export type {
  JsonSchemaObject,
  JsonSchemaType,
  SettingsProblem,
  SettingsProblemCode,
  SettingsSchemaAnnotations,
  SettingsSchemaLevel,
  SettingsValidationResult,
  ValidateSettingsOptions,
} from './settingsSchema/types';
