import { Overlay } from '../_base';
import { CLONE_INLINE_START, CLONE_TOP } from '../constants';

function createOverlayMock({ type, preventOverflow, overflow = 'clip' }) {
  const rootWindow = {
    getComputedStyle() {
      return {
        getPropertyValue() {
          return overflow;
        },
      };
    },
  };
  const holder = {};
  const TABLE = {};
  const wtRootElement = { parentNode: {} };
  const overlay = Object.create(Overlay.prototype);

  overlay.type = type;
  overlay.wot = {
    wtTable: {
      holder,
      TABLE,
      wtRootElement,
    },
  };
  overlay.domBindings = { rootWindow };
  overlay.wtSettings = {
    getSetting(settingName) {
      if (settingName === 'preventOverflow') {
        return preventOverflow;
      }
    },
  };

  return { overlay, holder, rootWindow };
}

describe('Overlay', () => {
  describe('updateMainScrollableElement', () => {
    it('should keep `window` as the main scrollable element for the top overlay when `preventOverflow` is set to `horizontal`', () => {
      const { overlay, rootWindow } = createOverlayMock({
        type: CLONE_TOP,
        preventOverflow: 'horizontal',
      });

      overlay.updateMainScrollableElement();

      expect(overlay.mainTableScrollableElement).toBe(rootWindow);
    });

    it('should keep `window` as the main scrollable element for the inline-start overlay when `preventOverflow` is set to `vertical`', () => {
      const { overlay, rootWindow } = createOverlayMock({
        type: CLONE_INLINE_START,
        preventOverflow: 'vertical',
      });

      overlay.updateMainScrollableElement();

      expect(overlay.mainTableScrollableElement).toBe(rootWindow);
    });

    it('should keep holder as the main scrollable element for the top overlay when `preventOverflow` is set to `vertical`', () => {
      const { overlay, holder } = createOverlayMock({
        type: CLONE_TOP,
        preventOverflow: 'vertical',
      });

      overlay.updateMainScrollableElement();

      expect(overlay.mainTableScrollableElement).toBe(holder);
    });
  });
});
