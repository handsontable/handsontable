import { IntlDateEditor } from '../../editors/intlDateEditor';
import { intlDateRenderer, valueFormatter } from '../../renderers/intlDateRenderer';
import {
  SOURCE_DATA_WARNING_MESSAGE,
  intlDateValidator,
  sourceDataValidator,
} from '../../validators/intlDateValidator';

export const CELL_TYPE = 'intl-date';
export const IntlDateCellType = {
  CELL_TYPE,
  editor: IntlDateEditor,
  renderer: intlDateRenderer,
  validator: intlDateValidator,
  sourceDataValidator,
  sourceDataWarningMessage: SOURCE_DATA_WARNING_MESSAGE,
  valueFormatter,
};
