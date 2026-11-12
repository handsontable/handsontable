import { getTheme, registerTheme } from 'handsontable/themes';

const radius = '8px';

registerTheme('my-theme', {
  tokens: {
    borderRadius: radius,
    // TODO(handsontable-codemod 18.0.0/theme-token-wrapper-border-width): Removed in 18.0. Delete this token. To keep a visible border, draw it with `.ht-theme-<name>.ht-root-wrapper { box-shadow: 0 0 0 <width> <color>; }`
    wrapperBorderWidth: '1px',
    // TODO(handsontable-codemod 18.0.0/theme-token-wrapper-border-color): Removed in 18.0. Delete this token. To keep a visible border, draw it with `.ht-theme-<name>.ht-root-wrapper { box-shadow: 0 0 0 <width> <color>; }`
    wrapperBorderColor: ['colors.palette.200', 'colors.palette.700'],
    rowHeaderWidth: '40px',
  },
});

getTheme('my-theme')?.params({
  tokens: {
    'borderRadius': '4px',
  },
});

const wrapperBorderRadius = '2px';

getTheme('my-theme')?.params({
  tokens: {
    borderRadius: wrapperBorderRadius,
  },
});

registerTheme('both', {
  tokens: {
    wrapperBorderRadius: '1px',
    borderRadius: '2px',
  },
});

// An object that has nothing to do with the theme API keeps its key.
const card = { wrapperBorderRadius: 12, title: 'Card' };

export { card };
