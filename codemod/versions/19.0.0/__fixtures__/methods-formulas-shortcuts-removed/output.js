import Handsontable from 'handsontable';

const hot = new Handsontable(document.querySelector('#grid'), { formulas: { engine: null } });
const formulas = hot.getPlugin('formulas');

formulas.disablePlugin();
formulas.enablePlugin();

// Other plugins keep their own methods of these names.
hot.getPlugin('filters').registerShortcuts();
hot.getPlugin('comments').unregisterShortcuts();
