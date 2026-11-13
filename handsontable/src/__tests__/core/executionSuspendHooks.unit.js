import Core from 'handsontable/core';
import { Hooks } from 'handsontable/core/hooks';
import { registerCellType, TextCellType } from 'handsontable/cellTypes';
import { registerRenderer, baseRenderer, textRenderer } from 'handsontable/renderers';
import { registerPlugin, AutoColumnSize, AutoRowSize } from 'handsontable/plugins';
import { safeBatch } from 'handsontable/utils/safeBatch';
import { rootInstanceSymbol } from 'handsontable/utils/rootInstance';
import { TEST_LICENSE_KEY } from '../../../test/helpers/licenseKey';

registerCellType(TextCellType);
registerRenderer(baseRenderer);
registerRenderer(textRenderer);
registerPlugin(AutoColumnSize);
registerPlugin(AutoRowSize);

const EXECUTION_HOOKS = [
  'beforeSuspendExecution',
  'afterSuspendExecution',
  'beforeResumeExecution',
  'afterResumeExecution',
];
const SUSPEND_PAIR = ['beforeSuspendExecution', 'afterSuspendExecution'];
const RESUME_PAIR = ['beforeResumeExecution', 'afterResumeExecution'];
const FULL_CYCLE = [...SUSPEND_PAIR, ...RESUME_PAIR];

/**
 * Builds a root instance, the kind `new Handsontable()` and the wrappers build.
 *
 * @param {HTMLElement} container Host element.
 * @param {object} [settings] Handsontable settings.
 * @returns {Core} An initialized Core instance.
 */
function createHot(container, settings = {}) {
  const hot = new Core(container, {
    theme: 'ht-theme-main',
    licenseKey: TEST_LICENSE_KEY,
    data: [['a1', 'b1'], ['a2', 'b2'], ['a3', 'b3']],
    ...settings,
  }, rootInstanceSymbol);

  hot.init();

  return hot;
}

/**
 * Adds a listener to each of the four hooks that records the hook name in the returned log.
 *
 * @param {Core} hot The Handsontable instance.
 * @returns {string[]} The log the listeners write to.
 */
function recordExecutionHooks(hot) {
  const log = [];

  EXECUTION_HOOKS.forEach((hookName) => {
    hot.addHook(hookName, () => log.push(hookName));
  });

  return log;
}

describe('execution suspend hooks', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (hot && !hot.isDestroyed) {
      hot.destroy();
    }

    hot = null;
    container.remove();
  });

  it('should register all four hooks', () => {
    const hooks = Hooks.getSingleton();

    expect(EXECUTION_HOOKS.filter(hookName => !hooks.isRegistered(hookName))).toEqual([]);
  });

  it('should fire callbacks declared in the settings', () => {
    const log = [];
    const settings = {};

    EXECUTION_HOOKS.forEach((hookName) => {
      settings[hookName] = () => log.push(hookName);
    });

    hot = createHot(container, settings);
    log.length = 0;

    hot.suspendExecution();
    hot.resumeExecution();

    expect(log).toEqual(FULL_CYCLE);
  });

  describe('transition-only firing', () => {
    it('should fire the suspend pair only when the counter goes from 0 to 1', () => {
      hot = createHot(container);

      const log = recordExecutionHooks(hot);

      hot.suspendExecution();

      expect(log).toEqual(SUSPEND_PAIR);

      hot.suspendExecution();
      hot.suspendExecution();

      expect(log).toEqual(SUSPEND_PAIR);

      hot.resumeExecution();
      hot.resumeExecution();
      hot.resumeExecution();
    });

    it('should fire the resume pair only when the counter goes back to 0', () => {
      hot = createHot(container);
      hot.suspendExecution();
      hot.suspendExecution();

      const log = recordExecutionHooks(hot);

      hot.resumeExecution();

      expect(log).toEqual([]);
      expect(hot.isExecutionSuspended()).toBe(true);

      hot.resumeExecution();

      expect(log).toEqual(RESUME_PAIR);
      expect(hot.isExecutionSuspended()).toBe(false);
    });

    it('should not fire on a forced nested resume, and fire once at the outermost one', () => {
      hot = createHot(container);
      hot.suspendExecution();
      hot.suspendExecution();

      const log = recordExecutionHooks(hot);

      hot.resumeExecution(true);

      // The forced flush resumes the mappers while the counter is still raised.
      expect(hot.rowIndexMapper.isBatched).toBe(false);
      expect(hot.isExecutionSuspended()).toBe(true);
      expect(log).toEqual([]);

      hot.resumeExecution();

      expect(log).toEqual(RESUME_PAIR);
    });

    it('should fire the resume pair on a forced resume that brings the counter to 0', () => {
      hot = createHot(container);

      const log = recordExecutionHooks(hot);

      hot.suspendExecution();
      hot.resumeExecution(true);

      expect(log).toEqual(FULL_CYCLE);
    });

    it('should not fire on a stray resume at counter 0, forced or not', () => {
      hot = createHot(container);

      const log = recordExecutionHooks(hot);

      hot.resumeExecution();
      hot.resumeExecution(true);

      expect(log).toEqual([]);
      expect(hot.isExecutionSuspended()).toBe(false);

      hot.suspendExecution();
      hot.resumeExecution();

      expect(log).toEqual(FULL_CYCLE);
    });
  });

  describe('order', () => {
    it('should run each before hook on the old state and each after hook on the new one', () => {
      hot = createHot(container);

      const states = [];

      EXECUTION_HOOKS.forEach((hookName) => {
        hot.addHook(hookName, () => {
          states.push([
            hookName,
            hot.isExecutionSuspended(),
            hot.rowIndexMapper.isBatched,
            hot.columnIndexMapper.isBatched,
          ]);
        });
      });

      hot.suspendExecution();
      hot.resumeExecution();

      expect(states).toEqual([
        ['beforeSuspendExecution', false, false, false],
        ['afterSuspendExecution', true, true, true],
        ['beforeResumeExecution', true, true, true],
        ['afterResumeExecution', false, false, false],
      ]);
    });

    it('should run afterResumeExecution after the index cache update the resume triggers', () => {
      hot = createHot(container);

      const visualRowOfPhysicalZero = [];

      hot.addHook('beforeResumeExecution', () => {
        visualRowOfPhysicalZero.push(['beforeResumeExecution', hot.toVisualRow(0)]);
      });
      hot.addHook('afterResumeExecution', () => {
        visualRowOfPhysicalZero.push(['afterResumeExecution', hot.toVisualRow(0)]);
      });

      hot.suspendExecution();
      hot.rowIndexMapper.setIndexesSequence([2, 1, 0]);
      hot.resumeExecution();

      expect(visualRowOfPhysicalZero).toEqual([
        ['beforeResumeExecution', 0],
        ['afterResumeExecution', 2],
      ]);
    });
  });

  describe('batch methods', () => {
    it.each([
      ['batch', (instance, fn) => instance.batch(fn)],
      ['batchExecution', (instance, fn) => instance.batchExecution(fn)],
      ['batchExecution (forced flush)', (instance, fn) => instance.batchExecution(fn, true)],
      ['safeBatch', (instance, fn) => safeBatch(instance, fn)],
    ])('%s should fire each pair once, around the callback', (name, run) => {
      hot = createHot(container);

      const log = recordExecutionHooks(hot);

      run(hot, () => {
        log.push('callback');
        hot.suspendExecution();
        hot.resumeExecution();
        hot.batchExecution(() => {});
      });

      expect(log).toEqual([...SUSPEND_PAIR, 'callback', ...RESUME_PAIR]);
    });

    it('should fire each pair once for nested batch calls', () => {
      hot = createHot(container);

      const log = recordExecutionHooks(hot);

      hot.batch(() => {
        hot.batch(() => {
          hot.batchExecution(() => {
            log.push('callback');
          }, true);
        });
      });

      expect(log).toEqual([...SUSPEND_PAIR, 'callback', ...RESUME_PAIR]);
    });

    it('should also fire for the suspensions Handsontable makes itself, after the batch resumed', () => {
      // AutoColumnSize and AutoRowSize measure in `batchExecution()` on the render that `batch()` ends with.
      hot = createHot(container, {
        autoColumnSize: true,
        autoRowSize: true,
        renderAllRows: true,
        renderAllColumns: true,
      });

      const log = recordExecutionHooks(hot);

      hot.batch(() => {
        log.push('callback');
        hot.setDataAtCell(0, 0, 'a much longer value than before');
        hot.setDataAtCell(1, 0, 'x');
      });

      expect(log.slice(0, 5)).toEqual([...SUSPEND_PAIR, 'callback', ...RESUME_PAIR]);

      const trailing = log.slice(5);

      // The render adds whole cycles, each one a suspension of its own (3 with these two plugins in jsdom).
      expect(trailing.length).toBeGreaterThan(0);
      expect(trailing.length % FULL_CYCLE.length).toBe(0);
      expect(trailing).toEqual(Array.from({ length: trailing.length / 4 }, () => FULL_CYCLE).flat());
      expect(hot.isExecutionSuspended()).toBe(false);
    });

    it('should run a full nested cycle for a batch made from an afterResumeExecution listener', () => {
      hot = createHot(container);

      const log = recordExecutionHooks(hot);
      let batchedOnce = false;

      hot.addHook('afterResumeExecution', () => {
        if (!batchedOnce) {
          batchedOnce = true;
          hot.batchExecution(() => log.push('nested callback'));
        }
      });

      hot.batchExecution(() => log.push('callback'));

      expect(log).toEqual([
        ...SUSPEND_PAIR,
        'callback',
        ...RESUME_PAIR,
        ...SUSPEND_PAIR,
        'nested callback',
        ...RESUME_PAIR,
      ]);
      expect(hot.isExecutionSuspended()).toBe(false);
    });

    it.each([
      ['afterSuspendExecution', [...SUSPEND_PAIR, 'nested', 'callback', ...RESUME_PAIR]],
      ['beforeResumeExecution', [...SUSPEND_PAIR, 'callback', RESUME_PAIR[0], 'nested', RESUME_PAIR[1]]],
    ])('should fire no hooks for a balanced batch made from a %s listener', (hookName, expected) => {
      hot = createHot(container);

      const log = recordExecutionHooks(hot);
      const batchedMappers = [];
      let batchedOnce = false;

      hot.addHook(hookName, () => {
        if (!batchedOnce) {
          batchedOnce = true;
          hot.batchExecution(() => {
            log.push('nested');
            batchedMappers.push(hot.rowIndexMapper.isBatched, hot.columnIndexMapper.isBatched);
          });
        }
      });

      hot.batchExecution(() => log.push('callback'));

      expect(log).toEqual(expected);
      // The nested batch joins the suspension in progress, so the mappers stay batched while it runs.
      expect(batchedMappers).toEqual([true, true]);
      expect(hot.isExecutionSuspended()).toBe(false);
    });

    it('should fire no hooks, and not recurse, for a batch made from a beforeSuspendExecution listener', () => {
      hot = createHot(container);

      const log = recordExecutionHooks(hot);
      let batchedOnce = false;

      hot.addHook('beforeSuspendExecution', () => {
        if (!batchedOnce) {
          batchedOnce = true;
          hot.batchExecution(() => log.push('nested'));
        }
      });

      hot.batchExecution(() => log.push('callback'));

      expect(log).toEqual(['beforeSuspendExecution', 'nested', 'afterSuspendExecution', 'callback', ...RESUME_PAIR]);
      expect(hot.isExecutionSuspended()).toBe(false);
    });

    it('should not recurse, and keep the counter right, when a beforeSuspendExecution listener always batches', () => {
      hot = createHot(container);

      let calls = 0;

      hot.addHook('beforeSuspendExecution', () => {
        calls += 1;
        hot.batch(() => hot.setCellMeta(0, 0, 'className', 'x'));
      });

      expect(() => hot.batch(() => {})).not.toThrow();
      expect(calls).toBe(1);
      expect(hot.isExecutionSuspended()).toBe(false);
    });

    it('should not recurse when a beforeResumeExecution listener resumes the execution', () => {
      hot = createHot(container);

      const log = recordExecutionHooks(hot);

      hot.addHook('beforeResumeExecution', () => hot.resumeExecution());
      hot.batchExecution(() => log.push('callback'));

      expect(log).toEqual([...SUSPEND_PAIR, 'callback', ...RESUME_PAIR]);
      expect(hot.isExecutionSuspended()).toBe(false);
      expect(hot.rowIndexMapper.isBatched).toBe(false);

      // The counter did not go below zero: a later batch still fires one full cycle.
      log.length = 0;
      hot.batchExecution(() => {});

      expect(log).toEqual(FULL_CYCLE);
    });

    it('should keep the execution suspended when a beforeResumeExecution listener leaves a suspension open', () => {
      hot = createHot(container);

      const log = recordExecutionHooks(hot);
      let suspendedOnce = false;

      hot.addHook('beforeResumeExecution', () => {
        if (!suspendedOnce) {
          suspendedOnce = true;
          hot.suspendExecution();
        }
      });

      hot.batchExecution(() => log.push('callback'));

      // Still suspended: `afterResumeExecution` has not fired, because nothing was released.
      expect(log).toEqual([...SUSPEND_PAIR, 'callback', 'beforeResumeExecution']);
      expect(hot.isExecutionSuspended()).toBe(true);

      hot.resumeExecution();

      expect(log).toEqual([...SUSPEND_PAIR, 'callback', 'beforeResumeExecution', ...RESUME_PAIR]);
      expect(hot.isExecutionSuspended()).toBe(false);
      expect(hot.rowIndexMapper.isBatched).toBe(false);
    });

    it.each([
      ['batch', (instance, fn) => instance.batch(fn)],
      ['batchExecution', (instance, fn) => instance.batchExecution(fn)],
      ['safeBatch', (instance, fn) => safeBatch(instance, fn)],
    ])('%s should fire the resume pair when the callback throws', (name, run) => {
      hot = createHot(container);

      const log = recordExecutionHooks(hot);

      expect(() => run(hot, () => {
        throw new Error('callback failed');
      })).toThrow('callback failed');

      expect(log).toEqual(FULL_CYCLE);
      expect(hot.isExecutionSuspended()).toBe(false);
      expect(hot.isRenderSuspended()).toBe(false);
    });
  });

  describe('a listener that throws', () => {
    const runners = [
      ['suspendExecution()/resumeExecution()', (instance, fn) => {
        instance.suspendExecution();

        try {
          return fn();
        } finally {
          instance.resumeExecution();
        }
      }],
      ['batch', (instance, fn) => instance.batch(fn)],
      ['batchExecution', (instance, fn) => instance.batchExecution(fn)],
      ['batchExecution (forced flush)', (instance, fn) => instance.batchExecution(fn, true)],
      ['safeBatch', (instance, fn) => safeBatch(instance, fn)],
    ];
    const cases = EXECUTION_HOOKS.flatMap(hookName => runners.map(([name, run]) => [hookName, name, run]));

    it.each(cases)('%s in %s should not leave the instance suspended', (hookName, name, run) => {
      hot = createHot(container);

      hot.addHook(hookName, () => {
        throw new Error(`${hookName} failed`);
      });

      expect(() => run(hot, () => {})).toThrow(`${hookName} failed`);

      expect(hot.isExecutionSuspended()).toBe(false);
      expect(hot.isRenderSuspended()).toBe(false);
      expect(hot.rowIndexMapper.isBatched).toBe(false);
      expect(hot.columnIndexMapper.isBatched).toBe(false);
    });

    it('should not run the callback when beforeSuspendExecution throws', () => {
      hot = createHot(container);

      const callback = jest.fn();

      hot.addHook('beforeSuspendExecution', () => {
        throw new Error('veto by exception');
      });

      expect(() => hot.batch(callback)).toThrow('veto by exception');
      expect(callback).not.toHaveBeenCalled();
    });

    it.each([
      ['beforeSuspendExecution', (instance, fn) => instance.batchExecution(fn)],
      ['beforeResumeExecution', (instance, fn) => instance.batchExecution(fn)],
    ])('should fire the hooks of the next batch after a %s listener threw', (hookName, run) => {
      hot = createHot(container);

      const log = recordExecutionHooks(hot);
      let throwOnce = true;

      hot.addHook(hookName, () => {
        if (throwOnce) {
          throwOnce = false;
          throw new Error('listener failed');
        }
      });

      expect(() => run(hot, () => {})).toThrow('listener failed');

      // The flag that keeps the hooks quiet while a before listener runs is cleared with the throw. Left set, no
      // suspension of this grid fires a hook again, and a plugin that holds something on them never gets one.
      log.length = 0;
      run(hot, () => {});

      expect(log).toEqual(FULL_CYCLE);
    });

    it('should roll the suspension back through the resume pair when afterSuspendExecution throws', () => {
      hot = createHot(container);

      const log = [];

      // The first listener stands for a plugin that took a hold on the suspension and releases it on resume.
      hot.addHook('afterSuspendExecution', () => log.push('afterSuspendExecution'));
      hot.addHook('afterSuspendExecution', () => {
        throw new Error('afterSuspendExecution failed');
      });
      hot.addHook('beforeResumeExecution', () => log.push('beforeResumeExecution'));
      hot.addHook('afterResumeExecution', () => log.push('afterResumeExecution'));

      expect(() => hot.suspendExecution()).toThrow('afterSuspendExecution failed');

      expect(log).toEqual(['afterSuspendExecution', ...RESUME_PAIR]);
      expect(hot.isExecutionSuspended()).toBe(false);
    });

    it('should rethrow the afterSuspendExecution error when the rollback\'s resume listener throws too', () => {
      hot = createHot(container);

      hot.addHook('afterSuspendExecution', () => {
        throw new Error('afterSuspendExecution failed');
      });
      hot.addHook('afterResumeExecution', () => {
        throw new Error('afterResumeExecution failed');
      });

      expect(() => hot.suspendExecution()).toThrow('afterSuspendExecution failed');
      expect(hot.isExecutionSuspended()).toBe(false);
    });

    it('should still resume the mappers and fire afterResumeExecution when beforeResumeExecution throws', () => {
      hot = createHot(container);

      const log = recordExecutionHooks(hot);

      hot.addHook('beforeResumeExecution', () => {
        throw new Error('beforeResumeExecution failed');
      });

      hot.suspendExecution();
      hot.rowIndexMapper.setIndexesSequence([2, 1, 0]);

      expect(() => hot.resumeExecution()).toThrow('beforeResumeExecution failed');

      expect(log).toEqual(FULL_CYCLE);
      expect(hot.isExecutionSuspended()).toBe(false);
      expect(hot.toVisualRow(0)).toBe(2);
    });

    it('should resume both mappers and fire afterResumeExecution when the index cache update throws', () => {
      hot = createHot(container);

      const log = recordExecutionHooks(hot);
      const throwOnce = () => {
        hot.columnIndexMapper.removeLocalHook('cacheUpdated', throwOnce);

        throw new Error('cache update failed');
      };

      hot.suspendExecution();
      hot.columnIndexMapper.addLocalHook('cacheUpdated', throwOnce);
      hot.columnIndexMapper.setIndexesSequence([1, 0]);
      hot.rowIndexMapper.setIndexesSequence([2, 1, 0]);

      expect(() => hot.resumeExecution()).toThrow('cache update failed');

      expect(log).toEqual(FULL_CYCLE);
      expect(hot.isExecutionSuspended()).toBe(false);
      expect(hot.columnIndexMapper.isBatched).toBe(false);
      expect(hot.rowIndexMapper.isBatched).toBe(false);
      expect(hot.toVisualRow(0)).toBe(2);
    });
  });

  describe('destroy', () => {
    it('should fire nothing after afterDestroy', () => {
      hot = createHot(container);

      const log = recordExecutionHooks(hot);
      const globalLog = [];
      const globalListeners = EXECUTION_HOOKS.map((hookName) => {
        const listener = () => globalLog.push(hookName);

        Hooks.getSingleton().add(hookName, listener);

        return [hookName, listener];
      });

      try {
        // Positive control: the listeners are live before the teardown.
        hot.batchExecution(() => {});

        expect(log).toEqual(FULL_CYCLE);
        expect(globalLog).toEqual(FULL_CYCLE);

        hot.addHook('afterDestroy', () => log.push('afterDestroy'));
        log.length = 0;
        globalLog.length = 0;

        hot.destroy();

        expect(log).toEqual(['afterDestroy']);
        expect(globalLog).toEqual([]);
      } finally {
        globalListeners.forEach(([hookName, listener]) => Hooks.getSingleton().remove(hookName, listener));
      }
    });
  });
});
