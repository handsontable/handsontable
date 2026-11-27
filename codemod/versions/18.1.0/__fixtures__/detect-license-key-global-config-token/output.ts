import Handsontable from 'handsontable';
import { HOT_GLOBAL_CONFIG } from './tokens';

// The application sets the license key once, in the HOT_GLOBAL_CONFIG provider, so a grid sets none of its own.
export const providers = [{ provide: HOT_GLOBAL_CONFIG, useValue: { license: 'your-license-key' } }];

const container = document.querySelector<HTMLElement>('#grid')!;

new Handsontable(container, {
  data: [['a']],
});
