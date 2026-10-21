import { PasswordEditor } from '../../editors/passwordEditor';
import { passwordRenderer, valueFormatter } from '../../renderers/passwordRenderer';

export const CELL_TYPE: 'password' = 'password';
export const PasswordCellType = {
  CELL_TYPE,
  editor: PasswordEditor,
  renderer: passwordRenderer,
  copyable: false,
  valueFormatter,
};
