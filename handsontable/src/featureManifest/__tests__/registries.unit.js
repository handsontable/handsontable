import { resolve } from 'path';
import { registerAllModules } from 'handsontable/registry';
import { getPlugin, getPluginsNames } from 'handsontable/plugins';
import { getRegisteredCellTypeNames } from 'handsontable/cellTypes';
import { getRegisteredEditorNames } from 'handsontable/editors';
import { getRegisteredRendererNames } from 'handsontable/renderers';
import { getRegisteredValidatorNames } from 'handsontable/validators';
import { indexEntries, loadSources, toPluginDeps, toPluginLicense } from '../../../scripts/utils/feature-manifest';

registerAllModules();

/**
 * The static checks (`test/__tests__/featureManifest.unit.js`) read the module names from the source as text.
 * These read what the registries hold at runtime, after `registerAllModules()`, so a module registered under
 * another name than its constant is caught too.
 */
describe('feature manifest against the registries', () => {
  const entries = [...indexEntries(loadSources(resolve(__dirname, '../../..'))).values()];
  const modulesOf = kind => entries.filter(entry => entry.kind === kind).map(entry => entry.module).sort();

  it.each([
    ['plugin', getPluginsNames],
    ['cell_type', getRegisteredCellTypeNames],
    ['editor', getRegisteredEditorNames],
    ['renderer', getRegisteredRendererNames],
    ['validator', getRegisteredValidatorNames],
  ])('should have one "%s" entry per registered module', (kind, getNames) => {
    // `multiSelect` is the legacy name of the `multiselect` type, registered as an alias of the same module.
    const registered = getNames().filter(name => name !== 'multiSelect');

    expect(modulesOf(kind)).toEqual([...registered].sort());
  });

  it('should give every plugin class the PLUGIN_DEPS its entry declares', () => {
    const byId = new Map(entries.map(entry => [entry.id, entry]));

    entries.filter(entry => entry.kind === 'plugin').forEach((entry) => {
      const expected = entry.enforceAtInit ? toPluginDeps(entry, byId) : undefined;

      expect({ plugin: entry.module, deps: getPlugin(entry.module).PLUGIN_DEPS })
        .toEqual({ plugin: entry.module, deps: expected });
    });
  });

  it('should give every plugin class a key can name the LICENSE its entry declares, and no other class one', () => {
    entries.filter(entry => entry.kind === 'plugin').forEach((entry) => {
      const expected = entry.licensing === 'token' ? toPluginLicense(entry) : undefined;
      const license = getPlugin(entry.module).LICENSE;

      expect({ plugin: entry.module, license }).toEqual({ plugin: entry.module, license: expected });

      if (license !== undefined) {
        expect(Object.isFrozen(license)).toBe(true);
        expect(Object.isFrozen(license.tiers)).toBe(true);
      }
    });
  });

  it('should give a subclass its own LICENSE, not its parent\'s', () => {
    expect(getPlugin('MultiColumnSorting').LICENSE.capability).toBe('feat:multi_column_sorting');
    expect(getPlugin('ColumnSorting').LICENSE.capability).toBe('feat:column_sorting');
  });
});
