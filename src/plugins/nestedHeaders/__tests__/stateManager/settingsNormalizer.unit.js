/* eslint max-len: ["error", { "code": 140 }] */
import { normalizeSettings } from 'handsontable/plugins/nestedHeaders/stateManager/settingsNormalizer';

function createRootColspanSettings(overwriteProps = {}) {
  return {
    label: '',
    colspan: 1,
    origColspan: 1,
    crossHiddenColumns: [],
    isHidden: false,
    isCollapsed: false,
    collapsible: false,
    isRoot: false,
    isPlaceholder: false,
    ...overwriteProps,
  };
}

function createPlaceholder() {
  return {
    label: '',
    isHidden: false,
    isPlaceholder: true,
  };
}

describe('normalizeSettings', () => {
  it('should normalize user-defined settings into known uniform structure data (simple settings)', () => {
    expect(normalizeSettings([])).toEqual([]);
    expect(normalizeSettings([[]])).toEqual([[]]);
    expect(normalizeSettings([['A1']])).toEqual([[
      createRootColspanSettings({ label: 'A1' })
    ]]);
    expect(normalizeSettings([
      ['A1'],
      [{ label: true }, 'B2', 4],
      [],
    ])).toEqual([
      [
        createRootColspanSettings({ label: 'A1' }),
        createRootColspanSettings({ label: '' }),
        createRootColspanSettings({ label: '' }),
      ],
      [
        createRootColspanSettings({ label: 'true' }),
        createRootColspanSettings({ label: 'B2' }),
        createRootColspanSettings({ label: '4' }),
      ],
      [
        createRootColspanSettings({ label: '' }),
        createRootColspanSettings({ label: '' }),
        createRootColspanSettings({ label: '' }),
      ],
    ]);
  });

  it('should normalize user-defined settings into known uniform structure data (advanced settings, inconsistent columns length)', () => {
    const settings = [
      ['A', { label: 'B', colspan: 8 }, 'C'],
      ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }],
      ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
      ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V'],
    ];

    expect(normalizeSettings(settings)).toEqual([
      [
        createRootColspanSettings({ label: 'A' }),
        createRootColspanSettings({ label: 'B', colspan: 8, origColspan: 8 }),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createRootColspanSettings({ label: 'C' }),
      ],
      [
        createRootColspanSettings({ label: 'D' }),
        createRootColspanSettings({ label: 'E', colspan: 4, origColspan: 4 }),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createRootColspanSettings({ label: 'F', colspan: 4, origColspan: 4 }),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createRootColspanSettings({ label: '' }),
      ],
      [
        createRootColspanSettings({ label: 'H' }),
        createRootColspanSettings({ label: 'I', colspan: 2, origColspan: 2 }),
        createPlaceholder(),
        createRootColspanSettings({ label: 'J', colspan: 2, origColspan: 2 }),
        createPlaceholder(),
        createRootColspanSettings({ label: 'K', colspan: 2, origColspan: 2 }),
        createPlaceholder(),
        createRootColspanSettings({ label: 'L', colspan: 2, origColspan: 2 }),
        createPlaceholder(),
        createRootColspanSettings({ label: 'M' }),
      ],
      [
        createRootColspanSettings({ label: 'N' }),
        createRootColspanSettings({ label: 'O' }),
        createRootColspanSettings({ label: 'P' }),
        createRootColspanSettings({ label: 'Q' }),
        createRootColspanSettings({ label: 'R' }),
        createRootColspanSettings({ label: 'S' }),
        createRootColspanSettings({ label: 'T' }),
        createRootColspanSettings({ label: 'U' }),
        createRootColspanSettings({ label: 'V' }),
        createRootColspanSettings({ label: '' }),
      ],
    ]);
  });

  it('should normalize user-defined settings with limited columns count with colspan structure preservation', () => {
    const settings = [
      ['A', { label: 'B', colspan: 8 }, 'C'],
      ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }],
      ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
      ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V'],
    ];

    expect(normalizeSettings(settings, 6)).toEqual([
      [
        createRootColspanSettings({ label: 'A' }),
        createRootColspanSettings({ label: 'B', colspan: 5, origColspan: 5 }),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
      ],
      [
        createRootColspanSettings({ label: 'D' }),
        createRootColspanSettings({ label: 'E', colspan: 4, origColspan: 4 }),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createRootColspanSettings({ label: 'F' }),
      ],
      [
        createRootColspanSettings({ label: 'H' }),
        createRootColspanSettings({ label: 'I', colspan: 2, origColspan: 2 }),
        createPlaceholder(),
        createRootColspanSettings({ label: 'J', colspan: 2, origColspan: 2 }),
        createPlaceholder(),
        createRootColspanSettings({ label: 'K' }),
      ],
      [
        createRootColspanSettings({ label: 'N' }),
        createRootColspanSettings({ label: 'O' }),
        createRootColspanSettings({ label: 'P' }),
        createRootColspanSettings({ label: 'Q' }),
        createRootColspanSettings({ label: 'R' }),
        createRootColspanSettings({ label: 'S' }),
      ],
    ]);
    expect(normalizeSettings(settings, 4)).toEqual([
      [
        createRootColspanSettings({ label: 'A' }),
        createRootColspanSettings({ label: 'B', colspan: 3, origColspan: 3 }),
        createPlaceholder(),
        createPlaceholder(),
      ],
      [
        createRootColspanSettings({ label: 'D' }),
        createRootColspanSettings({ label: 'E', colspan: 3, origColspan: 3 }),
        createPlaceholder(),
        createPlaceholder(),
      ],
      [
        createRootColspanSettings({ label: 'H' }),
        createRootColspanSettings({ label: 'I', colspan: 2, origColspan: 2 }),
        createPlaceholder(),
        createRootColspanSettings({ label: 'J' }),
      ],
      [
        createRootColspanSettings({ label: 'N' }),
        createRootColspanSettings({ label: 'O' }),
        createRootColspanSettings({ label: 'P' }),
        createRootColspanSettings({ label: 'Q' }),
      ],
    ]);
    expect(normalizeSettings(settings, 1)).toEqual([
      [
        createRootColspanSettings({ label: 'A' }),
      ],
      [
        createRootColspanSettings({ label: 'D' }),
      ],
      [
        createRootColspanSettings({ label: 'H' }),
      ],
      [
        createRootColspanSettings({ label: 'N' }),
      ],
    ]);
    expect(normalizeSettings(settings, 0)).toEqual([]);
    expect(normalizeSettings(settings, 2)).toEqual([
      [
        createRootColspanSettings({ label: 'A' }),
        createRootColspanSettings({ label: 'B' }),
      ],
      [
        createRootColspanSettings({ label: 'D' }),
        createRootColspanSettings({ label: 'E' }),
      ],
      [
        createRootColspanSettings({ label: 'H' }),
        createRootColspanSettings({ label: 'I' }),
      ],
      [
        createRootColspanSettings({ label: 'N' }),
        createRootColspanSettings({ label: 'O' }),
      ],
    ]);
  });

  it('should normalize user-defined settings even when it contains overlapping headers', () => {
    const settings = [
      ['A1', 'A2'],
      [{ label: 'B1' }, { label: 'B2', colspan: 4 }],
      ['C1', { label: 'C2', colspan: 3 }, { label: 'C3', colspan: 2 }, 'C4'],
    ];

    expect(normalizeSettings(settings)).toEqual([
      [
        createRootColspanSettings({ label: 'A1' }),
        createRootColspanSettings({ label: 'A2' }),
        createRootColspanSettings({ label: '' }),
        createRootColspanSettings({ label: '' }),
        createRootColspanSettings({ label: '' }),
        createRootColspanSettings({ label: '' }),
        createRootColspanSettings({ label: '' }),
      ],
      [
        createRootColspanSettings({ label: 'B1' }),
        createRootColspanSettings({ label: 'B2', colspan: 4, origColspan: 4 }),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createRootColspanSettings({ label: '' }),
        createRootColspanSettings({ label: '' }),
      ],
      [
        createRootColspanSettings({ label: 'C1' }),
        createRootColspanSettings({ label: 'C2', colspan: 3, origColspan: 3 }),
        createPlaceholder(),
        createPlaceholder(),
        createRootColspanSettings({ label: 'C3', colspan: 2, origColspan: 2 }),
        createPlaceholder(),
        createRootColspanSettings({ label: 'C4' }),
      ],
    ]);
  });
});
