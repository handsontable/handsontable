import Handsontable from 'handsontable/base';
import { registerPlugin, BasePlugin, getPluginsNames } from 'handsontable/plugins';
import { registerAllModules } from 'handsontable/registry';

const PROBE = 'readyStepProbe';
const PARENT = 'readyStepParentProbe';
const CHILD = 'readyStepChildProbe';
const DISABLER = 'readyStepDisablerProbe';
const RETURNING = 'readyStepReturningProbe';
const log = [];

/**
 * Records its ready steps with what the grid offers at that moment. Its `updatePlugin()` disables and
 * enables it, the way most plugins update.
 */
class ReadyStepProbe extends BasePlugin {
  static get PLUGIN_KEY() {
    return PROBE;
  }

  static get PLUGIN_PRIORITY() {
    return 966;
  }

  isEnabled() {
    return !!this.hot.getSettings()[PROBE];
  }

  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();
    log.push(['update end', PROBE]);
    super.updatePlugin();
  }

  onGridReady() {
    log.push(['ready', PROBE, {
      view: !!this.hot.view,
      rows: this.hot.countRows(),
      firstCell: this.hot.getDataAtCell(0, 0),
    }]);

    if (this.getSetting('writeOnReady')) {
      this.hot.setDataAtCell(0, 0, 'written by the ready step');
    }

    if (this.getSetting('updateOnReady')) {
      this.updatePlugin();
    }

    if (this.getSetting('throwOnReady')) {
      throw new Error('a ready step failed');
    }
  }

  destroy() {
    if (this.hot && this.getSetting('updateOnDestroy')) {
      this.updatePlugin();
    }

    super.destroy();
  }
}

/**
 * Its lifecycle methods return values, which the types do not promise and a subclass may still rely on.
 */
class ReturningProbe extends BasePlugin {
  static get PLUGIN_KEY() {
    return RETURNING;
  }

  static get PLUGIN_PRIORITY() {
    return 970;
  }

  isEnabled() {
    return false;
  }

  enablePlugin() {
    super.enablePlugin();

    return 'enabled';
  }

  updatePlugin() {
    super.updatePlugin();

    return 'updated';
  }

  disablePlugin() {
    super.disablePlugin();

    return 'disabled';
  }
}

/**
 * Enables the child plugin directly from its own `enablePlugin()`, the way Filters re-enables DropdownMenu.
 */
class ParentProbe extends BasePlugin {
  static get PLUGIN_KEY() {
    return PARENT;
  }

  static get PLUGIN_PRIORITY() {
    return 967;
  }

  isEnabled() {
    return !!this.hot.getSettings()[PARENT];
  }

  enablePlugin() {
    this.hot.getPlugin(CHILD).enablePlugin();
    log.push(['enable end', PARENT]);
    super.enablePlugin();
  }

  onGridReady() {
    log.push(['ready', PARENT]);
  }
}

/**
 * Enabled by the parent plugin only.
 */
class ChildProbe extends BasePlugin {
  static get PLUGIN_KEY() {
    return CHILD;
  }

  static get PLUGIN_PRIORITY() {
    return 968;
  }

  isEnabled() {
    return false;
  }

  enablePlugin() {
    log.push(['enable', CHILD]);
    super.enablePlugin();
  }

  onGridReady() {
    log.push(['ready', CHILD]);
  }
}

/**
 * Disables the probe from its own `enablePlugin()`, so the probe is enabled and disabled in one pass.
 */
class DisablerProbe extends BasePlugin {
  static get PLUGIN_KEY() {
    return DISABLER;
  }

  static get PLUGIN_PRIORITY() {
    return 969;
  }

  isEnabled() {
    return !!this.hot.getSettings()[DISABLER];
  }

  enablePlugin() {
    this.hot.getPlugin(PROBE).disablePlugin();
    super.enablePlugin();
  }
}

registerPlugin(ReadyStepProbe);
registerPlugin(ParentProbe);
registerPlugin(ChildProbe);
registerPlugin(DisablerProbe);
registerPlugin(ReturningProbe);
registerAllModules();

const roots = [];

const createGrid = (settings) => {
  const root = document.createElement('div');

  document.body.appendChild(root);
  roots.push(root);

  return new Handsontable(root, {
    data: [[1, 2], [3, 4]],
    licenseKey: 'non-commercial-and-evaluation',
    afterRender() {
      log.push(['render']);
    },
    ...settings,
  });
};

const readySteps = (key = PROBE) => log.filter(([step, plugin]) => step === 'ready' && plugin === key);

/**
 * Checks that the log, cleared right before the call, shows the step ahead of the call's first render.
 */
const expectStepBeforeFirstRender = () => {
  const steps = log.map(([step]) => step);

  expect(steps).toContain('ready');
  expect(steps).toContain('render');
  expect(steps.indexOf('ready')).toBeLessThan(steps.indexOf('render'));
};

describe('BasePlugin ready step (`onGridReady()`)', () => {
  let hot;

  beforeEach(() => {
    log.length = 0;
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    roots.splice(0).forEach(root => root.remove());
  });

  it('should run once at init, with the view and the loaded data, before the `init` hook and the first render', () => {
    hot = createGrid({
      [PROBE]: true,
      init() {
        log.push(['init hook']);
      },
    });

    const steps = log.map(([step]) => step);

    expect(readySteps()).toEqual([
      ['ready', PROBE, { view: true, rows: 2, firstCell: 1 }],
    ]);
    expect(steps.indexOf('ready')).toBeLessThan(steps.indexOf('init hook'));
    expect(steps.indexOf('ready')).toBeLessThan(steps.indexOf('render'));
  });

  ['loadData', 'updateData'].forEach((method) => {
    const hookName = `before${method[0].toUpperCase()}${method.slice(1)}`;

    it(`should run a step a \`${method}()\` hook makes the plugin owe against the new rows, before the render`, () => {
      hot = createGrid({ [PROBE]: true });
      hot.addHook(hookName, () => hot.getPlugin(PROBE).updatePlugin());
      log.length = 0;

      hot[method]([[5], [6], [7]]);

      expect(readySteps()).toEqual([
        ['ready', PROBE, { view: true, rows: 3, firstCell: 5 }],
      ]);
      expectStepBeforeFirstRender();
    });
  });

  it('should run a step an `alter()` hook makes the plugin owe after the alteration, before the render', () => {
    hot = createGrid({ [PROBE]: true });
    hot.addHook('beforeRemoveRow', () => hot.getPlugin(PROBE).updatePlugin());
    log.length = 0;

    hot.alter('remove_row', 0);

    expect(readySteps()).toEqual([
      ['ready', PROBE, { view: true, rows: 1, firstCell: 3 }],
    ]);
    expectStepBeforeFirstRender();
  });

  it('should run once for each `updateSettings()` that enables or updates the plugin, before its render', () => {
    hot = createGrid();
    log.length = 0;

    hot.updateSettings({ [PROBE]: true });

    expect(readySteps().length).toBe(1);
    expectStepBeforeFirstRender();

    log.length = 0;

    hot.updateSettings({ [PROBE]: { writeOnReady: false } });

    expect(readySteps().length).toBe(1);
    expectStepBeforeFirstRender();

    log.length = 0;

    hot.updateSettings({ colHeaders: true });

    expect(readySteps()).toEqual([]);
  });

  it('should not run a step that threw again on a later pass', () => {
    hot = createGrid();

    expect(() => hot.updateSettings({ [PROBE]: { throwOnReady: true } })).toThrow('a ready step failed');
    expect(readySteps().length).toBe(1);

    hot.updateSettings({ colHeaders: true });

    expect(readySteps().length).toBe(1);
  });

  it('should not run a step a plugin comes to owe while the grid is being destroyed', () => {
    hot = createGrid({ [PROBE]: { updateOnDestroy: true } });
    log.length = 0;

    hot.destroy();
    hot = null;

    expect(log.map(([step]) => step)).toContain('update end');
    expect(readySteps()).toEqual([]);
  });

  it('should return what the lifecycle methods of the plugin return', () => {
    hot = createGrid();

    const plugin = hot.getPlugin(RETURNING);

    expect(plugin.enablePlugin()).toBe('enabled');
    expect(plugin.updatePlugin()).toBe('updated');
    expect(plugin.disablePlugin()).toBe('disabled');
  });

  it('should run once, after the whole call, for a direct `updatePlugin()` that disables and enables the plugin', () => {
    hot = createGrid({ [PROBE]: true });
    log.length = 0;

    hot.getPlugin(PROBE).updatePlugin();

    expect(log.filter(([step]) => step !== 'render').map(([step]) => step)).toEqual(['update end', 'ready']);
  });

  it('should run the step of a plugin another plugin enables directly once, after the outer call, in ' +
     'priority order', () => {
    hot = createGrid();

    hot.getPlugin(PARENT).enablePlugin();

    expect(log.filter(([step]) => step !== 'render').map(([step, plugin]) => `${step} ${plugin}`)).toEqual([
      `enable ${CHILD}`,
      `enable end ${PARENT}`,
      `ready ${PARENT}`,
      `ready ${CHILD}`,
    ]);
  });

  it('should not run for a plugin disabled in the same pass', () => {
    hot = createGrid({ [PROBE]: true, [DISABLER]: true });

    expect(hot.getPlugin(PROBE).enabled).toBe(false);
    expect(readySteps()).toEqual([]);
  });

  it('should run once on `_applySettingsAndData()`, against the data the call loads', () => {
    hot = createGrid();

    hot._applySettingsAndData({ [PROBE]: true }, [[9], [8], [7]], 'test');

    expect(readySteps()).toEqual([
      ['ready', PROBE, { view: true, rows: 3, firstCell: 9 }],
    ]);
  });

  it('should keep the step owed when the pass that enabled the plugin throws, and run it on the next pass', () => {
    hot = createGrid();

    const throwOnce = jest.fn(() => {
      hot.removeHook('afterUpdateSettings', throwOnce);
      throw new Error('a listener failed');
    });

    hot.addHook('afterUpdateSettings', throwOnce);

    expect(() => hot.updateSettings({ [PROBE]: true })).toThrow('a listener failed');
    expect(hot.getPlugin(PROBE).enabled).toBe(true);
    expect(readySteps().length).toBe(0);

    hot.updateSettings({ colHeaders: true });

    expect(readySteps().length).toBe(1);
  });

  it('should stop a step that keeps updating its plugin after one round per plugin, with a warning', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      hot = createGrid({ [PROBE]: { updateOnReady: true } });

      expect(readySteps().length).toBe(getPluginsNames().length);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('kept enabling or updating plugins'));
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('should keep enabling a plugin built on a host that is not a Handsontable instance', () => {
    const host = {
      addHook() {},
      removeHook() {},
      getSettings: () => ({}),
    };
    const plugin = new ReadyStepProbe(host);

    plugin.enablePlugin();

    expect(plugin.enabled).toBe(true);
    expect(readySteps()).toEqual([]);
  });

  it('should not record what the step changes as an undo step', () => {
    hot = createGrid({ [PROBE]: { writeOnReady: true }, undoRedo: true });

    hot.getPlugin(PROBE).updatePlugin();

    expect(hot.getDataAtCell(0, 0)).toBe('written by the ready step');
    expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(false);
  });
});
