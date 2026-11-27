import { HotTable } from '@handsontable/react-wrapper';
import { importedCells } from './cells';

// A same-name function that is never passed as `cells` is not an options object.
function unusedCells() {
  return { correctFormat: true };
}
const helper = () => ({ correctFormat: true });
const rows = helper();

const { destructured } = { destructured: () => ({ correctFormat: true }) };

export const A = (props: { cells: () => object }) => (
  <>
    <HotTable licenseKey="k" cells={importedCells} />
    <HotTable licenseKey="k" cells={destructured} />
    <HotTable licenseKey="k" cells={props.cells} />
    <HotTable licenseKey="k" cells={rows} />
  </>
);

export const B = (cells: () => object) => <HotTable licenseKey="k" cells={cells} />;
