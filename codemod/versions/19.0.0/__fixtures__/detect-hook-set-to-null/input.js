import Handsontable from 'handsontable';

const hot = new Handsontable(document.querySelector('#grid'), { data: [[1]], afterChange: logChange });

hot.updateSettings({ afterChange: null });
hot.updateSettings({ beforeKeyDown: tracking ? onKey : null });
hot.updateSettings({ afterSelection: onSelect ?? null });

// Other values are not reported.
hot.updateSettings({ afterChange: logChange });
hot.updateSettings({ afterChange: undefined });
hot.updateSettings({ colHeaders: null });
hot.updateSettings({ afterRender: () => null });
hot.updateSettings({ notAHook: null });
hot.addHook('afterChange', null);
