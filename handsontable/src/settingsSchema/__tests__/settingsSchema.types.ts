import Handsontable from 'handsontable';
import { settingsSchema, validateSettings } from 'handsontable/settingsSchema';
import type {
  JsonSchemaObject,
  SettingsProblem,
  SettingsProblemCode,
  SettingsSchemaLevel,
  SettingsValidationResult,
  ValidateSettingsOptions,
} from 'handsontable/settingsSchema';

const hot = new Handsontable(document.createElement('div'), {});
const options: ValidateSettingsOptions = { hot, level: 'column' };
const result: SettingsValidationResult = validateSettings({ colHeaders: true }, options);
const problem: SettingsProblem = result.problems[0];
const code: SettingsProblemCode = problem.code;
const schema: JsonSchemaObject = settingsSchema;
const level: SettingsSchemaLevel | undefined = schema.properties?.colHeaders['x-handsontable']?.levels?.[0];

validateSettings(JSON.parse('{}'));
validateSettings(null);
validateSettings({}, { level: 'grid' });
validateSettings({}, { level: 'cell' });

result.valid === true;
problem.path === 'columns[0].type';
problem.message.length > 0;
code === 'unknownCellType';
level === 'grid';

// @ts-expect-error the level is one of three names.
validateSettings({}, { level: 'row' });
// @ts-expect-error `valid` is a boolean.
const validIsBoolean: string = result.valid;
// @ts-expect-error there is no such problem code.
const unknownCode: SettingsProblemCode = 'notACode';
