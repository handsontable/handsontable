import Handsontable from 'handsontable';

const hot = new Handsontable(document.querySelector('#grid'), { data: [[1]], afterChange: logChange });

// TODO(handsontable-codemod 19.0.0/hook-set-to-null): Leave the hook out of the settings, or pass the callback again, if it has to keep running. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#a-hook-set-to-null-through-updatesettings-is-removed
hot.updateSettings({ afterChange: null });
// TODO(handsontable-codemod 19.0.0/hook-set-to-null): Leave the hook out of the settings, or pass the callback again, if it has to keep running. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#a-hook-set-to-null-through-updatesettings-is-removed
hot.updateSettings({ beforeKeyDown: tracking ? onKey : null });
// TODO(handsontable-codemod 19.0.0/hook-set-to-null): Leave the hook out of the settings, or pass the callback again, if it has to keep running. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#a-hook-set-to-null-through-updatesettings-is-removed
hot.updateSettings({ afterSelection: onSelect ?? null });

// Other values are not reported.
hot.updateSettings({ afterChange: logChange });
hot.updateSettings({ afterChange: undefined });
hot.updateSettings({ colHeaders: null });
hot.updateSettings({ afterRender: () => null });
hot.updateSettings({ notAHook: null });
hot.addHook('afterChange', null);
