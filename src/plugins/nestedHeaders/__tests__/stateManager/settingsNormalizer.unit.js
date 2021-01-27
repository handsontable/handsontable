/* eslint max-len: ["error", { "code": 140 }] */
import { normalizeSettings } from 'handsontable/plugins/nestedHeaders/stateManager/settingsNormalizer';

describe('normalizeSettings', () => {
  it('should normalize user-defined settings into known uniform structure data (simple settings)', () => {
    expect(normalizeSettings([])).toEqual([]);
    expect(normalizeSettings([[]])).toEqual([[]]);
    expect(normalizeSettings([['A1']])).toEqual([[
      {
        label: 'A1', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
      },
    ]]);
    expect(normalizeSettings([
      ['A1'],
      [{ label: true }, 'B2', 4],
      [],
    ])).toEqual([
      [
        {
          label: 'A1', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
      ],
      [
        {
          label: 'true', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: 'B2', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: '4', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
      ],
      [
        {
          label: '', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
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
        {
          label: 'A', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: 'B', colspan: 8, origColspan: 8, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: true, isCollapsed: false, collapsible: false, isBlank: true,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: true, isCollapsed: false, collapsible: false, isBlank: true,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: true, isCollapsed: false, collapsible: false, isBlank: true,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: true, isCollapsed: false, collapsible: false, isBlank: true,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: true, isCollapsed: false, collapsible: false, isBlank: true,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: true, isCollapsed: false, collapsible: false, isBlank: true,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: true, isCollapsed: false, collapsible: false, isBlank: true,
        },
        {
          label: 'C', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
      ],
      [
        {
          label: 'D', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: 'E', colspan: 4, origColspan: 4, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: true, isCollapsed: false, collapsible: false, isBlank: true,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: true, isCollapsed: false, collapsible: false, isBlank: true,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: true, isCollapsed: false, collapsible: false, isBlank: true,
        },
        {
          label: 'F', colspan: 4, origColspan: 4, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: true, isCollapsed: false, collapsible: false, isBlank: true,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: true, isCollapsed: false, collapsible: false, isBlank: true,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: true, isCollapsed: false, collapsible: false, isBlank: true,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
      ],
      [
        {
          label: 'H', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: 'I', colspan: 2, origColspan: 2, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: true, isCollapsed: false, collapsible: false, isBlank: true,
        },
        {
          label: 'J', colspan: 2, origColspan: 2, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: true, isCollapsed: false, collapsible: false, isBlank: true,
        },
        {
          label: 'K', colspan: 2, origColspan: 2, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: true, isCollapsed: false, collapsible: false, isBlank: true,
        },
        {
          label: 'L', colspan: 2, origColspan: 2, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: true, isCollapsed: false, collapsible: false, isBlank: true,
        },
        {
          label: 'M', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
      ],
      [
        {
          label: 'N', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: 'O', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: 'P', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: 'Q', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: 'R', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: 'S', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: 'T', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: 'U', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: 'V', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
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
        {
          label: 'A', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: 'B', colspan: 5, origColspan: 5, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: true, isCollapsed: false, collapsible: false, isBlank: true,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: true, isCollapsed: false, collapsible: false, isBlank: true,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: true, isCollapsed: false, collapsible: false, isBlank: true,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: true, isCollapsed: false, collapsible: false, isBlank: true,
        },
      ],
      [
        {
          label: 'D', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: 'E', colspan: 4, origColspan: 4, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: true, isCollapsed: false, collapsible: false, isBlank: true,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: true, isCollapsed: false, collapsible: false, isBlank: true,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: true, isCollapsed: false, collapsible: false, isBlank: true,
        },
        {
          label: 'F', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
      ],
      [
        {
          label: 'H', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: 'I', colspan: 2, origColspan: 2, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: true, isCollapsed: false, collapsible: false, isBlank: true,
        },
        {
          label: 'J', colspan: 2, origColspan: 2, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: true, isCollapsed: false, collapsible: false, isBlank: true,
        },
        {
          label: 'K', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
      ],
      [
        {
          label: 'N', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: 'O', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: 'P', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: 'Q', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: 'R', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: 'S', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
      ],
    ]);
    expect(normalizeSettings(settings, 4)).toEqual([
      [
        {
          label: 'A', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: 'B', colspan: 3, origColspan: 3, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: true, isCollapsed: false, collapsible: false, isBlank: true,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: true, isCollapsed: false, collapsible: false, isBlank: true,
        },
      ],
      [
        {
          label: 'D', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: 'E', colspan: 3, origColspan: 3, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: true, isCollapsed: false, collapsible: false, isBlank: true,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: true, isCollapsed: false, collapsible: false, isBlank: true,
        },
      ],
      [
        {
          label: 'H', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: 'I', colspan: 2, origColspan: 2, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: true, isCollapsed: false, collapsible: false, isBlank: true,
        },
        {
          label: 'J', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
      ],
      [
        {
          label: 'N', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: 'O', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: 'P', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: 'Q', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
      ],
    ]);
    expect(normalizeSettings(settings, 1)).toEqual([
      [
        {
          label: 'A', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
      ],
      [
        {
          label: 'D', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
      ],
      [
        {
          label: 'H', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
      ],
      [
        {
          label: 'N', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
      ],
    ]);
    expect(normalizeSettings(settings, 0)).toEqual([]);
    expect(normalizeSettings(settings, 2)).toEqual([
      [
        {
          label: 'A', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: 'B', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
      ],
      [
        {
          label: 'D', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: 'E', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
      ],
      [
        {
          label: 'H', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: 'I', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
      ],
      [
        {
          label: 'N', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: 'O', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
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
        {
          label: 'A1', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: 'A2', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
      ],
      [
        {
          label: 'B1', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: 'B2', colspan: 4, origColspan: 4, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: true, isCollapsed: false, collapsible: false, isBlank: true,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: true, isCollapsed: false, collapsible: false, isBlank: true,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: true, isCollapsed: false, collapsible: false, isBlank: true,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
      ],
      [
        {
          label: 'C1', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: 'C2', colspan: 3, origColspan: 3, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: true, isCollapsed: false, collapsible: false, isBlank: true,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: true, isCollapsed: false, collapsible: false, isBlank: true,
        },
        {
          label: 'C3', colspan: 2, origColspan: 2, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
        {
          label: '', colspan: 1, origColspan: 1, isHidden: true, isCollapsed: false, collapsible: false, isBlank: true,
        },
        {
          label: 'C4', colspan: 1, origColspan: 1, isHidden: false, isCollapsed: false, collapsible: false, isBlank: false,
        },
      ],
    ]);
  });
});
