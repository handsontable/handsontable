import Handsontable from 'handsontable';
import { fireEvent } from '@testing-library/dom';

const hot = new Handsontable(document.getElementById('grid')!, { licenseKey: 'your-license-key' });
const header = hot.rootElement.querySelector('thead th:nth-child(2)')!;

header.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
fireEvent.mouseDown(header);
$(header).trigger('mousedown');

// Press and release on the label is what 18.1 sorts on.
const label = header.querySelector('.colHeader.sortAction')!;

label.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

// A different event is fine.
header.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));
