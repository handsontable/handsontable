import { HotTable } from '@handsontable/react-wrapper';
import { importedCells } from './cells';

// A name that may hold another function at run time is reported, not rewritten.
// TODO(handsontable-codemod 18.0.0/correct-format-removed): Use valueParser or valueSetter to correct entered values. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
let reassigned = () => ({ correctFormat: true });
reassigned = importedCells;

function rewritten() {
  // TODO(handsontable-codemod 18.0.0/correct-format-removed): Use valueParser or valueSetter to correct entered values. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
  return { correctFormat: true };
}
rewritten = importedCells;

export const A = () => (
  <>
    <HotTable licenseKey="k" cells={reassigned} />
    <HotTable licenseKey="k" cells={rewritten} />
  </>
);
