import Handsontable from 'handsontable';

// A docs URL and a sentence hold the key text, but they are not a key.
export const DOCS = 'https://example.test/#the-non-commercial-and-evaluation-license-key-no-longer-works';
export const HINT = 'Replace non-commercial-and-evaluation before you ship';

new Handsontable(document.querySelector('#grid'), { data: [[1]], licenseKey: 'my-own-key' });
