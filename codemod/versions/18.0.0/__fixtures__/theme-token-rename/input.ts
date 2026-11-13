import { getTheme, registerTheme } from 'handsontable/themes';

const radius = '8px';

registerTheme('my-theme', {
  tokens: {
    wrapperBorderRadius: radius,
    wrapperBorderWidth: '1px',
    wrapperBorderColor: ['colors.palette.200', 'colors.palette.700'],
    rowHeaderWidth: '40px',
  },
});

getTheme('my-theme')?.params({
  tokens: {
    'wrapperBorderRadius': '4px',
  },
});

const wrapperBorderRadius = '2px';

getTheme('my-theme')?.params({
  tokens: {
    wrapperBorderRadius,
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
