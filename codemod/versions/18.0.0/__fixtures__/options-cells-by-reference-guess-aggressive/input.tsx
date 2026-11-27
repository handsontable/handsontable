import { HotTable } from '@handsontable/react-wrapper';
import { importedCells } from './cells';

// Under --aggressive the first function that the name holds is edited.
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
