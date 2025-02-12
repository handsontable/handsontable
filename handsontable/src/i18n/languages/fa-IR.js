/**
 * @preserve
 * Authors: Ali Almasi
 * Last updated: Jan 19, 2025
 *
 * Description: Definition file for Farsi - Iran language-country.
 */
import * as C from '../constants';

const dictionary = {
  languageCode: 'fa-IR',
  [C.CONTEXTMENU_ITEMS_NO_ITEMS]: 'هیچ گزینه ای در دسترس نیست',
  [C.CONTEXTMENU_ITEMS_ROW_ABOVE]: 'درج ردیف در بالا',
  [C.CONTEXTMENU_ITEMS_ROW_BELOW]: 'درج ردیف در پایین',
  [C.CONTEXTMENU_ITEMS_INSERT_LEFT]: 'درج ستون در چپ',
  [C.CONTEXTMENU_ITEMS_INSERT_RIGHT]: 'درج ستون در راست',
  [C.CONTEXTMENU_ITEMS_REMOVE_ROW]: ['حذف ردیف', 'حذف ردیف ها'],
  [C.CONTEXTMENU_ITEMS_REMOVE_COLUMN]: ['حذف ستون', 'حذف ستون ها'],
  [C.CONTEXTMENU_ITEMS_UNDO]: 'واگرد',
  [C.CONTEXTMENU_ITEMS_REDO]: 'بازگردانی',
  [C.CONTEXTMENU_ITEMS_READ_ONLY]: 'فقط خواندنی',
  [C.CONTEXTMENU_ITEMS_CLEAR_COLUMN]: 'پاک کردن ستون',

  [C.CONTEXTMENU_ITEMS_ALIGNMENT]: 'تراز',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT]: 'چپ',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER]: 'وسط',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT]: 'راست',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY]: 'میزان',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP]: 'بالا',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE]: 'میانه',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM]: 'پایین',

  [C.CONTEXTMENU_ITEMS_FREEZE_COLUMN]: 'انجماد ستون',
  [C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN]: 'باز کردن ستون',

  [C.CONTEXTMENU_ITEMS_BORDERS]: 'مرز ها',
  [C.CONTEXTMENU_ITEMS_BORDERS_TOP]: 'بالا',
  [C.CONTEXTMENU_ITEMS_BORDERS_RIGHT]: 'راست',
  [C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM]: 'پایین',
  [C.CONTEXTMENU_ITEMS_BORDERS_LEFT]: 'چپ',
  [C.CONTEXTMENU_ITEMS_REMOVE_BORDERS]: 'حذف مرز (ها)',

  [C.CONTEXTMENU_ITEMS_ADD_COMMENT]: 'افزودن کامنت',
  [C.CONTEXTMENU_ITEMS_EDIT_COMMENT]: 'تغییر کامنت',
  [C.CONTEXTMENU_ITEMS_REMOVE_COMMENT]: 'حذف کامنت',
  [C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT]: 'فقط خواندنی کردن کامنت',

  [C.CONTEXTMENU_ITEMS_MERGE_CELLS]: 'ادغام سلول ها',
  [C.CONTEXTMENU_ITEMS_UNMERGE_CELLS]: 'جدا کردن سلول ها',

  [C.CONTEXTMENU_ITEMS_COPY]: 'کپی',
  [C.CONTEXTMENU_ITEMS_COPY_WITH_COLUMN_HEADERS]: ['کپی با سر ستون', 'کپی با سرستون ها'],
  [C.CONTEXTMENU_ITEMS_COPY_WITH_COLUMN_GROUP_HEADERS]: ['کپی با سرستون گروه', 'کپی با سرستون گروه ها'],
  [C.CONTEXTMENU_ITEMS_COPY_COLUMN_HEADERS_ONLY]: ['فقط کپی سرستون', 'فقط کپی سرستون ها'],
  [C.CONTEXTMENU_ITEMS_CUT]: 'بریدن',

  [C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD]: 'درج زیر ردیف',
  [C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD]: 'جدا کردن از سرردیف',

  [C.CONTEXTMENU_ITEMS_HIDE_COLUMN]: ['پنهان کردن ستون', 'پنهان کردن ستون ها'],
  [C.CONTEXTMENU_ITEMS_SHOW_COLUMN]: ['نمایش ستون', 'نمایش ستون ها'],

  [C.CONTEXTMENU_ITEMS_HIDE_ROW]: ['پنهان کردن ردیف', 'پنهان کردن ردیف ها'],
  [C.CONTEXTMENU_ITEMS_SHOW_ROW]: ['نمایش ردیف', 'نمایش ردیف ها'],

  [C.FILTERS_CONDITIONS_NONE]: 'هیچ',
  [C.FILTERS_CONDITIONS_EMPTY]: 'خالی است',
  [C.FILTERS_CONDITIONS_NOT_EMPTY]: 'خالی نیست',
  [C.FILTERS_CONDITIONS_EQUAL]: 'برابر است با',
  [C.FILTERS_CONDITIONS_NOT_EQUAL]: 'برابر نیست با',
  [C.FILTERS_CONDITIONS_BEGINS_WITH]: 'شروع می شود با',
  [C.FILTERS_CONDITIONS_ENDS_WITH]: 'پایان می یابد با',
  [C.FILTERS_CONDITIONS_CONTAINS]: 'شامل می شود',
  [C.FILTERS_CONDITIONS_NOT_CONTAIN]: 'شامل نمی شود',
  [C.FILTERS_CONDITIONS_GREATER_THAN]: 'بزرگ تر',
  [C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL]: 'بزرگتر مساوی',
  [C.FILTERS_CONDITIONS_LESS_THAN]: 'کوچکتر',
  [C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL]: 'کوچکتر مساوی',
  [C.FILTERS_CONDITIONS_BETWEEN]: 'در میان است',
  [C.FILTERS_CONDITIONS_NOT_BETWEEN]: 'در میان نیست',
  [C.FILTERS_CONDITIONS_AFTER]: 'بعد',
  [C.FILTERS_CONDITIONS_BEFORE]: 'قبل',
  [C.FILTERS_CONDITIONS_TODAY]: 'امروز',
  [C.FILTERS_CONDITIONS_TOMORROW]: 'فردا',
  [C.FILTERS_CONDITIONS_YESTERDAY]: 'دیروز',

  [C.FILTERS_VALUES_BLANK_CELLS]: 'سلول های خالی',

  [C.FILTERS_DIVS_FILTER_BY_CONDITION]: 'فیلتر بر اساس شرایط',
  [C.FILTERS_DIVS_FILTER_BY_VALUE]: 'فیلتر بر اساس مقدار',

  [C.FILTERS_LABELS_CONJUNCTION]: 'و',
  [C.FILTERS_LABELS_DISJUNCTION]: 'یا',

  [C.FILTERS_BUTTONS_SELECT_ALL]: 'انتخاب همه',
  [C.FILTERS_BUTTONS_CLEAR]: 'پاک کردن',
  [C.FILTERS_BUTTONS_OK]: 'تایید',
  [C.FILTERS_BUTTONS_CANCEL]: 'لغو',

  [C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH]: 'جستجو',
  [C.FILTERS_BUTTONS_PLACEHOLDER_VALUE]: 'مقدار',
  [C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE]: 'مقدار دوم',

  [C.CHECKBOX_CHECKED]: 'چک شده',
  [C.CHECKBOX_UNCHECKED]: 'چک نشده',
};

export default dictionary;
