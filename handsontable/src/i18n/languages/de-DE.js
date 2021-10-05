/**
 * @preserve
 * Authors: Stefan Salzl
 * Last updated: Jan 08, 2018
 *
 * Description: Definition file for German - Germany language-country.
 */
import * as C from '../constants';

const dictionary = {
  languageCode: 'de-DE',
  [C.CONTEXTMENU_ITEMS_ROW_ABOVE]: 'Zeile einfügen oberhalb',
  [C.CONTEXTMENU_ITEMS_ROW_BELOW]: 'Zeile einfügen unterhalb',
  [C.CONTEXTMENU_ITEMS_INSERT_LEFT]: 'Spalte einfügen links',
  [C.CONTEXTMENU_ITEMS_INSERT_RIGHT]: 'Spalte einfügen rechts',
  [C.CONTEXTMENU_ITEMS_REMOVE_ROW]: ['Zeile löschen', 'Zeilen löschen'],
  [C.CONTEXTMENU_ITEMS_REMOVE_COLUMN]: ['Spalte löschen', 'Spalten löschen'],
  [C.CONTEXTMENU_ITEMS_UNDO]: 'Rückgangig',
  [C.CONTEXTMENU_ITEMS_REDO]: 'Wiederholen',
  [C.CONTEXTMENU_ITEMS_READ_ONLY]: 'Nur Lesezugriff',
  [C.CONTEXTMENU_ITEMS_CLEAR_COLUMN]: 'Spalteninhalt löschen',

  [C.CONTEXTMENU_ITEMS_ALIGNMENT]: 'Ausrichtung',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT]: 'Linksbündig',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER]: 'Zentriert',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT]: 'Rechtsbündig',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY]: 'Blocksatz',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP]: 'Oben',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE]: 'Mitte',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM]: 'Unten',

  [C.CONTEXTMENU_ITEMS_FREEZE_COLUMN]: 'Spalte fixieren',
  [C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN]: 'Spaltenfixierung aufheben',

  [C.CONTEXTMENU_ITEMS_BORDERS]: 'Rahmen',
  [C.CONTEXTMENU_ITEMS_BORDERS_TOP]: 'Oben',
  [C.CONTEXTMENU_ITEMS_BORDERS_RIGHT]: 'Rechts',
  [C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM]: 'Unten',
  [C.CONTEXTMENU_ITEMS_BORDERS_LEFT]: 'Links',
  [C.CONTEXTMENU_ITEMS_REMOVE_BORDERS]: 'Kein Rahmen',

  [C.CONTEXTMENU_ITEMS_ADD_COMMENT]: 'Kommentar hinzufügen',
  [C.CONTEXTMENU_ITEMS_EDIT_COMMENT]: 'Kommentar bearbeiten',
  [C.CONTEXTMENU_ITEMS_REMOVE_COMMENT]: 'Kommentar löschen',
  [C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT]: 'Schreibschutz Kommentar',

  [C.CONTEXTMENU_ITEMS_MERGE_CELLS]: 'Zellen verbinden',
  [C.CONTEXTMENU_ITEMS_UNMERGE_CELLS]: 'Zellen teilen',

  [C.CONTEXTMENU_ITEMS_COPY]: 'Kopieren',
  [C.CONTEXTMENU_ITEMS_CUT]: 'Ausschneiden',

  [C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD]: 'Nachfolgerzeile einfügen',
  [C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD]: 'Von Vorgängerzeile abkoppeln',

  [C.CONTEXTMENU_ITEMS_HIDE_COLUMN]: ['Spalte ausblenden', 'Spalten ausblenden'],
  [C.CONTEXTMENU_ITEMS_SHOW_COLUMN]: ['Spalte einblenden', 'Spalten einblenden'],

  [C.CONTEXTMENU_ITEMS_HIDE_ROW]: ['Zeile ausblenden', 'Zeilen ausblenden'],
  [C.CONTEXTMENU_ITEMS_SHOW_ROW]: ['Zeile einblenden', 'Zeilen einblenden'],

  [C.FILTERS_CONDITIONS_NONE]: 'Kein Filter',
  [C.FILTERS_CONDITIONS_EMPTY]: 'Ist leer',
  [C.FILTERS_CONDITIONS_NOT_EMPTY]: 'Ist nicht leer',
  [C.FILTERS_CONDITIONS_EQUAL]: 'Ist gleich',
  [C.FILTERS_CONDITIONS_NOT_EQUAL]: 'Ist ungleich',
  [C.FILTERS_CONDITIONS_BEGINS_WITH]: 'Beginnt mit',
  [C.FILTERS_CONDITIONS_ENDS_WITH]: 'Endet mit',
  [C.FILTERS_CONDITIONS_CONTAINS]: 'Enthält',
  [C.FILTERS_CONDITIONS_NOT_CONTAIN]: 'Enthält nicht',
  [C.FILTERS_CONDITIONS_GREATER_THAN]: 'Größer als',
  [C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL]: 'Größer gleich',
  [C.FILTERS_CONDITIONS_LESS_THAN]: 'Kleiner als',
  [C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL]: 'Kleiner gleich',
  [C.FILTERS_CONDITIONS_BETWEEN]: 'Zwischen',
  [C.FILTERS_CONDITIONS_NOT_BETWEEN]: 'Außerhalb',
  [C.FILTERS_CONDITIONS_AFTER]: 'Nach',
  [C.FILTERS_CONDITIONS_BEFORE]: 'Vor',
  [C.FILTERS_CONDITIONS_TODAY]: 'Heute',
  [C.FILTERS_CONDITIONS_TOMORROW]: 'Morgen',
  [C.FILTERS_CONDITIONS_YESTERDAY]: 'Gestern',

  [C.FILTERS_VALUES_BLANK_CELLS]: 'Leere Zellen',

  [C.FILTERS_DIVS_FILTER_BY_CONDITION]: 'Per Bedingung filtern',
  [C.FILTERS_DIVS_FILTER_BY_VALUE]: 'Nach Zahlen filtern',

  [C.FILTERS_LABELS_CONJUNCTION]: 'Und',
  [C.FILTERS_LABELS_DISJUNCTION]: 'Oder',

  [C.FILTERS_BUTTONS_SELECT_ALL]: 'Alles auswählen',
  [C.FILTERS_BUTTONS_CLEAR]: 'Auswahl aufheben',
  [C.FILTERS_BUTTONS_OK]: 'OK',
  [C.FILTERS_BUTTONS_CANCEL]: 'Abbrechen',

  [C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH]: 'Suchen',
  [C.FILTERS_BUTTONS_PLACEHOLDER_VALUE]: 'Wert',
  [C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE]: 'Alternativwert'
};

export default dictionary;
