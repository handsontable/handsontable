import { useCallback } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import Handsontable from 'handsontable';

const plainCells = () => ({ correctFormat: true });
function namedCells() {
  return { correctFormat: true };
}
const expressionCells = function(row: number, col: number) {
  return col === 1 ? { numericFormat: { culture: 'de-DE' } } : { readOnly: true };
};
function dateCells() {
  return { dateFormat: 'DD/MM/YYYY' };
}
const vanillaCells = () => ({ numericFormat: { culture: 'pl-PL' } });

export const A = () => <HotTable licenseKey="k" cells={plainCells} />;
export const B = () => <HotTable licenseKey="k" cells={namedCells} />;
export const C = () => <HotTable licenseKey="k" cells={expressionCells} />;
export const D = () => <HotTable licenseKey="k" cells={dateCells} />;

export function Memo() {
  const cells = useCallback(() => ({ correctFormat: true }), []);
  const reactCells = React.useCallback(() => ({ correctFormat: true }), []);

  return (
    <>
      <HotTable licenseKey="k" cells={cells} />
      <HotTable licenseKey="k" cells={reactCells} />
    </>
  );
}

new Handsontable(document.body, { licenseKey: 'k', cells: vanillaCells });
