import Handsontable from 'handsontable';
import { registerLanguageDictionary } from 'handsontable/i18n';
import srSP from 'handsontable/i18n/languages/sr-SP';
import { srLatnRS } from 'handsontable/i18n/languages';

registerLanguageDictionary(srSP);
registerLanguageDictionary(srLatnRS);

new Handsontable(document.querySelector('#grid'), { data: [[1]], language: 'sr-SP' });

// The new code is not reported.
new Handsontable(document.querySelector('#other'), { data: [[1]], language: 'sr-Latn-RS' });
