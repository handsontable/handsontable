import * as Handsontable from 'handsontable';

const elem = document.createElement('div');
const hot = new Handsontable(elem, {});

const gridSettings: Handsontable.GridSettings = {
  valid: true,
  className: 'foo'
};

Handsontable.renderers.AutocompleteRenderer(hot, new HTMLTableDataCellElement(), 0, 0, 'prop', 1.235, gridSettings);
Handsontable.renderers.BaseRenderer(hot, new HTMLTableDataCellElement(), 0, 0, 'prop', 1.235, gridSettings);
Handsontable.renderers.CheckboxRenderer(hot, new HTMLTableDataCellElement(), 0, 0, 'prop', 1.235, gridSettings);
Handsontable.renderers.HtmlRenderer(hot, new HTMLTableDataCellElement(), 0, 0, 'prop', 1.235, gridSettings);
Handsontable.renderers.NumericRenderer(hot, new HTMLTableDataCellElement(), 0, 0, 'prop', 1.235, gridSettings);
Handsontable.renderers.PasswordRenderer(hot, new HTMLTableDataCellElement(), 0, 0, 'prop', 1.235, gridSettings);
Handsontable.renderers.TextRenderer(hot, new HTMLTableDataCellElement(), 0, 0, 'prop', 1.235, gridSettings);
