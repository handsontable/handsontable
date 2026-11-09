import Handsontable from '../../base';
import { TEST_LICENSE_KEY } from '../../../test/helpers/licenseKey';

describe('Core plugin requirements', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    hot = new Handsontable(container, {
      data: [['a']],
      licenseKey: TEST_LICENSE_KEY,
    });
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  it('reports a plugin nobody requires as not required', () => {
    expect(hot._isPluginRequired('dialog')).toBe(false);
  });

  it('keeps a plugin required until the last requirer releases it', () => {
    const first = {};
    const second = {};

    hot._requirePlugin('dialog', first);
    hot._requirePlugin('dialog', second);

    expect(hot._isPluginRequired('dialog')).toBe(true);

    hot._releasePlugin('dialog', first);

    expect(hot._isPluginRequired('dialog')).toBe(true);

    hot._releasePlugin('dialog', second);

    expect(hot._isPluginRequired('dialog')).toBe(false);
  });

  it('counts one requirer once, however often it requires the plugin', () => {
    const requirer = {};

    hot._requirePlugin('dialog', requirer);
    hot._requirePlugin('dialog', requirer);
    hot._releasePlugin('dialog', requirer);

    expect(hot._isPluginRequired('dialog')).toBe(false);
  });

  it('changes nothing when an unknown requirer releases a plugin', () => {
    hot._releasePlugin('dialog', {});

    expect(hot._isPluginRequired('dialog')).toBe(false);

    hot._requirePlugin('dialog', {});
    hot._releasePlugin('dialog', {});

    expect(hot._isPluginRequired('dialog')).toBe(true);
  });

  it('keeps the requirements of each plugin key apart', () => {
    const requirer = {};

    hot._requirePlugin('dialog', requirer);

    expect(hot._isPluginRequired('loading')).toBe(false);

    hot._releasePlugin('loading', requirer);

    expect(hot._isPluginRequired('dialog')).toBe(true);
  });

  it('keeps the requirements of each instance apart', () => {
    const otherContainer = document.createElement('div');

    document.body.appendChild(otherContainer);

    const other = new Handsontable(otherContainer, {
      data: [['a']],
      licenseKey: TEST_LICENSE_KEY,
    });

    hot._requirePlugin('dialog', {});

    expect(other._isPluginRequired('dialog')).toBe(false);

    other.destroy();
    otherContainer.remove();
  });
});
