import { GridSettings } from '../settings';
import { BaseEditor } from '../editors/baseEditor';
import { BaseRenderer } from '../renderers/base';
import { BaseValidator } from '../validators/base';

export interface CellTypeObject extends GridSettings {
  editor?: typeof BaseEditor;
  renderer?: BaseRenderer;
  validator?: BaseValidator;
  /**
   * Custom properties which will be accessible in `cellProperties`
   */
  [key: string]: any;
}
