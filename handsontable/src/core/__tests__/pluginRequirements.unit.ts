import { PluginRequirements } from '../pluginRequirements';

describe('PluginRequirements', () => {
  it('should report a plugin nobody requires as not required', () => {
    const requirements = new PluginRequirements();

    expect(requirements.isRequired('dialog')).toBe(false);
  });

  it('should keep a plugin required until the last requirer releases it', () => {
    const requirements = new PluginRequirements();
    const first = {};
    const second = {};

    requirements.require('dialog', first);
    requirements.require('dialog', second);

    expect(requirements.isRequired('dialog')).toBe(true);

    requirements.release('dialog', first);

    expect(requirements.isRequired('dialog')).toBe(true);

    requirements.release('dialog', second);

    expect(requirements.isRequired('dialog')).toBe(false);
  });

  it('should count one requirer once, however often it requires the plugin', () => {
    const requirements = new PluginRequirements();
    const requirer = {};

    requirements.require('dialog', requirer);
    requirements.require('dialog', requirer);
    requirements.release('dialog', requirer);

    expect(requirements.isRequired('dialog')).toBe(false);
  });

  it('should change nothing when an unknown requirer releases a plugin', () => {
    const requirements = new PluginRequirements();

    requirements.release('dialog', {});

    expect(requirements.isRequired('dialog')).toBe(false);

    requirements.require('dialog', {});
    requirements.release('dialog', {});

    expect(requirements.isRequired('dialog')).toBe(true);
  });

  it('should keep the requirements of each plugin key apart', () => {
    const requirements = new PluginRequirements();
    const requirer = {};

    requirements.require('dialog', requirer);

    expect(requirements.isRequired('loading')).toBe(false);

    requirements.release('loading', requirer);

    expect(requirements.isRequired('dialog')).toBe(true);
  });
});
