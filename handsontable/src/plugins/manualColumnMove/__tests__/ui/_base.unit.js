import BaseUI from 'handsontable/plugins/manualColumnMove/ui/_base';

describe('manualColumnMove', () => {
  const STATE_INITIALIZED = 0;
  const STATE_BUILT = 1;
  const STATE_APPENDED = 2;

  it('should not rebuild UI elements unnecessarily', () => {
    const hotMock = {
      isRtl() {},
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

  it('should set "left" physical CSS property for LTR mode', () => {
    const hotMock = {
      isRtl() {
        return false;
      },
      rootDocument: {
        createElement() {}
      }
    };

    const baseUI = new BaseUI(hotMock);

    expect(baseUI.inlineProperty).toBe('left');
  });

  it('should set "right" physical CSS property for RTL mode', () => {
    const hotMock = {
      isRtl() {
        return true;
      },
      rootDocument: {
        createElement() {}
      }
    };

    const baseUI = new BaseUI(hotMock);

    expect(baseUI.inlineProperty).toBe('right');
  });
});
