import 'babel-polyfill';
import Handsontable from 'handsontable';

import * as plugins from './plugins/index';

import BottomOverlay from './3rdparty/walkontable/src/overlay/bottom';
import BottomLeftCornerOverlay from './3rdparty/walkontable/src/overlay/bottomLeftCorner';

Handsontable.baseVersion = process.env.HOT_BASE_VERSION;

export default Handsontable;
