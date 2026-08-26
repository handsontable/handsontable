import { IntlDatetimeEditor } from '../../editors/intlDatetimeEditor';
import { intlDatetimeRenderer, valueFormatter } from '../../renderers/intlDatetimeRenderer';
import {
  SOURCE_DATA_WARNING_MESSAGE,
  intlDatetimeValidator,
  sourceDataValidator,
} from '../../validators/intlDatetimeValidator';

export const CELL_TYPE = 'intl-datetime';

/**
 * Intl datetime cell type configuration object that bundles the editor, renderer, and validator.
 */
export const IntlDatetimeCellType = {
  CELL_TYPE,
  editor: IntlDatetimeEditor,
  renderer: intlDatetimeRenderer,
  validator: intlDatetimeValidator,
  sourceDataValidator,
  sourceDataWarningMessage: SOURCE_DATA_WARNING_MESSAGE,
  valueFormatter,
};
