import 'babel-polyfill';
import Handsontable from 'handsontable';

/* eslint-disable no-unused-vars */
import * as plugins from './plugins/index';
/* eslint-enable no-unused-vars */

Handsontable.baseVersion = process.env.HOT_BASE_VERSION;

export default Handsontable;
