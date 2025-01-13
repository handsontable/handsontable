import Handsontable from 'handsontable';
import { registerLanguageDictionary, arAR } from 'handsontable/i18n';
import { generateArabicData } from './arabicRtlData';
import { getThemeNameFromURL } from '../../utils';

registerLanguageDictionary(arAR);

const root = document.getElementById('root');

const container = document.createElement('div');
root.appendChild(container);

export function initializeArabicRtlDemo() {
 new Handsontable(container, {
    licenseKey: 'non-commercial-and-evaluation',
    data: generateArabicData(),
    themeName: getThemeNameFromURL(),
    width: 700,
    height: 500,
    columns: [
      { data: 0, type: 'checkbox', title: 'فعال' },
      { data: 1, type: 'text', title: 'اسم' },
      { data: 2, type: 'text', title: 'بلد' },
      { data: 3, type: 'text', title: 'عبارة' },
      {
        data: 4,
        type: 'date',
        dateFormat: 'YYYY-MM-DD',
        correctFormat: true,
        title: 'تاريخ',
      },
      { data: 5, type: 'text', title: 'عبارة' },
      {
        data: 6,
        type: 'checkbox',
        title: 'نشط',
        className: 'htCenter',
        headerClassName: 'htRight',
      },
      { data: 7, type: 'numeric', title: 'رقم 1', width: 50 },
      { data: 8, type: 'numeric', title: 'رقم 2', width: 50 },
      { data: 9, type: 'numeric', title: 'رقم 3', width: 50 },
    ],
    colHeaders: [
      'فعال',
      'اسم',
      'بلد',
      'عبارة',
      'تاريخ',
      'عبارة',
      'نشط',
      'رقم 1',
      'رقم 2',
      'رقم 3',
    ],
    rowHeaders: true,
    layoutDirection: 'rtl',
    language: 'ar-AR',
    dropdownMenu: true,
    filters: true,
    contextMenu: true,
    autoWrapRow: true,
    autoWrapCol: true,
    nestedHeaders: [
      ['معلومات', { label: 'التفاصيل', colspan: 4 }, 'بيانات إضافية'],
      [
        'فعال',
        'اسم',
        'بلد',
        'عبارة 1',
        'تاريخ',
        'عبارة 2',
        'نشط',
        'رقم 1',
        'رقم 2',
        'رقم 3',
      ],
    ],
  });
  console.log(
    `Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`
  );
}
