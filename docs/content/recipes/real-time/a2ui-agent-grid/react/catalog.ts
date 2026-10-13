import { Catalog } from '@a2ui/web_core/v0_9';
import { basicCatalog } from '@a2ui/react/v0_9';
import { HotGrid } from './HotGrid';

// A custom catalog: everything from the A2UI basic catalog, plus HotGrid.
// The agent selects it by this id in `createSurface`.
export const CATALOG_ID = 'https://handsontable.com/a2ui/catalogs/hot-grid/v0_9';

export const hotCatalog = new Catalog(
  CATALOG_ID,
  '0.9',
  [...basicCatalog.components.values(), HotGrid],
  [...basicCatalog.functions.values()],
  basicCatalog.themeSchema,
);
