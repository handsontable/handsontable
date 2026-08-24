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
});
