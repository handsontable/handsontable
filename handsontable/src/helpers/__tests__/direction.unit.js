import { getDirectionFactor, isLtr, isRtl } from 'handsontable/helpers/direction';

describe('Direction helper', () => {
  it('When direction is "ltr", helpers returns isLtr(): true, isRtl(): false, directionFactor(): 1 ', () => {
    const instanceMock = {
      rootWindow: {
        getComputedStyle() { return { direction: 'ltr' }; }
      }
    };

    expect(isLtr(instanceMock)).toBe(true);
    expect(isRtl(instanceMock)).toBe(false);
    expect(getDirectionFactor(instanceMock)).toBe(1);
  });

  it('When direction is "rtl", helpers returns isLtr(): false, isRtl(): true, directionFactor(): -1 ', () => {
    const instanceMock = {
      rootWindow: {
        getComputedStyle() { return { direction: 'rtl' }; }
      }
    };

    expect(isLtr(instanceMock)).toBe(false);
    expect(isRtl(instanceMock)).toBe(true);
    expect(getDirectionFactor(instanceMock)).toBe(-1);
  });
});
