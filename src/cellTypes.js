/**
 * Cell type is just a shortcut for setting bunch of cellProperties (used in getCellMeta)
 */

Handsontable.AutocompleteCell = {
  editor: 'autocomplete',
  renderer: Handsontable.AutocompleteRenderer,
  validator: Handsontable.AutocompleteValidator
};

Handsontable.CheckboxCell = {
  editor: 'checkbox',
  renderer: Handsontable.CheckboxRenderer
};

Handsontable.TextCell = {
  editor: 'text',
  renderer: Handsontable.TextRenderer
};

Handsontable.NumericCell = {
  editor: 'text',
  renderer: Handsontable.NumericRenderer,
  validator: Handsontable.NumericValidator,
  dataType: 'number'
};

Handsontable.DateCell = {
  editor: 'date',
  renderer: Handsontable.AutocompleteRenderer //displays small gray arrow on right side of the cell
};

Handsontable.HandsontableCell = {
  editor: 'handsontable',
  renderer: Handsontable.AutocompleteRenderer //displays small gray arrow on right side of the cell
};

Handsontable.PasswordCell = {
  editor: 'password',
  renderer: Handsontable.PasswordRenderer
};

Handsontable.DropdownCell = {
  editor: 'dropdown',
  renderer: Handsontable.AutocompleteRenderer
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
  renderer: {
    text: Handsontable.TextRenderer,
    numeric: Handsontable.NumericRenderer,
    checkbox: Handsontable.CheckboxRenderer,
    autocomplete: Handsontable.AutocompleteRenderer,
    password: Handsontable.PasswordRenderer
  },
  validator: {
    numeric: Handsontable.NumericValidator,
    autocomplete: Handsontable.AutocompleteValidator
  }
};