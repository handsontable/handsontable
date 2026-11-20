import { HotTable } from '@handsontable/react-wrapper';
import { importedCells } from './cells';

// Under --aggressive the first function that the name holds is edited.
// TODO(handsontable-codemod 18.0.0/correct-format-removed): Deleted correctFormat here. Use valueParser or valueSetter to correct entered values. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
let reassigned = () => ({});
reassigned = importedCells;

function rewritten() {
  // TODO(handsontable-codemod 18.0.0/correct-format-removed): Deleted correctFormat here. Use valueParser or valueSetter to correct entered values. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
  return {};
}
rewritten = importedCells;

export const A = () => (
  <>
    <HotTable licenseKey="k" cells={reassigned} />
    <HotTable licenseKey="k" cells={rewritten} />
  </>
);
