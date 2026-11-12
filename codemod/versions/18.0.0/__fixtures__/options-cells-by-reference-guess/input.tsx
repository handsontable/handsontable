import { HotTable } from '@handsontable/react-wrapper';
import { importedCells } from './cells';

// A name that may hold another function at run time is reported, not rewritten.
let reassigned = () => ({ correctFormat: true });
reassigned = importedCells;

function rewritten() {
  return { correctFormat: true };
}
rewritten = importedCells;

export const A = () => (
  <>
    <HotTable licenseKey="k" cells={reassigned} />
    <HotTable licenseKey="k" cells={rewritten} />
  </>
);
