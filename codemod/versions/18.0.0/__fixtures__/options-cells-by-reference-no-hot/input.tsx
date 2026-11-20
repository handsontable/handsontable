// A grid of another library that only shares the prop name with handsontable.
import { HotTable } from './own-grid';

const plainCells = () => ({ correctFormat: true });

export const A = () => <HotTable cells={plainCells} />;
export const settings = { cells: plainCells };
