import Handsontable from 'handsontable';

declare const common: Handsontable.GridSettings;
declare const props: Handsontable.GridSettings;
declare const key: string;

const container = document.querySelector<HTMLElement>('#grid')!;

// A spread can bring the key, so the codemod cannot tell.
new Handsontable(container, { ...common, data: [['a']] });

// A computed key can be the key.
new Handsontable(container, { [key]: 'your-license-key', data: [['b']] });

// The key is read once at init, so updateSettings() needs none.
const hot = new Handsontable(container, { licenseKey: 'your-license-key' });

hot.updateSettings({ data: [['c']] });

// An annotated object that nothing passes to the constructor here: the codemod cannot tell where it goes.
export const shared: Handsontable.GridSettings = { data: [['d']] };

export const spreadProps = new Handsontable(container, { ...props });
