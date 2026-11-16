import BaseUI from 'handsontable/plugins/manualRowMove/ui/_base';

describe('manualRowMove', () => {
  const STATE_INITIALIZED = 0;
  const STATE_BUILT = 1;
  const STATE_APPENDED = 2;

  it('should not rebuild UI elements unnecessarily', () => {
    const hotMock = {
      rootDocument: {
        createElement() {}
      }
    };

    const baseUI = new BaseUI(hotMock);

    expect(baseUI.state).toBe(STATE_INITIALIZED);

    baseUI.build();

    expect(baseUI.state).toBe(STATE_BUILT);

    baseUI.state = STATE_APPENDED;

    baseUI.build();

    expect(baseUI.state).toBe(STATE_APPENDED);
  });

  describe('setSize()', () => {
    const buildUI = () => {
      const hotMock = {
        rootDocument: document,
      };
      const baseUI = new BaseUI(hotMock);

      baseUI.build();

      return baseUI;
    };

    it('should write a zero width, which is what a grid with no rendered columns asks for', () => {
      const baseUI = buildUI();

      baseUI.setSize(0, 20);

      expect(baseUI._element!.style.width).toBe('0px');
      expect(baseUI.getSize()).toEqual({ width: 0, height: 20 });
    });

    it('should write a zero height', () => {
      const baseUI = buildUI();

      baseUI.setSize(30, 0);

      expect(baseUI._element!.style.height).toBe('0px');
      expect(baseUI.getSize()).toEqual({ width: 30, height: 0 });
    });

    it('should leave an omitted dimension as it was', () => {
      const baseUI = buildUI();

      baseUI.setSize(undefined, 20);

      expect(baseUI._element!.style.width).toBe('');
      expect(baseUI._element!.style.height).toBe('20px');
    });
  });
});
