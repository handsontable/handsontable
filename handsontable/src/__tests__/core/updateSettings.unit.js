import Core from 'handsontable/core';
import { registerCellType, TextCellType } from 'handsontable/cellTypes';
import { registerRenderer, baseRenderer, textRenderer } from 'handsontable/renderers';

registerCellType(TextCellType);
registerRenderer(baseRenderer);
registerRenderer(textRenderer);

describe('Core#updateSettings', () => {
  describe('removed options', () => {
    let container;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(() => {
      container.remove();
    });

    it('should warn once when an option removed in 18.0 is configured', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const core = new Core(container, {
        data: [['a']],
        licenseKey: 'non-commercial-and-evaluation',
        persistentState: true,
      });

      core.init();
      core.updateSettings({ persistentState: false });

      const calls = warnSpy.mock.calls.filter(([message]) => String(message).includes('"persistentState"'));

      expect(calls.length).toBe(1);
      expect(calls[0][0]).toMatch(/^Deprecated: .*removed in Handsontable 18\.0\.0/);

      core.destroy();
      warnSpy.mockRestore();
    });

    it('should not warn when no removed option is configured', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const core = new Core(container, {
        data: [['a']],
        licenseKey: 'non-commercial-and-evaluation',
      });

      core.init();
      core.updateSettings({ colHeaders: true });

      const calls = warnSpy.mock.calls.filter(([message]) => String(message).includes('was removed in Handsontable'));

      expect(calls.length).toBe(0);

      core.destroy();
      warnSpy.mockRestore();
    });
  });
});
