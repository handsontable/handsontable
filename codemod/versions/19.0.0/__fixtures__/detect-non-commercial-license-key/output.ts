import Handsontable from 'handsontable';
// TODO(handsontable-codemod 19.0.0/non-commercial-license-key): Replace this license key with your own before you upgrade. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#the-non-commercial-and-evaluation-license-key-no-longer-works
import { HOT_GLOBAL_CONFIG, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

new Handsontable(document.querySelector('#grid'), {
  data: [[1]],
  // TODO(handsontable-codemod 19.0.0/non-commercial-license-key): Replace this license key with your own before you upgrade. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#the-non-commercial-and-evaluation-license-key-no-longer-works
  licenseKey: 'non-commercial-and-evaluation',
});

// TODO(handsontable-codemod 19.0.0/non-commercial-license-key): Replace this license key with your own before you upgrade. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#the-non-commercial-and-evaluation-license-key-no-longer-works
new Handsontable(document.querySelector('#other'), { licenseKey: 'Non-Commercial-And-Evaluation' });
// TODO(handsontable-codemod 19.0.0/non-commercial-license-key): Replace this license key with your own before you upgrade. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#the-non-commercial-and-evaluation-license-key-no-longer-works
new Handsontable(document.querySelector('#third'), { licenseKey: 'ht68e-1f2b7-47158-70b05-0842f' });

// TODO(handsontable-codemod 19.0.0/non-commercial-license-key): Replace this license key with your own before you upgrade. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#the-non-commercial-and-evaluation-license-key-no-longer-works
export const providers = [{ provide: HOT_GLOBAL_CONFIG, useValue: { license: NON_COMMERCIAL_LICENSE } }];

// Another key is not reported.
new Handsontable(document.querySelector('#own'), {
  // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
  data: [[2]],
});
