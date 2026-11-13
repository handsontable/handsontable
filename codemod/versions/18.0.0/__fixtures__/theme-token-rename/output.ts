import { getTheme, registerTheme } from 'handsontable/themes';

const radius = '8px';

registerTheme('my-theme', {
  tokens: {
    borderRadius: radius,
    // TODO(handsontable-codemod 18.0.0/theme-token-wrapper-border-width): Delete this token, because 18.0 removed it. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#update-theme-wrapper-border-variables
    wrapperBorderWidth: '1px',
    // TODO(handsontable-codemod 18.0.0/theme-token-wrapper-border-color): Delete this token, because 18.0 removed it. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#update-theme-wrapper-border-variables
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
    // TODO(handsontable-codemod 18.0.0/theme-token-wrapper-border-radius): Both wrapperBorderRadius and borderRadius are set in this object. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#update-theme-wrapper-border-variables
    wrapperBorderRadius: '1px',
    borderRadius: '2px',
  },
});

// An object that has nothing to do with the theme API keeps its key.
// TODO(handsontable-codemod 18.0.0/theme-token-wrapper-border-radius): Rename the wrapperBorderRadius token to borderRadius if this object is passed to the theme API. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#update-theme-wrapper-border-variables
const card = { wrapperBorderRadius: 12, title: 'Card' };

export { card };
