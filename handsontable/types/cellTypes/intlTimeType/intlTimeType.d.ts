import { CellTypeObject } from '../base';
import { IntlTimeEditor } from '../../editors/intlTimeEditor';
import { intlTimeRenderer, valueFormatter } from '../../renderers/intlTimeRenderer';
import { intlTimeValidator, sourceDataValidator } from '../../validators/intlTimeValidator';

export const CELL_TYPE: 'intl-time';
export interface IntlTimeCellType extends CellTypeObject {
  editor: typeof IntlTimeEditor;
  renderer: typeof intlTimeRenderer;
  validator: typeof intlTimeValidator;
  sourceDataValidator: typeof sourceDataValidator;
  sourceDataWarningMessage: string;
  valueFormatter: typeof valueFormatter;
}

export namespace IntlTimeCellType {
  export { IntlTimeCellType as cellType };
  export { IntlTimeEditor as editor };
  export { intlTimeRenderer as renderer };
  export { intlTimeValidator as validator };
  export { sourceDataValidator };
  export { valueFormatter };
}
