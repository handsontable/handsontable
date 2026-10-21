import Handsontable from 'handsontable';
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

  describe('closed settings objects', () => {
    /**
     * Returns the `additionalProperties: false` object branches of an option node, by path.
     *
     * @param {object} node The schema node.
     * @param {string} path The node's path.
     * @returns {Array<[string, object]>}
     */
    function findClosed(node, path) {
      const branches = node.anyOf ?? [node];

      return branches.flatMap(branch => [
        ...(branch.additionalProperties === false ? [[path, branch]] : []),
        ...Object.entries(branch.properties ?? {}).flatMap(([key, child]) => findClosed(child, `${path}.${key}`)),
        ...(branch.items ? findClosed(branch.items, `${path}[]`) : []),
      ]);
    }

    const closed = Object.fromEntries(Object.entries(settingsSchema.properties)
      .flatMap(([key, node]) => findClosed(node, key)));

    it('should close the plugin options whose types list every key', () => {
      // The docs guide names the same options under "Known limitations"; keep the two in step.
      expect(Object.keys(closed).filter(path => !path.includes('.') && !path.includes('[')).sort()).toEqual([
        'asyncValues', 'autoLink', 'dataProvider', 'dragToScroll', 'dropdownMenu', 'fillHandle', 'filters',
        'manualColumnFreeze', 'pagination', 'rowSelection', 'sheetsBar',
      ]);
    });

    it('should close only options of a plugin', () => {
      const withoutPlugin = Object.keys(closed)
        .filter(path => settingsSchema.properties[path.split(/[.[]/)[0]]['x-handsontable'].plugin === undefined);

      expect(withoutPlugin).toEqual([]);
    });

    it('should list the keys the plugin itself declares', () => {
      const topLevel = Object.entries(closed).filter(([path]) => !path.includes('.') && !path.includes('['));
      // DropdownMenu declares no defaults: its keys are the ones the plugin reads from the object.
      const declared = { dropdownMenu: ['callback', 'items', 'uiContainer'] };

      topLevel.forEach(([path, branch]) => {
        const pluginName = settingsSchema.properties[path]['x-handsontable'].plugin;
        const pluginDefaults = Handsontable.plugins[pluginName].DEFAULT_SETTINGS;
        const expected = declared[path] ?? Object.keys(pluginDefaults);

        expect([path, Object.keys(branch.properties).sort()]).toEqual([path, [...expected].sort()]);
      });
    });

    it('should close the column-level filters on the one key the plugin reads per column', () => {
      const branches = settingsSchema.$defs.columnSettings.properties.filters.anyOf;
      const object = branches.find(branch => branch.type === 'object');

      expect(object.additionalProperties).toBe(false);
      expect(Object.keys(object.properties)).toEqual(['availableConditions']);
    });
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
