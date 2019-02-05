import Handsontable from 'handsontable';

const elem = document.createElement('div');
const hot = new Handsontable(elem, {});

const cellProperties: Handsontable.CellProperties = { 
  row: 0,
  col: 0,
  instance: {} as Handsontable,
  visualRow: 0,
  visualCol: 0,
  prop: "foo"
};

Handsontable.renderers.AutocompleteRenderer(hot, new HTMLTableDataCellElement(), 0, 0, 'prop', 1.235, cellProperties);
Handsontable.renderers.BaseRenderer(hot, new HTMLTableDataCellElement(), 0, 0, 'prop', 1.235, cellProperties);
Handsontable.renderers.CheckboxRenderer(hot, new HTMLTableDataCellElement(), 0, 0, 'prop', 1.235, cellProperties);
Handsontable.renderers.HtmlRenderer(hot, new HTMLTableDataCellElement(), 0, 0, 'prop', 1.235, cellProperties);
Handsontable.renderers.NumericRenderer(hot, new HTMLTableDataCellElement(), 0, 0, 'prop', 1.235, cellProperties);
Handsontable.renderers.PasswordRenderer(hot, new HTMLTableDataCellElement(), 0, 0, 'prop', 1.235, cellProperties);
Handsontable.renderers.TextRenderer(hot, new HTMLTableDataCellElement(), 0, 0, 'prop', 1.235, cellProperties);
