import { IntlDateEditor } from '../../editors/intlDateEditor';
import { intlDateRenderer, valueFormatter } from '../../renderers/intlDateRenderer';
import { intlDateValidator } from '../../validators/intlDateValidator';

export const CELL_TYPE = 'intlDate';
export const IntlDateCellType = {
  CELL_TYPE,
  editor: IntlDateEditor,
  renderer: intlDateRenderer,
  validator: intlDateValidator,
  valueFormatter,
};
