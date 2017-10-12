/**
 * @preserve
 * Authors: Wojciech Szymański
 * Last updated: 12.10.2017
 *
 * Description: Definition file for Polish language.
 */
import * as C from '../constants';

const dictionary = {
  languageCode: 'pl-PL',
  [C.CONTEXTMENU_ITEMS_ROW_ABOVE]: 'Umieść wiersz powyżej',
  [C.CONTEXTMENU_ITEMS_ROW_BELOW]: 'Umieść wiersz poniżej',
  [C.CONTEXTMENU_ITEMS_INSERT_LEFT]: 'Umieść kolumnę po lewej stronie',
  [C.CONTEXTMENU_ITEMS_INSERT_RIGHT]: 'Umieść kolumnę po prawej stronie',
  [C.CONTEXTMENU_ITEMS_REMOVE_ROW]: ['Usuń wiersz', 'Usuń wiersze'],
  [C.CONTEXTMENU_ITEMS_REMOVE_COLUMN]: ['Usuń kolumnę', 'Usuń kolumny'],
  [C.CONTEXTMENU_ITEMS_UNDO]: 'Cofnij',
  [C.CONTEXTMENU_ITEMS_REDO]: 'Przywróć',
  [C.CONTEXTMENU_ITEMS_READ_ONLY]: 'Tylko do odczytu',

  [C.CONTEXTMENU_ITEMS_ALIGNMENT]: 'Wyrównanie',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT]: 'Lewo',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER]: 'Środek',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT]: 'Prawo',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY]: 'Wyjustowane',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP]: 'Góra',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE]: 'Środek',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM]: 'Dół',
  [C.CONTEXTMENU_ITEMS_CLEAR_COLUMN]: 'Wyczyść kolumnę',

  [C.CONTEXTMENU_ITEMS_COPY]: 'Kopiuj',
  [C.CONTEXTMENU_ITEMS_CUT]: 'Wytnij',

  [C.FILTERS_CONDITIONS_NONE]: 'Brak',
  [C.FILTERS_CONDITIONS_EMPTY]: 'Jest pusty',
  [C.FILTERS_CONDITIONS_NOT_EMPTY]: 'Nie jest pusty',
  [C.FILTERS_CONDITIONS_EQUAL]: 'Jest równy',
  [C.FILTERS_CONDITIONS_NOT_EQUAL]: 'Nie jest równy',
  [C.FILTERS_CONDITIONS_BEGINS_WITH]: 'Zaczyna się',
  [C.FILTERS_CONDITIONS_ENDS_WITH]: 'Kończy się',
  [C.FILTERS_CONDITIONS_CONTAINS]: 'Zawiera',
  [C.FILTERS_CONDITIONS_NOT_CONTAIN]: 'Nie zawiera',
  [C.FILTERS_CONDITIONS_BY_VALUE]: 'By value',
  [C.FILTERS_CONDITIONS_GREATER_THAN]: 'Większe niż',
  [C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL]: 'Większe lub równe',
  [C.FILTERS_CONDITIONS_LESS_THAN]: 'Mniejsze niż',
  [C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL]: 'Mniejsze lub równe',
  [C.FILTERS_CONDITIONS_BETWEEN]: 'Pomiędzy',
  [C.FILTERS_CONDITIONS_NOT_BETWEEN]: 'Nie jest pomiędzy',

  [C.FILTERS_LABELS_FILTER_BY_CONDITION]: 'Filtruj na podstawie warunku',
  [C.FILTERS_LABELS_FILTER_BY_VALUE]: 'Filtruj na podstawie wartości',
  [C.FILTERS_LABELS_CONJUNCTION]: 'Oraz',
  [C.FILTERS_LABELS_DISJUNCTION]: 'Lub',

  [C.FILTERS_BUTTONS_SELECT_ALL]: 'Wybierz wszystkie',
  [C.FILTERS_BUTTONS_CLEAR]: 'Wyczyść',
  [C.FILTERS_BUTTONS_OK]: 'OK',
  [C.FILTERS_BUTTONS_CANCEL]: 'Anuluj',

  [C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH]: 'Szukaj...'
};

export default dictionary;
