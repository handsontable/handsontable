import Handsontable from 'handsontable';
import { HOT_GLOBAL_CONFIG, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

new Handsontable(document.querySelector('#grid'), {
  data: [[1]],
  licenseKey: 'non-commercial-and-evaluation',
});

new Handsontable(document.querySelector('#other'), { licenseKey: 'Non-Commercial-And-Evaluation' });
new Handsontable(document.querySelector('#third'), { licenseKey: 'ht68e-1f2b7-47158-70b05-0842f' });

export const providers = [{ provide: HOT_GLOBAL_CONFIG, useValue: { license: NON_COMMERCIAL_LICENSE } }];

// Another key is not reported.
new Handsontable(document.querySelector('#own'), {
  // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
  data: [[2]],
});
