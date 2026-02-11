/* eslint max-len: ["error", { "code": 140 }] */
import {
  createColspanSettings,
  createPlaceholder,
} from 'handsontable/plugins/nestedHeaders/__tests__/helpers';
import { normalizeSettings } from 'handsontable/plugins/nestedHeaders/stateManager/settingsNormalizer';

function createColspanSourceSettings(overwriteProps) {
  return {
    ...createColspanSettings(overwriteProps),
    crossHiddenColumns: [],
    isRoot: false,
  };
}

describe('normalizeSettings', () => {
  it('should normalize user-defined settings into known uniform structure data (simple settings)', () => {
    expect(normalizeSettings([])).toEqual([]);
    expect(normalizeSettings([[]])).toEqual([[]]);
    expect(normalizeSettings([['A1']])).toEqual([[
      createColspanSourceSettings({ l: 'A1' })
    ]]);
    expect(normalizeSettings([
      ['A1'],
      [{ label: true }, 'B2', 4],
      [],
    ])).toEqual([
      [
        createColspanSourceSettings({ l: 'A1' }),
        createColspanSourceSettings({ l: '' }),
        createColspanSourceSettings({ l: '' }),
      ],
      [
        createColspanSourceSettings({ l: 'true' }),
        createColspanSourceSettings({ l: 'B2' }),
        createColspanSourceSettings({ l: '4' }),
      ],
      [
        createColspanSourceSettings({ l: '' }),
        createColspanSourceSettings({ l: '' }),
        createColspanSourceSettings({ l: '' }),
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
        createColspanSourceSettings({ l: 'A' }),
        createColspanSourceSettings({ l: 'B', colspan: 8, origColspan: 8 }),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createColspanSourceSettings({ l: 'C' }),
      ],
      [
        createColspanSourceSettings({ l: 'D' }),
        createColspanSourceSettings({ l: 'E', colspan: 4, origColspan: 4 }),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createColspanSourceSettings({ l: 'F', colspan: 4, origColspan: 4 }),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createColspanSourceSettings({ l: '' }),
      ],
      [
        createColspanSourceSettings({ l: 'H' }),
        createColspanSourceSettings({ l: 'I', colspan: 2, origColspan: 2 }),
        createPlaceholder(),
        createColspanSourceSettings({ l: 'J', colspan: 2, origColspan: 2 }),
        createPlaceholder(),
        createColspanSourceSettings({ l: 'K', colspan: 2, origColspan: 2 }),
        createPlaceholder(),
        createColspanSourceSettings({ l: 'L', colspan: 2, origColspan: 2 }),
        createPlaceholder(),
        createColspanSourceSettings({ l: 'M' }),
      ],
      [
        createColspanSourceSettings({ l: 'N' }),
        createColspanSourceSettings({ l: 'O' }),
        createColspanSourceSettings({ l: 'P' }),
        createColspanSourceSettings({ l: 'Q' }),
        createColspanSourceSettings({ l: 'R' }),
        createColspanSourceSettings({ l: 'S' }),
        createColspanSourceSettings({ l: 'T' }),
        createColspanSourceSettings({ l: 'U' }),
        createColspanSourceSettings({ l: 'V' }),
        createColspanSourceSettings({ l: '' }),
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
        createColspanSourceSettings({ l: 'A' }),
        createColspanSourceSettings({ l: 'B', colspan: 5, origColspan: 5 }),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
      ],
      [
        createColspanSourceSettings({ l: 'D' }),
        createColspanSourceSettings({ l: 'E', colspan: 4, origColspan: 4 }),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createColspanSourceSettings({ l: 'F' }),
      ],
      [
        createColspanSourceSettings({ l: 'H' }),
        createColspanSourceSettings({ l: 'I', colspan: 2, origColspan: 2 }),
        createPlaceholder(),
        createColspanSourceSettings({ l: 'J', colspan: 2, origColspan: 2 }),
        createPlaceholder(),
        createColspanSourceSettings({ l: 'K' }),
      ],
      [
        createColspanSourceSettings({ l: 'N' }),
        createColspanSourceSettings({ l: 'O' }),
        createColspanSourceSettings({ l: 'P' }),
        createColspanSourceSettings({ l: 'Q' }),
        createColspanSourceSettings({ l: 'R' }),
        createColspanSourceSettings({ l: 'S' }),
      ],
    ]);
    expect(normalizeSettings(settings, 4)).toEqual([
      [
        createColspanSourceSettings({ l: 'A' }),
        createColspanSourceSettings({ l: 'B', colspan: 3, origColspan: 3 }),
        createPlaceholder(),
        createPlaceholder(),
      ],
      [
        createColspanSourceSettings({ l: 'D' }),
        createColspanSourceSettings({ l: 'E', colspan: 3, origColspan: 3 }),
        createPlaceholder(),
        createPlaceholder(),
      ],
      [
        createColspanSourceSettings({ l: 'H' }),
        createColspanSourceSettings({ l: 'I', colspan: 2, origColspan: 2 }),
        createPlaceholder(),
        createColspanSourceSettings({ l: 'J' }),
      ],
      [
        createColspanSourceSettings({ l: 'N' }),
        createColspanSourceSettings({ l: 'O' }),
        createColspanSourceSettings({ l: 'P' }),
        createColspanSourceSettings({ l: 'Q' }),
      ],
    ]);
    expect(normalizeSettings(settings, 1)).toEqual([
      [
        createColspanSourceSettings({ l: 'A' }),
      ],
      [
        createColspanSourceSettings({ l: 'D' }),
      ],
      [
        createColspanSourceSettings({ l: 'H' }),
      ],
      [
        createColspanSourceSettings({ l: 'N' }),
      ],
    ]);
    expect(normalizeSettings(settings, 0)).toEqual([]);
    expect(normalizeSettings(settings, 2)).toEqual([
      [
        createColspanSourceSettings({ l: 'A' }),
        createColspanSourceSettings({ l: 'B' }),
      ],
      [
        createColspanSourceSettings({ l: 'D' }),
        createColspanSourceSettings({ l: 'E' }),
      ],
      [
        createColspanSourceSettings({ l: 'H' }),
        createColspanSourceSettings({ l: 'I' }),
      ],
      [
        createColspanSourceSettings({ l: 'N' }),
        createColspanSourceSettings({ l: 'O' }),
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
        createColspanSourceSettings({ l: 'A1' }),
        createColspanSourceSettings({ l: 'A2' }),
        createColspanSourceSettings({ l: '' }),
        createColspanSourceSettings({ l: '' }),
        createColspanSourceSettings({ l: '' }),
        createColspanSourceSettings({ l: '' }),
        createColspanSourceSettings({ l: '' }),
      ],
      [
        createColspanSourceSettings({ l: 'B1' }),
        createColspanSourceSettings({ l: 'B2', colspan: 4, origColspan: 4 }),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createColspanSourceSettings({ l: '' }),
        createColspanSourceSettings({ l: '' }),
      ],
      [
        createColspanSourceSettings({ l: 'C1' }),
        createColspanSourceSettings({ l: 'C2', colspan: 3, origColspan: 3 }),
        createPlaceholder(),
        createPlaceholder(),
        createColspanSourceSettings({ l: 'C3', colspan: 2, origColspan: 2 }),
        createPlaceholder(),
        createColspanSourceSettings({ l: 'C4' }),
      ],
    ]);
  });
});
