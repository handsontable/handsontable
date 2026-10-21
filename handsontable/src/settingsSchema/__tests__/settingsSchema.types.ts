import Handsontable from 'handsontable';
import { settingsSchema, validateSettings } from 'handsontable/settingsSchema';
import type {
  JsonSchemaObject,
  SettingsProblem,
  SettingsProblemCode,
  SettingsProblemSeverity,
  SettingsSchemaLevel,
  SettingsValidationResult,
  ValidateSettingsOptions,
} from 'handsontable/settingsSchema';

const hot = new Handsontable(document.createElement('div'), {});
const options: ValidateSettingsOptions = { hot, level: 'columns' };
const result: SettingsValidationResult = validateSettings({ colHeaders: true }, options);
const problem: SettingsProblem = result.problems[0];
const code: SettingsProblemCode = problem.code;
const severity: SettingsProblemSeverity = problem.severity;
const schema: JsonSchemaObject = settingsSchema;
const level: SettingsSchemaLevel | undefined = schema.properties?.colHeaders['x-handsontable']?.levels?.[0];

validateSettings(JSON.parse('{}'));
validateSettings(null);
validateSettings({}, { level: 'grid' });
validateSettings({}, { level: 'cell' });
validateSettings({}, { level: 'cells' });
validateSettings({}, { level: level ?? 'grid' });

result.valid === true;
problem.path === 'columns[0].type';
problem.message.length > 0;
code === 'unknownCellType';
severity === 'warning';

// A code added in a minor release compiles; the known codes still complete in an editor.
const laterCode: SettingsProblemCode = 'someLaterCode';

level === 'grid';

// @ts-expect-error the level is one of the schema's level names.
validateSettings({}, { level: 'row' });
// @ts-expect-error `valid` is a boolean.
const validIsBoolean: string = result.valid;
// @ts-expect-error the severity is 'error' or 'warning'.
const unknownSeverity: SettingsProblemSeverity = 'info';
