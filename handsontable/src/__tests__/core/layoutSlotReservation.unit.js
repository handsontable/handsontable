import Handsontable from 'handsontable/base';

/**
 * The root wrapper's edge slots (pagination bar, sheets bar, license notification) share their box
 * with the grid, and two things reserve room for them (DEV-2848): core subtracts them from a pixel
 * `height` it writes on the root, and the engine subtracts the slots the vertical axis owner
 * CONTAINS through the `layoutReservedHeight` setting `TableView` answers. jsdom lays nothing out,
 * so the slot heights are stubbed per slot class.
 */
describe('Layout slot height reservation', () => {
  const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
  let slotHeights;
  let container;
  let core;

  beforeEach(() => {
    slotHeights = { 'ht-slot-top': 0, 'ht-slot-bottom': 0 };

    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get() {
        const slotClass = Object.keys(slotHeights).find(className => this.classList.contains(className));

        return slotClass ? slotHeights[slotClass] : 0;
      },
    });

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    core?.destroy();
    core = null;
    container.remove();
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalOffsetHeight);
  });

  /**
   * Builds a ROOT grid in the shared container. The facade (not a bare `Core`) is what stamps the
   * root-instance symbol, and only a root instance owns the wrapper and its slots.
   *
   * @param {object} settings Grid settings.
   * @returns {Handsontable}
   */
  function createGrid(settings) {
    core = new Handsontable(container, {
      data: [['a']],
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });

    return core;
  }

  describe('the pixel `height` written on the root', () => {
    it('should subtract both edge slots from a numeric height', () => {
      slotHeights['ht-slot-top'] = 21;
      slotHeights['ht-slot-bottom'] = 38;

      createGrid({ height: 400 });

      expect(core.rootElement.style.height).toBe('calc(400px - 59px)');
      // `core/rootSize.ts` writes the longhands; jsdom does not fold them into the shorthand.
      expect(core.rootElement.style.overflowX).toBe('clip');
      expect(core.rootElement.style.overflowY).toBe('clip');
    });

    it('should subtract the slots from a `px` string height', () => {
      slotHeights['ht-slot-bottom'] = 38;

      createGrid({ height: '400px' });

      expect(core.rootElement.style.height).toBe('calc(400px - 38px)');
    });

    it('should write the plain height when the slots are empty', () => {
      createGrid({ height: 400 });

      expect(core.rootElement.style.height).toBe('400px');
    });

    it('should leave a relative or keyword height to the browser', () => {
      slotHeights['ht-slot-bottom'] = 38;

      createGrid({ height: '100%' });
      expect(core.rootElement.style.height).toBe('100%');

      core.updateSettings({ height: 'auto' });
      expect(core.rootElement.style.height).toBe('auto');
    });

    it('should re-apply the last readable height when a slot resizes after an ignored update', () => {
      const originalResizeObserver = window.ResizeObserver;
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const observers = [];

      // The shared stub cannot deliver, so this one records each observer and what it watches.
      window.ResizeObserver = class {
        constructor(callback) {
          this.callback = callback;
          this.targets = [];
          observers.push(this);
        }

        observe(target) {
          this.targets.push(target);
        }

        unobserve() {}

        disconnect() {}
      };

      try {
        createGrid({ height: 400 });
        core.updateSettings({ height: 'abc' });
        slotHeights['ht-slot-bottom'] = 38;

        observers
          .filter(observer => observer.targets.includes(core.rootSlotBottomElement))
          .forEach(observer => observer.callback([]));

        expect(observers.some(observer => observer.targets.includes(core.rootSlotBottomElement))).toBe(true);
        expect(core.rootElement.style.height).toBe('calc(400px - 38px)');
      } finally {
        window.ResizeObserver = originalResizeObserver;
        warnSpy.mockRestore();
      }
    });

    it('should re-apply the reservation on `updateSettings` with the current slot height', () => {
      createGrid({ height: 400 });
      slotHeights['ht-slot-bottom'] = 59;

      core.updateSettings({ height: 400 });

      expect(core.rootElement.style.height).toBe('calc(400px - 59px)');
    });
  });

  describe('the `layoutReservedHeight` engine setting', () => {
    /**
     * Asks the engine setting the way the viewport and the master table do.
     *
     * @param {HTMLElement} owner The vertical axis owner.
     * @returns {number}
     */
    function reservedHeightFor(owner) {
      return core.view._wt.wtSettings.getSetting('layoutReservedHeight', owner);
    }

    it('should count both slots when the owner contains the wrapper', () => {
      slotHeights['ht-slot-top'] = 21;
      slotHeights['ht-slot-bottom'] = 38;
      createGrid({});

      expect(reservedHeightFor(container)).toBe(59);
    });

    it('should count only the top slot when only it holds content', () => {
      // Every e2e layout fills the bottom slot only; dropping the top slot from the sum would keep
      // them green.
      slotHeights['ht-slot-top'] = 21;
      createGrid({});

      expect(reservedHeightFor(container)).toBe(21);
    });

    it('should reserve nothing for an owner that contains no slot (the root element)', () => {
      slotHeights['ht-slot-bottom'] = 38;
      createGrid({});

      expect(reservedHeightFor(core.rootElement)).toBe(0);
    });

    it('should memoize per owner within a render and drop the memo on the next one', () => {
      slotHeights['ht-slot-bottom'] = 38;
      createGrid({});

      expect(reservedHeightFor(container)).toBe(38);

      slotHeights['ht-slot-bottom'] = 59;

      // Same owner, same render: the memo answers.
      expect(reservedHeightFor(container)).toBe(38);
      // Another owner is measured fresh.
      expect(reservedHeightFor(core.rootElement)).toBe(0);

      core.render();

      expect(reservedHeightFor(container)).toBe(59);
    });
  });
});
