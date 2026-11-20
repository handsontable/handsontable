import Handsontable from 'handsontable/base';
import { mainTheme } from 'handsontable/themes';
import { somethingElse } from './elsewhere';

// TODO(handsontable-codemod 18.0.0/theme-token-wrapper-border-radius): Rename the wrapperBorderRadius token to borderRadius if this object is passed to the theme API. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#update-theme-wrapper-border-variables
const overrides = { wrapperBorderRadius: 'sizing.size_1', foregroundColor: 'colors.palette.50' };

export const night = Handsontable.themes.registerTheme('night', mainTheme).params({
  colorScheme: 'dark',
  tokens: { borderRadius: 'sizing.size_2' },
});

export const day = Handsontable.themes.getTheme('main')?.params({ tokens: { borderRadius: 'sizing.size_3' } });

// TODO(handsontable-codemod 18.0.0/theme-token-wrapper-border-radius): Rename the wrapperBorderRadius token to borderRadius if this object is passed to the theme API. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#update-theme-wrapper-border-variables
export const other = somethingElse.themes.registerTheme('x').params({ tokens: { wrapperBorderRadius: 'a' } });
