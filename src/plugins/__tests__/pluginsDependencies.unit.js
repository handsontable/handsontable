import Handsontable from '../../base';
import { BasePlugin } from '../base';
import { registerPlugin } from '../';

describe('plugins dependencies', () => {
  it('should be possible to add dependencies', () => {
    class CustomPlugin extends BasePlugin {
      static get PLUGIN_DEPS() {
        return [
          'plugin:NonExistingPlugin',
        ];
      }
    }

    registerPlugin('CustomPlugin', CustomPlugin);

    let hot;

    expect(() => {
      hot = new Handsontable(document.createElement('div'), {});
    }).toThrowError([
      'The CustomPlugin plugin requires the following modules:',
      ' - NonExistingPlugin (plugin)',
      'You have to import and register them manually.',
    ].join('\n'));
    expect(hot).toBeUndefined();
  });
});
