/**
 * @preserve
 * Authors: Alexey Rogachev
 * Last updated: Feb 28, 2018
 *
 * Description: Definition file for Russian - Russia language-country.
 */
import * as C from '../constants';

const dictionary = {
  languageCode: 'ru-RU',
  [C.CONTEXTMENU_ITEMS_ROW_ABOVE]: 'Вставить строку выше',
  [C.CONTEXTMENU_ITEMS_ROW_BELOW]: 'Вставить строку ниже',
  [C.CONTEXTMENU_ITEMS_INSERT_LEFT]: 'Вставить столбец слева',
  [C.CONTEXTMENU_ITEMS_INSERT_RIGHT]: 'Вставить столбец справа',
  [C.CONTEXTMENU_ITEMS_REMOVE_ROW]: ['Удалить строку', 'Удалить строки'],
  [C.CONTEXTMENU_ITEMS_REMOVE_COLUMN]: ['Удалить столбец', 'Удалить столбцы'],
  [C.CONTEXTMENU_ITEMS_UNDO]: 'Отменить',
  [C.CONTEXTMENU_ITEMS_REDO]: 'Повторить',
  [C.CONTEXTMENU_ITEMS_READ_ONLY]: 'Только для чтения',
  [C.CONTEXTMENU_ITEMS_CLEAR_COLUMN]: 'Очистить столбец',

  [C.CONTEXTMENU_ITEMS_ALIGNMENT]: 'Выравнивание',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT]: 'По левому краю',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER]: 'По центру',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT]: 'По правому краю',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY]: 'По ширине',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP]: 'По верхнему краю',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE]: 'По центру',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM]: 'По нижнему краю',

  [C.CONTEXTMENU_ITEMS_FREEZE_COLUMN]: 'Закрепить столбец',
  [C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN]: 'Открепить столбец',

  [C.CONTEXTMENU_ITEMS_BORDERS]: 'Границы',
  [C.CONTEXTMENU_ITEMS_BORDERS_TOP]: 'Сверху',
  [C.CONTEXTMENU_ITEMS_BORDERS_RIGHT]: 'Справа',
  [C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM]: 'Снизу',
  [C.CONTEXTMENU_ITEMS_BORDERS_LEFT]: 'Слева',
  [C.CONTEXTMENU_ITEMS_REMOVE_BORDERS]: 'Удалить границу(ы)',

  [C.CONTEXTMENU_ITEMS_ADD_COMMENT]: 'Добавить комментарий',
  [C.CONTEXTMENU_ITEMS_EDIT_COMMENT]: 'Редактировать комментарий',
  [C.CONTEXTMENU_ITEMS_REMOVE_COMMENT]: 'Удалить комментарий',
  [C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT]: 'Комментарий только для чтения',

  [C.CONTEXTMENU_ITEMS_MERGE_CELLS]: 'Объединить ячейки',
  [C.CONTEXTMENU_ITEMS_UNMERGE_CELLS]: 'Разделить ячейки',

  [C.CONTEXTMENU_ITEMS_COPY]: 'Копировать',
  [C.CONTEXTMENU_ITEMS_CUT]: 'Вырезать',

  [C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD]: 'Вставить дочернюю строку',
  [C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD]: 'Отделить от родителя',

  [C.CONTEXTMENU_ITEMS_HIDE_COLUMN]: ['Скрыть столбец', 'Скрыть столбцы'],
  [C.CONTEXTMENU_ITEMS_SHOW_COLUMN]: ['Показать столбец', 'Показать столбцы'],

  [C.CONTEXTMENU_ITEMS_HIDE_ROW]: ['Скрыть строку', 'Скрыть строки'],
  [C.CONTEXTMENU_ITEMS_SHOW_ROW]: ['Показать строку', 'Показать строки'],

  [C.FILTERS_CONDITIONS_NONE]: 'Отсутствует',
  [C.FILTERS_CONDITIONS_EMPTY]: 'Пусто',
  [C.FILTERS_CONDITIONS_NOT_EMPTY]: 'Не пусто',
  [C.FILTERS_CONDITIONS_EQUAL]: 'Равно',
  [C.FILTERS_CONDITIONS_NOT_EQUAL]: 'Не равно',
  [C.FILTERS_CONDITIONS_BEGINS_WITH]: 'Начинается на',
  [C.FILTERS_CONDITIONS_ENDS_WITH]: 'Заканчивается на',
  [C.FILTERS_CONDITIONS_CONTAINS]: 'Содержит',
  [C.FILTERS_CONDITIONS_NOT_CONTAIN]: 'Не содержит',
  [C.FILTERS_CONDITIONS_GREATER_THAN]: 'Больше чем',
  [C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL]: 'Больше или равно',
  [C.FILTERS_CONDITIONS_LESS_THAN]: 'Меньше чем',
  [C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL]: 'Меньше или равно',
  [C.FILTERS_CONDITIONS_BETWEEN]: 'Между',
  [C.FILTERS_CONDITIONS_NOT_BETWEEN]: 'Не между',
  [C.FILTERS_CONDITIONS_AFTER]: 'После',
  [C.FILTERS_CONDITIONS_BEFORE]: 'До',
  [C.FILTERS_CONDITIONS_TODAY]: 'Сегодня',
  [C.FILTERS_CONDITIONS_TOMORROW]: 'Завтра',
  [C.FILTERS_CONDITIONS_YESTERDAY]: 'Вчера',

  [C.FILTERS_VALUES_BLANK_CELLS]: 'Пустые ячейки',

  [C.FILTERS_DIVS_FILTER_BY_CONDITION]: 'Фильтр по условию',
  [C.FILTERS_DIVS_FILTER_BY_VALUE]: 'Фильтр по значению',

  [C.FILTERS_LABELS_CONJUNCTION]: 'И',
  [C.FILTERS_LABELS_DISJUNCTION]: 'Или',

  [C.FILTERS_BUTTONS_SELECT_ALL]: 'Выбрать все',
  [C.FILTERS_BUTTONS_CLEAR]: 'Убрать',
  [C.FILTERS_BUTTONS_OK]: 'OK',
  [C.FILTERS_BUTTONS_CANCEL]: 'Отмена',

  [C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH]: 'Поиск',
  [C.FILTERS_BUTTONS_PLACEHOLDER_VALUE]: 'Значение',
  [C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE]: 'Второе значение'
};

export default dictionary;
