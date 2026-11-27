import Handsontable from 'handsontable/base';
import { registerPlugin, Loading as LoadingPlugin } from 'handsontable/plugins';

registerPlugin(LoadingPlugin);
new Handsontable(document.body, { loading: true });
