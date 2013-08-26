/**
 * Cell type is just a shortcut for setting bunch of cellProperties (used in getCellMeta)
 */

Handsontable.AutocompleteCell = {
  editor: Handsontable.AutocompleteEditor,
  renderer: Handsontable.AutocompleteRenderer,
  validator: Handsontable.AutocompleteValidator
};

Handsontable.CheckboxCell = {
  editor: Handsontable.CheckboxEditor,
  renderer: Handsontable.CheckboxRenderer
};

Handsontable.TextCell = {
  editor: Handsontable.TextEditor,
  renderer: Handsontable.TextRenderer
};

Handsontable.NumericCell = {
  editor: Handsontable.TextEditor,
  renderer: Handsontable.NumericRenderer,
  validator: Handsontable.NumericValidator,
  dataType: 'number'
};

Handsontable.DateCell = {
  editor: Handsontable.DateEditor,
  renderer: Handsontable.AutocompleteRenderer //displays small gray arrow on right side of the cell
};

Handsontable.HandsontableCell = {
  editor: Handsontable.HandsontableEditor,
  renderer: Handsontable.AutocompleteRenderer //displays small gray arrow on right side of the cell
};

Handsontable.PasswordCell = {
  editor: Handsontable.PasswordEditor,
  renderer: Handsontable.PasswordRenderer
};

//here setup the friendly aliases that are used by cellProperties.type
Handsontable.cellTypes = {
  text: Handsontable.TextCell,
  date: Handsontable.DateCell,
  numeric: Handsontable.NumericCell,
  checkbox: Handsontable.CheckboxCell,
  autocomplete: Handsontable.AutocompleteCell,
  handsontable: Handsontable.HandsontableCell,
  password: Handsontable.PasswordCell
};

//here setup the friendly aliases that are used by cellProperties.renderer and cellProperties.editor
Handsontable.cellLookup = {
  renderer: {
    text: Handsontable.TextRenderer,
    numeric: Handsontable.NumericRenderer,
    checkbox: Handsontable.CheckboxRenderer,
    autocomplete: Handsontable.AutocompleteRenderer,
    password: Handsontable.PasswordRenderer
  },
  editor: {
    text: Handsontable.TextEditor,
    date: Handsontable.DateEditor,
    checkbox: Handsontable.CheckboxEditor,
    autocomplete: Handsontable.AutocompleteEditor,
    handsontable: Handsontable.HandsontableEditor,
    password: Handsontable.PasswordEditor
  },
  validator: {
    numeric: Handsontable.NumericValidator,
    autocomplete: Handsontable.AutocompleteValidator
  }
};