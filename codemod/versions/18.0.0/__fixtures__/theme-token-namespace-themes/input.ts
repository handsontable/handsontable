import Handsontable from 'handsontable/base';
import { mainTheme } from 'handsontable/themes';
import { somethingElse } from './elsewhere';

const overrides = { wrapperBorderRadius: 'sizing.size_1', foregroundColor: 'colors.palette.50' };

export const night = Handsontable.themes.registerTheme('night', mainTheme).params({
  colorScheme: 'dark',
  tokens: { wrapperBorderRadius: 'sizing.size_2' },
});

export const day = Handsontable.themes.getTheme('main')?.params({ tokens: { wrapperBorderRadius: 'sizing.size_3' } });

export const other = somethingElse.themes.registerTheme('x').params({ tokens: { wrapperBorderRadius: 'a' } });
