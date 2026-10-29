import Handsontable from 'handsontable/base';
import { registerPlugin, BasePlugin, UndoRedo } from 'handsontable/plugins';
import { registerAllModules } from 'handsontable/registry';

const EARLY_KEY = 'initSequenceEarlyProbe';
const LATE_KEY = 'initSequenceLateProbe';
const log = [];

/**
 * Enabled before every built-in plugin. Its settings can name an `updateSettings()` payload it sends
 * from `enablePlugin()`, the way ColumnSorting turns a conflicting plugin off while the grid is built.
 */
class EarlyProbePlugin extends BasePlugin {
  static get PLUGIN_KEY() {
    return EARLY_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return 5;
  }

  isEnabled() {
    return !!this.hot.getSettings()[EARLY_KEY];
  }

  init() {
    log.push([this.hot.guid, 'init', EARLY_KEY]);
    super.init();
  }

  enablePlugin() {
    log.push([this.hot.guid, 'enable', EARLY_KEY]);
    // Marked enabled before the update it sends, or that update would enable this plugin again.
    super.enablePlugin();

    const payload = this.getSetting('updateOnEnable');

    if (payload) {
      this.hot.updateSettings(payload);
    }
  }
}

/**
 * Enabled after SheetsBar (910), so a sheet SheetsBar builds from its own `enablePlugin()` runs while
 * this plugin still waits for its turn.
 */
class LateProbePlugin extends BasePlugin {
  static get PLUGIN_KEY() {
    return LATE_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return 960;
  }

  static get DEFAULT_SETTINGS() {
    return { mode: 'default' };
  }

  isEnabled() {
    return !!this.hot.getSettings()[LATE_KEY];
  }

  init() {
    log.push([this.hot.guid, 'init', LATE_KEY]);
    super.init();
  }

  enablePlugin() {
    log.push([this.hot.guid, 'enable', LATE_KEY, {
      mode: this.getSetting('mode'),
      alreadyEnabled: this.enabled,
      sheetsBarEnabled: !!this.hot.getPlugin('sheetsBar')?.enabled,
    }]);
    this.addHook('afterInit', this.#onAfterInit);
    super.enablePlugin();
  }

  #onAfterInit = () => {
    log.push([this.hot.guid, 'afterInit', LATE_KEY]);
  };
}

registerPlugin(EarlyProbePlugin);
registerPlugin(LateProbePlugin);
registerAllModules();

const createRoot = () => {
  const root = document.createElement('div');

  document.body.appendChild(root);

  return root;
};

const entriesOf = (hot, step) => log.filter(([guid, entryStep]) => guid === hot.guid && entryStep === step);

describe('BasePlugin init sequence', () => {
  const grids = [];

  beforeEach(() => {
    log.length = 0;
  });

  afterEach(() => {
    grids.splice(0).forEach(hot => hot.destroy());
    jest.restoreAllMocks();
  });

  it('should run each grid\'s sequence on its own when two grids are built before either `init()` (DEV-147)', () => {
    const settings = {
      [EARLY_KEY]: true,
      [LATE_KEY]: true,
      licenseKey: 'non-commercial-and-evaluation',
    };
    const first = new Handsontable.Core(createRoot(), settings);
    const second = new Handsontable.Core(createRoot(), settings);
    const firedFor = new Map([[first, 0], [second, 0]]);

    grids.push(first, second);
    [first, second].forEach((hot) => {
      hot.addHook('afterPluginsInitialized', () => firedFor.set(hot, firedFor.get(hot) + 1));
    });

    first.init();
    second.init();

    expect(firedFor.get(first)).toBe(1);
    expect(firedFor.get(second)).toBe(1);

    // Every plugin of the second grid is initialized before any of them is enabled.
    expect(log
      .filter(([guid, step]) => guid === second.guid && (step === 'init' || step === 'enable'))
      .map(([, step, key]) => `${step} ${key}`)).toEqual([
      `init ${EARLY_KEY}`,
      `init ${LATE_KEY}`,
      `enable ${EARLY_KEY}`,
      `enable ${LATE_KEY}`,
    ]);
  });

  it('should enable a plugin that comes after SheetsBar once, after SheetsBar, when SheetsBar builds its ' +
     'first sheet (DEV-147)', () => {
    const undoRedoEnableSpy = jest.spyOn(UndoRedo.prototype, 'enablePlugin');
    const hot = new Handsontable(createRoot(), {
      sheetsBar: {
        sheets: [{ name: 'A', data: [[1, 2]] }, { name: 'B', data: [[3, 4]] }],
        activeSheet: 1,
      },
      [LATE_KEY]: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    grids.push(hot);

    expect(entriesOf(hot, 'enable').map(([, , , details]) => details)).toEqual([
      { mode: 'default', alreadyEnabled: false, sheetsBarEnabled: true },
    ]);
    expect(undoRedoEnableSpy).toHaveBeenCalledTimes(1);
    expect(hot.getDataAtCell(0, 0)).toBe(3);
  });

  it('should hand a plugin enabled later the settings a pass inside the init sequence gave it (DEV-147)', () => {
    const hot = new Handsontable(createRoot(), {
      [EARLY_KEY]: { updateOnEnable: { [LATE_KEY]: { mode: 'changed' } } },
      [LATE_KEY]: { mode: 'declared' },
      licenseKey: 'non-commercial-and-evaluation',
    });

    grids.push(hot);

    expect(entriesOf(hot, 'enable').filter(([, , key]) => key === LATE_KEY).map(([, , , details]) => details))
      .toEqual([
        { mode: 'changed', alreadyEnabled: false, sheetsBarEnabled: false },
      ]);
  });

  it('should enable the plugins between the global and the settings `beforeInit` listeners, so a plugin ' +
     'hook runs before the same hook declared in the settings', () => {
    const globalBeforeInit = function() {
      log.push([this.guid, 'beforeInit', 'global', !!this.getPlugin(LATE_KEY).enabled]);
    };

    Handsontable.hooks.add('beforeInit', globalBeforeInit);

    let hot;

    try {
      hot = new Handsontable(createRoot(), {
        [LATE_KEY]: true,
        licenseKey: 'non-commercial-and-evaluation',
        beforeInit() {
          log.push([this.guid, 'beforeInit', 'settings', this.getPlugin(LATE_KEY).enabled]);
        },
        afterInit() {
          log.push([this.guid, 'afterInit', 'settings']);
        },
      });

      grids.push(hot);
    } finally {
      Handsontable.hooks.remove('beforeInit', globalBeforeInit);
    }

    // [listener, whether the probe was enabled when it ran]
    expect(entriesOf(hot, 'beforeInit').map(([, , source, enabled]) => [source, enabled])).toEqual([
      ['global', false],
      ['settings', true],
    ]);
    // The probe added its `afterInit` listener in `enablePlugin()`, so it runs first.
    expect(entriesOf(hot, 'afterInit').map(([, , source]) => source)).toEqual([LATE_KEY, 'settings']);
  });

  it('should not enable a plugin a pass inside the init sequence turned off before its turn', () => {
    const hot = new Handsontable(createRoot(), {
      [EARLY_KEY]: { updateOnEnable: { [LATE_KEY]: false } },
      [LATE_KEY]: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    grids.push(hot);

    expect(entriesOf(hot, 'enable').map(([, , key]) => key)).toEqual([EARLY_KEY]);
    expect(hot.getPlugin(LATE_KEY).enabled).toBe(false);
  });
});
