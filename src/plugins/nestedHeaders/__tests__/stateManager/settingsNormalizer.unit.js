/* eslint max-len: ["error", { "code": 140 }] */
import { normalizeSettings } from 'handsontable/plugins/nestedHeaders/stateManager/settingsNormalizer';

function createColspanSettings(overwriteProps = {}) {
  return {
    label: '',
    colspan: 1,
    origColspan: 1,
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
    isPlaceholder: true,
  };
}

describe('normalizeSettings', () => {
  it('should normalize user-defined settings into known uniform structure data (simple settings)', () => {
    expect(normalizeSettings([])).toEqual([]);
    expect(normalizeSettings([[]])).toEqual([[]]);
    expect(normalizeSettings([['A1']])).toEqual([[
      createColspanSettings({ label: 'A1' })
    ]]);
    expect(normalizeSettings([
      ['A1'],
      [{ label: true }, 'B2', 4],
      [],
    ])).toEqual([
      [
        createColspanSettings({ label: 'A1' }),
        createColspanSettings({ label: '' }),
        createColspanSettings({ label: '' }),
      ],
      [
        createColspanSettings({ label: 'true' }),
        createColspanSettings({ label: 'B2' }),
        createColspanSettings({ label: '4' }),
      ],
      [
        createColspanSettings({ label: '' }),
        createColspanSettings({ label: '' }),
        createColspanSettings({ label: '' }),
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
        createColspanSettings({ label: 'A' }),
        createColspanSettings({ label: 'B', colspan: 8, origColspan: 8 }),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createColspanSettings({ label: 'C' }),
      ],
      [
        createColspanSettings({ label: 'D' }),
        createColspanSettings({ label: 'E', colspan: 4, origColspan: 4 }),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createColspanSettings({ label: 'F', colspan: 4, origColspan: 4 }),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createColspanSettings({ label: '' }),
      ],
      [
        createColspanSettings({ label: 'H' }),
        createColspanSettings({ label: 'I', colspan: 2, origColspan: 2 }),
        createPlaceholder(),
        createColspanSettings({ label: 'J', colspan: 2, origColspan: 2 }),
        createPlaceholder(),
        createColspanSettings({ label: 'K', colspan: 2, origColspan: 2 }),
        createPlaceholder(),
        createColspanSettings({ label: 'L', colspan: 2, origColspan: 2 }),
        createPlaceholder(),
        createColspanSettings({ label: 'M' }),
      ],
      [
        createColspanSettings({ label: 'N' }),
        createColspanSettings({ label: 'O' }),
        createColspanSettings({ label: 'P' }),
        createColspanSettings({ label: 'Q' }),
        createColspanSettings({ label: 'R' }),
        createColspanSettings({ label: 'S' }),
        createColspanSettings({ label: 'T' }),
        createColspanSettings({ label: 'U' }),
        createColspanSettings({ label: 'V' }),
        createColspanSettings({ label: '' }),
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
        createColspanSettings({ label: 'A' }),
        createColspanSettings({ label: 'B', colspan: 5, origColspan: 5 }),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
      ],
      [
        createColspanSettings({ label: 'D' }),
        createColspanSettings({ label: 'E', colspan: 4, origColspan: 4 }),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createColspanSettings({ label: 'F' }),
      ],
      [
        createColspanSettings({ label: 'H' }),
        createColspanSettings({ label: 'I', colspan: 2, origColspan: 2 }),
        createPlaceholder(),
        createColspanSettings({ label: 'J', colspan: 2, origColspan: 2 }),
        createPlaceholder(),
        createColspanSettings({ label: 'K' }),
      ],
      [
        createColspanSettings({ label: 'N' }),
        createColspanSettings({ label: 'O' }),
        createColspanSettings({ label: 'P' }),
        createColspanSettings({ label: 'Q' }),
        createColspanSettings({ label: 'R' }),
        createColspanSettings({ label: 'S' }),
      ],
    ]);
    expect(normalizeSettings(settings, 4)).toEqual([
      [
        createColspanSettings({ label: 'A' }),
        createColspanSettings({ label: 'B', colspan: 3, origColspan: 3 }),
        createPlaceholder(),
        createPlaceholder(),
      ],
      [
        createColspanSettings({ label: 'D' }),
        createColspanSettings({ label: 'E', colspan: 3, origColspan: 3 }),
        createPlaceholder(),
        createPlaceholder(),
      ],
      [
        createColspanSettings({ label: 'H' }),
        createColspanSettings({ label: 'I', colspan: 2, origColspan: 2 }),
        createPlaceholder(),
        createColspanSettings({ label: 'J' }),
      ],
      [
        createColspanSettings({ label: 'N' }),
        createColspanSettings({ label: 'O' }),
        createColspanSettings({ label: 'P' }),
        createColspanSettings({ label: 'Q' }),
      ],
    ]);
    expect(normalizeSettings(settings, 1)).toEqual([
      [
        createColspanSettings({ label: 'A' }),
      ],
      [
        createColspanSettings({ label: 'D' }),
      ],
      [
        createColspanSettings({ label: 'H' }),
      ],
      [
        createColspanSettings({ label: 'N' }),
      ],
    ]);
    expect(normalizeSettings(settings, 0)).toEqual([]);
    expect(normalizeSettings(settings, 2)).toEqual([
      [
        createColspanSettings({ label: 'A' }),
        createColspanSettings({ label: 'B' }),
      ],
      [
        createColspanSettings({ label: 'D' }),
        createColspanSettings({ label: 'E' }),
      ],
      [
        createColspanSettings({ label: 'H' }),
        createColspanSettings({ label: 'I' }),
      ],
      [
        createColspanSettings({ label: 'N' }),
        createColspanSettings({ label: 'O' }),
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
        createColspanSettings({ label: 'A1' }),
        createColspanSettings({ label: 'A2' }),
        createColspanSettings({ label: '' }),
        createColspanSettings({ label: '' }),
        createColspanSettings({ label: '' }),
        createColspanSettings({ label: '' }),
        createColspanSettings({ label: '' }),
      ],
      [
        createColspanSettings({ label: 'B1' }),
        createColspanSettings({ label: 'B2', colspan: 4, origColspan: 4 }),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createColspanSettings({ label: '' }),
        createColspanSettings({ label: '' }),
      ],
      [
        createColspanSettings({ label: 'C1' }),
        createColspanSettings({ label: 'C2', colspan: 3, origColspan: 3 }),
        createPlaceholder(),
        createPlaceholder(),
        createColspanSettings({ label: 'C3', colspan: 2, origColspan: 2 }),
        createPlaceholder(),
        createColspanSettings({ label: 'C4' }),
      ],
    ]);
  });
});
