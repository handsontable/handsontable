import Handsontable from '../../base';
import { BasePlugin } from '../base';
import { registerPlugin } from '../';

describe('plugins dependencies', () => {
  it('should be possible to add dependencies', () => {
    class CustomPlugin extends BasePlugin {
      dependecies = [
        () => (this.hot.getPlugin('NonExistingPlugin') ? '' : 'NonExistingPlugin')
      ]
    }

    registerPlugin('CustomPlugin', CustomPlugin);

    let hot;

    expect(() => {
      hot = new Handsontable(document.createElement('div'), {});
    }).toThrowError([
      'Plugin CustomPlugin requires the following modules:',
      'NonExistingPlugin',
      'You have to import and register them manually.',
    ].join('\n'));
    expect(hot).toBeUndefined();
  });
});
