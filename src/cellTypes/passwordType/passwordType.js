import { PasswordEditor } from '../../editors/passwordEditor';
import { passwordRenderer } from '../../renderers/passwordRenderer';

export const CELL_TYPE = 'password';
export const PasswordCellType = {
  CELL_TYPE,
  editor: PasswordEditor,
  renderer: passwordRenderer,
  copyable: false,
};
