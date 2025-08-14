import Handsontable from '../../base';
import { BasePlugin } from '../base';
import { registerPlugin } from '../';

describe('plugins dependencies', () => {
  it('should throw an error when the dependencies are missing', () => {
    class CustomPlugin extends BasePlugin {
      static get PLUGIN_DEPS() {
        return [
          'plugin:NonExistingPlugin',
          'cell-type:NonExistingCellType',
          'editor:NonExistingEditor',
          'renderer:NonExistingRenderer',
          'validator:NonExistingValidator',
        ];
      }
    }

    registerPlugin('CustomPlugin', CustomPlugin);

    let hot;

    expect(() => {
      hot = new Handsontable(document.createElement('div'), {});
    }).toThrowWithCause(`The CustomPlugin plugin requires the following modules:
 - NonExistingPlugin (plugin)
 - NonExistingCellType (cell-type)
 - NonExistingEditor (editor)
 - NonExistingRenderer (renderer)
 - NonExistingValidator (validator)

You have to import and register them manually.`, { handsontable: true });
    expect(hot).toBeUndefined();
  });

  it('should throw an error when the dependency type is unknown', () => {
    class CustomPlugin extends BasePlugin {
      static get PLUGIN_DEPS() {
        return [
          'unknown-key:NonExistingPlugin',
        ];
      }
    }

    registerPlugin('CustomPlugin2', CustomPlugin);

    let hot;

    expect(() => {
      hot = new Handsontable(document.createElement('div'), {});
    }).toThrowWithCause('Unknown plugin dependency type "unknown-key" was found.', { handsontable: true });
    expect(hot).toBeUndefined();
  });
});
