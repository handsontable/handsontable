import { IntlTimeEditor } from '../../editors/intlTimeEditor';
import { intlTimeRenderer, valueFormatter } from '../../renderers/intlTimeRenderer';
import {
  SOURCE_DATA_WARNING_MESSAGE,
  intlTimeValidator,
  sourceDataValidator,
} from '../../validators/intlTimeValidator';
import { emptyStringToNull } from '../../helpers/mixed';

export const CELL_TYPE = 'intl-time';
export const IntlTimeCellType = {
  CELL_TYPE,
  editor: IntlTimeEditor,
  renderer: intlTimeRenderer,
  validator: intlTimeValidator,
  sourceDataValidator,
  sourceDataWarningMessage: SOURCE_DATA_WARNING_MESSAGE,
  valueFormatter,
  valueSetter: emptyStringToNull,
};
