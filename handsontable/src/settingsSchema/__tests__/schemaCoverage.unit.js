import 'handsontable';
import { settingsSchema, validateSettings } from 'handsontable/settingsSchema';
import metaSchemaFactory from 'handsontable/dataMap/metaManager/metaSchema';
import { Hooks } from 'handsontable/core/hooks';
import { internals } from 'handsontable/settingsSchema/schema.generated';

// The schema is generated from `metaSchema.ts` and the settings types by
// `scripts/generate-settings-schema.mjs` on every build and test run. These cases fail when the
// generator leaves an option or a hook out, or describes a default as invalid.
describe('settingsSchema coverage', () => {
  const defaults = metaSchemaFactory();
  const { internalOptions } = internals;

  it('should describe every option of metaSchema.ts', () => {
    const missing = Object.keys(defaults)
      .filter(key => settingsSchema.properties[key] === undefined && !internalOptions.includes(key));

    expect(missing).toEqual([]);
  });

  it('should list only real keys as internal', () => {
    expect(internalOptions.length).toBeGreaterThan(0);
    expect(internalOptions.filter(key => !Object.prototype.hasOwnProperty.call(defaults, key))).toEqual([]);
  });

  it('should give the switch of every built-in plugin its plugin', () => {
    const switches = ['moveCells', 'selectionHandles', 'dataProvider', 'fillHandle', 'filters', 'undo'];

    expect(switches.map(key => settingsSchema.properties[key]['x-handsontable'].plugin))
      .toEqual(['MoveCells', 'SelectionHandles', 'DataProvider', 'Autofill', 'Filters', 'UndoRedo']);
  });

  it('should describe every registered hook', () => {
    const missing = Hooks.getSingleton().getRegistered()
      .filter(hookName => settingsSchema.properties[hookName]?.['x-handsontable']?.hook !== true);

    expect(missing).toEqual([]);
  });

  it('should give every option its levels', () => {
    const withoutLevels = Object.keys(settingsSchema.properties)
      .filter(key => !(settingsSchema.properties[key]['x-handsontable']?.levels?.length > 0));

    expect(withoutLevels).toEqual([]);
  });

  it('should accept the default value of every option', () => {
    const rejected = Object.keys(defaults)
      .filter(key => !internalOptions.includes(key))
      .flatMap(key => validateSettings({ [key]: defaults[key] }).problems)
      .filter(({ code }) => code === 'invalidType' || code === 'invalidValue');

    expect(rejected).toEqual([]);
  });

  it('should accept the default of every column-level option inside `columns`', () => {
    const columnOptions = Object.keys(settingsSchema.$defs.columnSettings.properties);
    const rejected = validateSettings({
      columns: [Object.fromEntries(columnOptions
        .filter(key => !['data', 'title'].includes(key))
        .map(key => [key, defaults[key]]))],
    }).problems.filter(({ code }) => code === 'invalidType' || code === 'invalidValue' || code === 'wrongLevel');

    expect(rejected).toEqual([]);
  });
});
