import Handsontable from 'handsontable';
import { getDirectionFromURL, getThemeNameFromURL, getFromURL } from '../../utils';
import { registerLanguageDictionary, arAR } from 'handsontable/i18n';
import { data } from '../dialog/data';

const POSITIONS = new Set(['top-start', 'top-end', 'bottom-start', 'bottom-end']);

/**
 * Visual regression demo: one toast per page load, corner chosen via `?position=`.
 */
export function init() {
  registerLanguageDictionary(arAR);

  const root = document.getElementById('root');
  const example = document.createElement('div');

  root.appendChild(example);

  const rawPosition = getFromURL('position', 'bottom-end');
  const position = POSITIONS.has(rawPosition) ? rawPosition : 'bottom-end';

  let variant = 'info';

  if (position === 'top-end') {
    variant = 'success';
  } else if (position === 'bottom-start') {
    variant = 'warning';
  } else if (position === 'bottom-end') {
    variant = 'error';
  }

  const hot = new Handsontable(example, {
    data,
    layoutDirection: getDirectionFromURL(),
    language: getDirectionFromURL() === 'rtl' ? arAR.languageCode : 'en-US',
    themeName: getThemeNameFromURL(),
    rowHeaders: true,
    colHeaders: [
      'Company name',
      'Country',
      'Name',
      'Sell date',
      'Order ID',
      'In stock',
      'Qty',
    ],
    columns: [
      { data: 1, type: 'text', headerClassName: 'htRight bold-text green' },
      { data: 2, type: 'text' },
      {
        data: 3,
        type: 'text',
        headerClassName: 'htCenter bold-text italic-text',
      },
      {
        data: 4,
        type: 'date',
        allowInvalid: false,
      },
      { data: 5, type: 'text' },
      {
        data: 6,
        type: 'checkbox',
        className: 'htCenter',
        headerClassName: 'htCenter',
      },
      {
        data: 7,
        type: 'numeric',
        headerClassName: 'htRight bold-text',
      },
    ],
    notification: {
      animation: false,
    },
    width: 400,
    height: 400,
    licenseKey: 'non-commercial-and-evaluation',
  });

  hot.getPlugin('notification').showMessage({
    title: position.replace(/-/g, ' '),
    message: 'Notification visual test.',
    position,
    duration: 0,
    variant,
    closable: true,
    actions: [
      {
        label: 'Action',
        type: 'primary',
        callback: () => {
          console.log('Action clicked');
        },
      },
      {
        label: 'Action',
        type: 'secondary',
        callback: () => {
          console.log('Action clicked');
        },
      },
    ],
  });

  console.log(`Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`);
}
