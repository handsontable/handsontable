import { CellTypeObject } from '../base';
import { IntlDateEditor } from '../../editors/intlDateEditor';
import { intlDateRenderer, valueFormatter } from '../../renderers/intlDateRenderer';
import { intlDateValidator, sourceDataValidator } from '../../validators/intlDateValidator';

export const CELL_TYPE: 'intlDate';
export interface IntlDateCellType extends CellTypeObject {
  editor: typeof IntlDateEditor;
  renderer: typeof intlDateRenderer;
  validator: typeof intlDateValidator;
  sourceDataValidator: typeof sourceDataValidator;
  sourceDataWarningMessage: string;
  valueFormatter: typeof valueFormatter;
}

export namespace IntlDateCellType {
  export { IntlDateCellType as cellType };
  export { IntlDateEditor as editor };
  export { intlDateRenderer as renderer };
  export { intlDateValidator as validator };
  export { sourceDataValidator as sourceDataValidator };
  export { valueFormatter as valueFormatter };
}
