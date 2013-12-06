/**
 * Cell type is just a shortcut for setting bunch of cellProperties (used in getCellMeta)
 */

Handsontable.AutocompleteCell = {
  editor: 'autocomplete',
  renderer: 'autocomplete',
  validator: Handsontable.AutocompleteValidator
};

Handsontable.CheckboxCell = {
  editor: 'checkbox',
  renderer: 'checkbox'
};

Handsontable.TextCell = {
  editor: 'text',
  renderer: 'text'
};

Handsontable.NumericCell = {
  editor: 'text',
  renderer: 'numeric',
  validator: Handsontable.NumericValidator,
  dataType: 'number'
};

Handsontable.DateCell = {
  editor: 'date',
  renderer: 'autocomplete' //displays small gray arrow on right side of the cell
};

Handsontable.HandsontableCell = {
  editor: 'handsontable',
  renderer: 'autocomplete' //displays small gray arrow on right side of the cell
};

Handsontable.PasswordCell = {
  editor: 'password',
  renderer: 'password'
};

Handsontable.DropdownCell = {
  editor: 'dropdown',
  renderer: 'autocomplete',
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