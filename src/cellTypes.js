/**
 * Cell type is just a shortcut for setting bunch of cellProperties (used in getCellMeta)
 */

Handsontable.mobileBrowser = Handsontable.helper.isMobileBrowser();  // check if viewed on a mobile device

Handsontable.AutocompleteCell = {
  editor: Handsontable.editors.AutocompleteEditor,
  renderer: Handsontable.renderers.AutocompleteRenderer,
  validator: Handsontable.AutocompleteValidator
};

Handsontable.CheckboxCell = {
  editor: Handsontable.editors.CheckboxEditor,
  renderer: Handsontable.renderers.CheckboxRenderer
};

Handsontable.TextCell = {
  editor: Handsontable.mobileBrowser ? Handsontable.editors.MobileTextEditor : Handsontable.editors.TextEditor,
  renderer: Handsontable.renderers.TextRenderer
};

Handsontable.NumericCell = {
  editor: Handsontable.editors.NumericEditor,
  renderer: Handsontable.renderers.NumericRenderer,
  validator: Handsontable.NumericValidator,
  dataType: 'number'
};

Handsontable.DateCell = {
  editor: Handsontable.editors.DateEditor,
  validator: Handsontable.DateValidator,
  renderer: Handsontable.renderers.AutocompleteRenderer //displays small gray arrow on right side of the cell
};

Handsontable.HandsontableCell = {
  editor: Handsontable.editors.HandsontableEditor,
  renderer: Handsontable.renderers.AutocompleteRenderer //displays small gray arrow on right side of the cell
};

Handsontable.PasswordCell = {
  editor: Handsontable.editors.PasswordEditor,
  renderer: Handsontable.renderers.PasswordRenderer,
  copyable: false
};

Handsontable.DropdownCell = {
  editor: Handsontable.editors.DropdownEditor,
  renderer: Handsontable.renderers.AutocompleteRenderer, //displays small gray arrow on right side of the cell
  validator: Handsontable.AutocompleteValidator
};

//here setup the friendly aliases that are used by cellProperties.type
Handsontable.cellTypes = {
  text: Handsontable.TextCell,
  date: Handsontable.DateCell,
  numeric: Handsontable.NumericCell,
  checkbox: Handsontable.CheckboxCell,
  autocomplete: Handsontable.AutocompleteCell,
  handsontable: Handsontable.HandsontableCell,
  password: Handsontable.PasswordCell,
  dropdown: Handsontable.DropdownCell
};

//here setup the friendly aliases that are used by cellProperties.renderer and cellProperties.editor
Handsontable.cellLookup = {
  validator: {
    numeric: Handsontable.NumericValidator,
    autocomplete: Handsontable.AutocompleteValidator
  }
};
