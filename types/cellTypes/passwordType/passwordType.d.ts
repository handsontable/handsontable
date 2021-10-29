import { CellTypeObject } from '../base';
import { PasswordEditor } from '../../editors/passwordEditor';
import { passwordRenderer } from '../../renderers/passwordRenderer';

export const CELL_TYPE: 'password';
export interface PasswordCellType extends CellTypeObject {
  editor: typeof PasswordEditor;
  renderer: typeof passwordRenderer;
}

export namespace PasswordCellType {
  export { PasswordEditor as editor };
  export { passwordRenderer as renderer };
}
