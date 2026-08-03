import { DatetimeEditor } from '../../editors/datetimeEditor';
import { datetimeRenderer, valueFormatter } from '../../renderers/datetimeRenderer';
import {
  SOURCE_DATA_WARNING_MESSAGE,
  datetimeValidator,
  sourceDataValidator,
} from '../../validators/datetimeValidator';

export const CELL_TYPE: 'datetime' = 'datetime';

/**
 * Datetime cell type configuration object that bundles the editor, renderer, and validator.
 */
export const DatetimeCellType = {
  CELL_TYPE,
  editor: DatetimeEditor,
  renderer: datetimeRenderer,
  validator: datetimeValidator,
  sourceDataValidator,
  sourceDataWarningMessage: SOURCE_DATA_WARNING_MESSAGE,
  valueFormatter,
};
