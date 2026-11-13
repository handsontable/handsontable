import Handsontable from 'handsontable/base';
import { registerCellType, TextCellType } from 'handsontable/cellTypes';
import { registerRenderer, baseRenderer, textRenderer } from 'handsontable/renderers';

// The corner badge is mounted for a running trial only, so the license-state reader answers one.
jest.mock('../../helpers/mixed', () => ({
  ...jest.requireActual('../../helpers/mixed'),
  _getLicenseState: jest.fn(() => ({
    lifecycle: { state: 'trial_valid', isTrial: true, daysRemaining: 5, licensedUntil: null },
    channels: { console: false, ui: true },
    tiers: null,
    badge: false,
  })),
}));

registerCellType(TextCellType);
registerRenderer(baseRenderer);
registerRenderer(textRenderer);

/**
 * Lets the microtasks a write queues run.
 */
async function flush() {
  for (let i = 0; i < 20; i++) {
    await Promise.resolve();
  }
}

describe('License branding when an afterRender listener destroys the grid', () => {
  let container;
  let uncaughtErrors;
  const onWindowError = (event) => {
    uncaughtErrors.push(event.error);
    event.preventDefault();
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    uncaughtErrors = [];
    window.addEventListener('error', onWindowError);
  });

  afterEach(() => {
    window.removeEventListener('error', onWindowError);
    container.remove();
  });

  it('should end the render quietly when the listener comes from the settings (trial corner badge)', async() => {
    let armed = false;
    const hot = new Handsontable(container, {
      theme: 'ht-theme-main',
      licenseKey: 'trial',
      data: [['a', 'b'], ['c', 'd']],
      rowHeaders: true,
      colHeaders: true,
      afterRender() {
        if (armed) {
          armed = false;
          this.destroy();
        }
      },
    });

    // The badge's own `afterRender` listeners run after the one from the settings.
    expect(hot.rootElement.classList.contains('ht-license-badge-on')).toBe(true);

    armed = true;

    expect(() => hot.setDataAtCell(0, 0, 'x')).not.toThrow();

    await flush();

    expect(hot.isDestroyed).toBe(true);
    expect(uncaughtErrors).toEqual([]);
  });
});
