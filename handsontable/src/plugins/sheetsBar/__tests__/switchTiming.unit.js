import Handsontable from '../../../base';
import {
  entranceElapsedMs,
  parseCssTime,
  pillDurationMs,
  resolveSwitchTransition,
  tabSlideDurationMs,
} from '../ui/switchTiming';

/**
 * Builds a minimal grid stand-in whose root element carries the given transition token.
 *
 * @param {string|null} transition The `--ht-table-transition` value, or `null` for none.
 * @param {object} [options] Overrides for the stand-in.
 * @returns {object}
 */
function createHotStub(transition, options = {}) {
  const rootElement = document.createElement('div');

  if (transition !== null) {
    rootElement.style.setProperty('--ht-table-transition', transition);
  }

  document.body.appendChild(rootElement);

  return {
    view: {},
    rootElement,
    rootWindow: window,
    ...options,
  };
}

/**
 * Installs a `matchMedia` stub that answers the given value for every query.
 *
 * @param {boolean} matches The `matches` value to report.
 * @returns {jest.Mock}
 */
function stubMatchMedia(matches) {
  const matchMedia = jest.fn(query => ({ matches, media: query }));

  window.matchMedia = matchMedia;

  return matchMedia;
}

describe('switchTiming', () => {
  afterEach(() => {
    delete window.matchMedia;
    document.body.innerHTML = '';
  });

  describe('parseCssTime', () => {
    it('reads seconds as milliseconds', () => {
      expect(parseCssTime('0.15s')).toBe(150);
      expect(parseCssTime('.2s')).toBe(200);
    });

    it('reads milliseconds as they are', () => {
      expect(parseCssTime('150ms')).toBe(150);
    });

    it('ignores surrounding whitespace', () => {
      expect(parseCssTime(' 0s ')).toBe(0);
      expect(parseCssTime(' 0.3s ')).toBe(300);
    });

    it('answers 0 for empty or unreadable input', () => {
      expect(parseCssTime('')).toBe(0);
      expect(parseCssTime('abc')).toBe(0);
      expect(parseCssTime('150')).toBe(0);
    });
  });

  describe('pillDurationMs', () => {
    it('lasts 2.25 transitions', () => {
      expect(pillDurationMs(200)).toBe(450);
    });
  });

  describe('tabSlideDurationMs', () => {
    it('slides the tabs for as long as the marker slides', () => {
      expect(tabSlideDurationMs(150)).toBe(337.5);
      expect(tabSlideDurationMs(200)).toBe(pillDurationMs(200));
    });

    it('answers zero for a theme without a transition', () => {
      expect(tabSlideDurationMs(0)).toBe(0);
    });
  });

  describe('entranceElapsedMs', () => {
    it('answers the time since the start while the entrance runs', () => {
      expect(entranceElapsedMs(1000, 1000, 150)).toBe(0);
      expect(entranceElapsedMs(1000, 1040, 150)).toBe(40);
      expect(entranceElapsedMs(1000, 1149.5, 150)).toBe(149.5);
    });

    it('answers null once the whole duration has passed', () => {
      expect(entranceElapsedMs(1000, 1150, 150)).toBeNull();
      expect(entranceElapsedMs(1000, 5000, 150)).toBeNull();
    });

    it('answers 0 for a clock reading earlier than the start', () => {
      expect(entranceElapsedMs(1000, 990, 150)).toBe(0);
    });

    it('answers null for a zero duration', () => {
      expect(entranceElapsedMs(1000, 1000, 0)).toBeNull();
    });
  });

  describe('resolveSwitchTransition', () => {
    it('reads the token from the root element through the root window', () => {
      const hot = createHotStub('0.15s');
      const spy = jest.spyOn(window, 'getComputedStyle');

      expect(resolveSwitchTransition(hot)).toBe(150);
      expect(spy).toHaveBeenCalledWith(hot.rootElement);

      spy.mockRestore();
    });

    it('answers 0 without the transition token', () => {
      expect(resolveSwitchTransition(createHotStub(null))).toBe(0);
    });

    it('answers 0 for a zero transition', () => {
      expect(resolveSwitchTransition(createHotStub('0s'))).toBe(0);
    });

    it('answers the transition for a window without matchMedia', () => {
      expect(window.matchMedia).toBeUndefined();
      expect(resolveSwitchTransition(createHotStub('0.15s'))).toBe(150);
    });

    it('answers the transition when motion is not reduced', () => {
      const matchMedia = stubMatchMedia(false);

      expect(resolveSwitchTransition(createHotStub('0.15s'))).toBe(150);
      expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    });

    it('answers 0 under reduced motion without reading the computed style', () => {
      stubMatchMedia(true);

      const spy = jest.spyOn(window, 'getComputedStyle');

      expect(resolveSwitchTransition(createHotStub('0.15s'))).toBe(0);
      expect(spy).not.toHaveBeenCalled();

      spy.mockRestore();
    });

    it('answers 0 without a view without reading the computed style', () => {
      const spy = jest.spyOn(window, 'getComputedStyle');

      expect(resolveSwitchTransition(createHotStub('0.15s', { view: undefined }))).toBe(0);
      expect(spy).not.toHaveBeenCalled();

      spy.mockRestore();
    });

    it('reads the token from a real grid root element', () => {
      const container = document.createElement('div');

      document.body.appendChild(container);

      const hot = new Handsontable(container, {
        data: [[1]],
        licenseKey: 'non-commercial-and-evaluation',
      });

      expect(resolveSwitchTransition(hot)).toBe(0);

      hot.rootElement.style.setProperty('--ht-table-transition', '150ms');

      expect(resolveSwitchTransition(hot)).toBe(150);

      hot.destroy();
    });
  });
});
