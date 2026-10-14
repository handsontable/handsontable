import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { SheetsBar } from '../sheetsBar';
import {
  isValidAnimationSetting,
  keepAnimatedMotion,
  resolveAnimationSetting,
} from '../ui/animationSettings';

registerPlugin(SheetsBar);

const ALL_ON = { switch: true, add: true, remove: true, move: true };
const ALL_OFF = { switch: false, add: false, remove: false, move: false };

/**
 * Builds a handed-over motion with one part of each kind running.
 *
 * @returns {object}
 */
function createRunningMotion() {
  return {
    indicator: { box: { left: 10, width: 40 }, endsAt: 500 },
    entering: [{ id: 4, start: 100, duration: 150 }],
    slide: { from: new Map([[1, 0]]), endsAt: 400, leadId: 1 },
    leaving: [{ element: document.createElement('div'), start: 120, duration: 150 }],
  };
}

describe('sheets bar animation settings', () => {
  describe('resolveAnimationSetting', () => {
    it('turns every motion on for `true`', () => {
      expect(resolveAnimationSetting(true)).toEqual(ALL_ON);
    });

    it('turns every motion off for `false`', () => {
      expect(resolveAnimationSetting(false)).toEqual(ALL_OFF);
    });

    it('keeps an omitted key on and turns off only the keys set to `false`', () => {
      expect(resolveAnimationSetting({ move: false })).toEqual({ ...ALL_ON, move: false });
      expect(resolveAnimationSetting({ switch: false, add: true })).toEqual({ ...ALL_ON, switch: false });
      expect(resolveAnimationSetting({})).toEqual(ALL_ON);
    });

    it('takes every key of a full object', () => {
      expect(resolveAnimationSetting({ switch: true, add: false, remove: true, move: false }))
        .toEqual({ switch: true, add: false, remove: true, move: false });
      expect(resolveAnimationSetting({ ...ALL_OFF })).toEqual(ALL_OFF);
    });

    it('keeps every motion on for a missing value', () => {
      expect(resolveAnimationSetting(undefined)).toEqual(ALL_ON);
    });
  });

  describe('the `animation` validator', () => {
    const validators = [
      ['isValidAnimationSetting', isValidAnimationSetting],
      ['SheetsBar.SETTINGS_VALIDATORS.animation', SheetsBar.SETTINGS_VALIDATORS.animation],
    ];

    it.each(validators)('%s accepts a boolean', (name, validate) => {
      expect(validate(true)).toBe(true);
      expect(validate(false)).toBe(true);
    });

    it.each(validators)('%s accepts an object of known keys with boolean values', (name, validate) => {
      expect(validate({})).toBe(true);
      expect(validate({ move: false })).toBe(true);
      expect(validate({ switch: true, add: false, remove: true, move: false })).toBe(true);
    });

    it.each(validators)('%s rejects an unknown key', (name, validate) => {
      expect(validate({ hover: false })).toBe(false);
      expect(validate({ move: false, slide: true })).toBe(false);
    });

    it.each(validators)('%s rejects a key with a non-boolean value', (name, validate) => {
      expect(validate({ move: 0 })).toBe(false);
      expect(validate({ switch: 'false' })).toBe(false);
      expect(validate({ add: null })).toBe(false);
      expect(validate({ remove: undefined })).toBe(false);
    });

    it.each(validators)('%s rejects an array, null, a string, and a number', (name, validate) => {
      expect(validate([])).toBe(false);
      expect(validate([false])).toBe(false);
      expect(validate(null)).toBe(false);
      expect(validate('false')).toBe(false);
      expect(validate(0)).toBe(false);
    });
  });

  describe('keepAnimatedMotion', () => {
    it('hands every part over while every key is on', () => {
      const motion = createRunningMotion();

      expect(keepAnimatedMotion(motion, ALL_ON, 'move')).toEqual(motion);
    });

    it('drops every part when every key is off', () => {
      expect(keepAnimatedMotion(createRunningMotion(), ALL_OFF, 'move'))
        .toEqual({ indicator: null, entering: [], slide: null, leaving: [] });
    });

    it('drops only the part whose key is off', () => {
      const motion = createRunningMotion();

      expect(keepAnimatedMotion(motion, { ...ALL_ON, switch: false }, 'move').indicator).toBeNull();
      expect(keepAnimatedMotion(motion, { ...ALL_ON, switch: false }, 'move').entering).toBe(motion.entering);
      expect(keepAnimatedMotion(motion, { ...ALL_ON, add: false }, 'move').entering).toEqual([]);
      expect(keepAnimatedMotion(motion, { ...ALL_ON, add: false }, 'move').leaving).toBe(motion.leaving);
      expect(keepAnimatedMotion(motion, { ...ALL_ON, remove: false }, 'move').leaving).toEqual([]);
      expect(keepAnimatedMotion(motion, { ...ALL_ON, remove: false }, 'move').slide).toBe(motion.slide);
    });

    it('drops the tab slide by the motion that started it', () => {
      const motion = createRunningMotion();

      expect(keepAnimatedMotion(motion, { ...ALL_ON, move: false }, 'move').slide).toBeNull();
      expect(keepAnimatedMotion(motion, { ...ALL_ON, move: false }, 'remove').slide).toBe(motion.slide);
      expect(keepAnimatedMotion(motion, { ...ALL_ON, remove: false }, 'remove').slide).toBeNull();
      expect(keepAnimatedMotion(motion, ALL_OFF, null).slide).toBe(motion.slide);
    });
  });

  describe('the plugin setting', () => {
    let hot;

    afterEach(() => {
      hot?.destroy();
      hot = null;
      document.body.innerHTML = '';
      jest.restoreAllMocks();
    });

    /**
     * Builds a grid with the sheets bar configured by the given settings.
     *
     * @param {object} sheetsBar The `sheetsBar` setting.
     * @returns {Handsontable}
     */
    function createGrid(sheetsBar) {
      const container = document.createElement('div');

      document.body.appendChild(container);

      return new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        sheetsBar,
      });
    }

    it('defaults to `true`', () => {
      hot = createGrid({ sheets: [{ name: 'Budget' }] });

      expect(hot.getPlugin('sheetsBar').getSetting('animation')).toBe(true);
    });

    it('ignores an invalid value with a warning and keeps the previous one', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const sheets = [{ name: 'Budget' }, { name: 'Notes' }];

      hot = createGrid({ sheets, animation: { move: false } });

      const plugin = hot.getPlugin('sheetsBar');

      hot.updateSettings({ sheetsBar: { sheets, animation: { hover: false } } });

      expect(warnSpy).toHaveBeenCalledWith('SheetsBar Plugin: "animation" option is not valid and it will be ignored.');
      expect(plugin.getSetting('animation')).toEqual({ move: false });
      expect(plugin.getSheets().map(sheet => sheet.name)).toEqual(['Budget', 'Notes']);
    });

    it('keeps the workbook when the value changes through `updateSettings()`', () => {
      const sheets = [{ name: 'Budget' }, { name: 'Notes' }];

      hot = createGrid({ sheets });

      const plugin = hot.getPlugin('sheetsBar');

      plugin.setActiveSheet('Notes');
      plugin.addSheet('Forecast');
      hot.updateSettings({ sheetsBar: { sheets, animation: false } });

      expect(plugin.getSetting('animation')).toBe(false);
      expect(plugin.getSheets().map(sheet => sheet.name)).toEqual(['Budget', 'Notes', 'Forecast']);
      expect(plugin.getSheets().find(sheet => sheet.isActive).name).toBe('Notes');
    });
  });
});
