/**
 * @preserve
 * Authors: Ashus
 * Last updated: Mar 22, 2022
 *
 * Description: Definition file for Czech - Czechia language-country.
 */
import * as C from '../constants';

const dictionary = {
  languageCode: 'cs-CZ',
  [C.CONTEXTMENU_ITEMS_NO_ITEMS]: 'Žádné volby nejsou dostupné',
  [C.CONTEXTMENU_ITEMS_ROW_ABOVE]: 'Vložit řádek nad',
  [C.CONTEXTMENU_ITEMS_ROW_BELOW]: 'Vložit řádek pod',
  [C.CONTEXTMENU_ITEMS_INSERT_LEFT]: 'Vložit sloupec vlevo',
  [C.CONTEXTMENU_ITEMS_INSERT_RIGHT]: 'Vložit sloupec vpravo',
  [C.CONTEXTMENU_ITEMS_REMOVE_ROW]: ['Smazat řádek', 'Smazat řádky'],
  [C.CONTEXTMENU_ITEMS_REMOVE_COLUMN]: ['Smazat sloupec', 'Smazat sloupce'],
  [C.CONTEXTMENU_ITEMS_UNDO]: 'Zpět',
  [C.CONTEXTMENU_ITEMS_REDO]: 'Znovu',
  [C.CONTEXTMENU_ITEMS_READ_ONLY]: 'Pouze pro čtení',
  [C.CONTEXTMENU_ITEMS_CLEAR_COLUMN]: 'Vymazat obsah sloupce',

  [C.CONTEXTMENU_ITEMS_ALIGNMENT]: 'Zarovnat',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT]: 'Vlevo',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER]: 'Na střed',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT]: 'Vpravo',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY]: 'Do bloku',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP]: 'Nahoru',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE]: 'Na střed',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM]: 'Dolů',

  [C.CONTEXTMENU_ITEMS_FREEZE_COLUMN]: 'Zmrazit sloupec',
  [C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN]: 'Zrušit zmrazení sloupce',

  [C.CONTEXTMENU_ITEMS_BORDERS]: 'Ohraničení',
  [C.CONTEXTMENU_ITEMS_BORDERS_TOP]: 'Nahoře',
  [C.CONTEXTMENU_ITEMS_BORDERS_RIGHT]: 'Vpravo',
  [C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM]: 'Dole',
  [C.CONTEXTMENU_ITEMS_BORDERS_LEFT]: 'Vlevo',
  [C.CONTEXTMENU_ITEMS_REMOVE_BORDERS]: 'Zrušit ohraničení',

  [C.CONTEXTMENU_ITEMS_ADD_COMMENT]: 'Přidat komentář',
  [C.CONTEXTMENU_ITEMS_EDIT_COMMENT]: 'Upravit komentář',
  [C.CONTEXTMENU_ITEMS_REMOVE_COMMENT]: 'Vymazat komentář',
  [C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT]: 'Komenář pouze pro čtení',

  [C.CONTEXTMENU_ITEMS_MERGE_CELLS]: 'Sloučit buňky',
  [C.CONTEXTMENU_ITEMS_UNMERGE_CELLS]: 'Zrušit sloučení buněk',

  [C.CONTEXTMENU_ITEMS_COPY]: 'Kopírovat',
  [C.CONTEXTMENU_ITEMS_CUT]: 'Vyjmout',

  [C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD]: 'Vložit podřízený řádek',
  [C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD]: 'Oddělit od nadřízeného',

  [C.CONTEXTMENU_ITEMS_HIDE_COLUMN]: ['Skrýt sloupec', 'Skrýt sloupce'],
  [C.CONTEXTMENU_ITEMS_SHOW_COLUMN]: ['Zobrazit sloupec', 'Zobrazit sloupce'],

  [C.CONTEXTMENU_ITEMS_HIDE_ROW]: ['Skrýt řádek', 'Skrýt řádky'],
  [C.CONTEXTMENU_ITEMS_SHOW_ROW]: ['Zobrazit řádek', 'Zobrazit řádky'],

  [C.FILTERS_CONDITIONS_NONE]: 'Žádné',
  [C.FILTERS_CONDITIONS_EMPTY]: 'Prázdné',
  [C.FILTERS_CONDITIONS_NOT_EMPTY]: 'Neprázdné',
  [C.FILTERS_CONDITIONS_EQUAL]: 'Rovná se',
  [C.FILTERS_CONDITIONS_NOT_EQUAL]: 'Nerovná se',
  [C.FILTERS_CONDITIONS_BEGINS_WITH]: 'Začíná na',
  [C.FILTERS_CONDITIONS_ENDS_WITH]: 'Končí na',
  [C.FILTERS_CONDITIONS_CONTAINS]: 'Obsahuje',
  [C.FILTERS_CONDITIONS_NOT_CONTAIN]: 'Neobsahuje',
  [C.FILTERS_CONDITIONS_GREATER_THAN]: 'Větší než',
  [C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL]: 'Větší nebo se rovná',
  [C.FILTERS_CONDITIONS_LESS_THAN]: 'Menší než',
  [C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL]: 'Menší nebo se rovná',
  [C.FILTERS_CONDITIONS_BETWEEN]: 'Je v rozsahu',
  [C.FILTERS_CONDITIONS_NOT_BETWEEN]: 'Není v rozsahu',
  [C.FILTERS_CONDITIONS_AFTER]: 'Po',
  [C.FILTERS_CONDITIONS_BEFORE]: 'Před',
  [C.FILTERS_CONDITIONS_TODAY]: 'Dnes',
  [C.FILTERS_CONDITIONS_TOMORROW]: 'Zítra',
  [C.FILTERS_CONDITIONS_YESTERDAY]: 'Včera',

  [C.FILTERS_VALUES_BLANK_CELLS]: 'Prádné buňky',

  [C.FILTERS_DIVS_FILTER_BY_CONDITION]: 'Filtrovat dle stavu',
  [C.FILTERS_DIVS_FILTER_BY_VALUE]: 'Filtrovat dle hodnoty',

  [C.FILTERS_LABELS_CONJUNCTION]: 'A',
  [C.FILTERS_LABELS_DISJUNCTION]: 'Nebo',

  [C.FILTERS_BUTTONS_SELECT_ALL]: 'Vybrat vše',
  [C.FILTERS_BUTTONS_CLEAR]: 'Smazat',
  [C.FILTERS_BUTTONS_OK]: 'OK',
  [C.FILTERS_BUTTONS_CANCEL]: 'Storno',

  [C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH]: 'Hledat',
  [C.FILTERS_BUTTONS_PLACEHOLDER_VALUE]: 'Hodnota',
  [C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE]: 'Druhá hodnota',

  [C.PAGINATION_PAGE_SIZE_SECTION]: 'Počet řádků:',
  [C.PAGINATION_COUNTER_SECTION]: '[start] - [end] z [total]',
  [C.PAGINATION_NAV_SECTION]: 'Stránka [currentPage] z [totalPages]',
  [C.PAGINATION_FIRST_PAGE]: 'Přejít na první stránku',
  [C.PAGINATION_PREV_PAGE]: 'Přejít na předchozí stránku',
  [C.PAGINATION_NEXT_PAGE]: 'Přejít na další stránku',
  [C.PAGINATION_LAST_PAGE]: 'Přejít na poslední stránku',
};

export default dictionary;
