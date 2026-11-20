import Handsontable from 'handsontable';
import { registerLanguageDictionary } from 'handsontable/i18n';
// TODO(handsontable-codemod 19.0.0/sr-sp-language-code): Replace the sr-SP language code with sr-Latn-RS.
import srSP from 'handsontable/i18n/languages/sr-SP';
import { srLatnRS } from 'handsontable/i18n/languages';

// TODO(handsontable-codemod 19.0.0/sr-sp-language-code): Replace the sr-SP language code with sr-Latn-RS.
registerLanguageDictionary(srSP);
registerLanguageDictionary(srLatnRS);

// TODO(handsontable-codemod 19.0.0/sr-sp-language-code): Replace the sr-SP language code with sr-Latn-RS.
new Handsontable(document.querySelector('#grid'), { data: [[1]], language: 'sr-SP' });

// The new code is not reported.
new Handsontable(document.querySelector('#other'), { data: [[1]], language: 'sr-Latn-RS' });
