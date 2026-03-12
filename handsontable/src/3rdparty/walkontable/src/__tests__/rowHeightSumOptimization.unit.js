import { getUniformRowHeightSum } from '../overlay/utils/rowHeights';

describe('Walkontable row height sum optimization', () => {
  it('should provide precomputed sum for uniform-height rows', () => {
    const wtSettings = {
      getSetting(key) {
        if (key === 'uniformRowHeight') {
          return 23;
        }

        return undefined;
      },
    };
    const wtViewport = {
      oversizedRows: [],
    };

    expect(getUniformRowHeightSum(wtSettings, wtViewport, 0, 100001)).toBe(2300023);
  });

  it('should skip fast path when oversized rows are present', () => {
    const wtSettings = {
      getSetting(key) {
        if (key === 'uniformRowHeight') {
          return 23;
        }

        return undefined;
      },
    };
    const wtViewport = {
      oversizedRows: [undefined, 40],
    };

    expect(getUniformRowHeightSum(wtSettings, wtViewport, 0, 100001)).toBeNull();
  });

  it('should skip fast path when there is no uniform row height', () => {
    const wtSettings = {
      getSetting() {
        return undefined;
      },
    };
    const wtViewport = {
      oversizedRows: [],
    };

    expect(getUniformRowHeightSum(wtSettings, wtViewport, 0, 100001)).toBeNull();
  });
});
