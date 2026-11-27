import Handsontable from 'handsontable/base';
import { registerPlugin, Loading, Dialog as DialogPlugin } from 'handsontable/plugins';

registerPlugin(Loading);
registerPlugin(DialogPlugin);
new Handsontable(document.body, { loading: true });
