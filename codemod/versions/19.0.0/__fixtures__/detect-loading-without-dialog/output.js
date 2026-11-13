import Handsontable from 'handsontable/base';
import { registerPlugin, Loading } from 'handsontable/plugins';

// TODO(handsontable-codemod 19.0.0/loading-without-dialog): Add the Dialog plugin next to Loading. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#the-loading-plugin-needs-the-dialog-plugin-registered
registerPlugin(Loading);
