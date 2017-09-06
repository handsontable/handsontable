/**
 * Authors: Wojciech Szymański
 * Last updated: 23.08.2017
 *
 * Description: Definition file for Polish language.
 */
import {langDefinitionsController as l} from '../langDefinitionsController';
import * as C from '../constants';

l.registerLangDefinition('pl', {
  [C.CONTEXTMENU_ITEMS_ALIGN]: 'Wyśrodkuj',
  [C.CONTEXTMENU_ITEMS_ROW_ABOVE]: 'Umieść wiersz poniżej',
  [C.CONTEXTMENU_ITEMS_REMOVE_ROW]: ['Usuń wiersz', 'Usuń wiersze'],
  [C.CONTEXTMENU_ITEMS_REMOVE_COLUMN]: ['Usuń kolumnę', 'Usuń kolumny'],
  [C.FILTERS_CONDITIONS_NONE]: 'Brak',
  [C.FILTERS_CONDITIONS_EMPTY]: 'Jest pusty',
  [C.FILTERS_LABELS_FILTER_BY_CONDITION]: 'Filtruj na podstawie warunku:',
  [C.FILTERS_LABELS_FILTER_BY_VALUE]: 'Filtruj na podstawie wartości:',
  [C.FILTERS_BUTTONS_OK]: 'OK',
  [C.FILTERS_BUTTONS_CANCEL]: 'Anuluj'
});
