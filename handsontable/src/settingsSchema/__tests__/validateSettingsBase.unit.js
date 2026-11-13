import 'handsontable/base';
import { validateSettings } from 'handsontable/settingsSchema';
import { registerPlugin } from 'handsontable/plugins/registry';
import { Filters } from 'handsontable/plugins/filters';

// The tree-shakeable `handsontable/base` registers no plugin and only the `text` cell type, so
// this file checks what the full build registers and a page using `base` may not.
describe('validateSettings with handsontable/base', () => {
  it('should report an option of a plugin that is not registered', () => {
    expect(validateSettings({ dropdownMenu: true, filters: { searchMode: 'apply' } }).problems).toEqual([
      {
        path: 'dropdownMenu',
        code: 'pluginNotRegistered',
        severity: 'error',
        message: '\'dropdownMenu\' has no effect: the DropdownMenu plugin is not registered.',
      },
      {
        path: 'filters',
        code: 'pluginNotRegistered',
        severity: 'error',
        message: '\'filters\' has no effect: the Filters plugin is not registered.',
      },
    ]);
  });

  it('should report a missing plugin next to a problem inside its settings', () => {
    expect(validateSettings({ filters: { searchMode: 42 } }).problems.map(({ path, code }) => ({ path, code })))
      .toEqual([
        { path: 'filters.searchMode', code: 'invalidType' },
        { path: 'filters', code: 'pluginNotRegistered' },
      ]);
  });

  it('should not report a plugin option that turns the plugin off', () => {
    expect(validateSettings({ dropdownMenu: false, filters: undefined }).problems).toEqual([]);
  });

  it('should report a cell type that is not registered', () => {
    expect(validateSettings({ type: 'numeric' }).problems).toEqual([
      {
        path: 'type',
        code: 'unknownCellType',
        severity: 'error',
        message: '\'numeric\' is not a registered cell type.',
      },
    ]);
  });

  it('should see a plugin registered after the module loaded', () => {
    registerPlugin(Filters);

    expect(validateSettings({ filters: true }).problems).toEqual([]);
  });
});
