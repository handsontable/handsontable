import { useCallback } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import Handsontable from 'handsontable';

// TODO(handsontable-codemod 18.0.0/correct-format-removed): Deleted correctFormat here. Use valueParser or valueSetter to correct entered values. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
const plainCells = () => ({});
function namedCells() {
  // TODO(handsontable-codemod 18.0.0/correct-format-removed): Deleted correctFormat here. Use valueParser or valueSetter to correct entered values. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
  return {};
}
const expressionCells = function(row: number, col: number) {
  return col === 1 ? {
    locale: 'de-DE',
    numericFormat: {}
  } : { readOnly: true };
};
function dateCells() {
  // TODO(handsontable-codemod 18.0.0/moment-date-format): Replace the string dateFormat with an Intl.DateTimeFormat object. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-date-and-time-cells-to-iso-8601-format
  return { dateFormat: 'DD/MM/YYYY' };
}
const vanillaCells = () => ({
  locale: 'pl-PL',
  numericFormat: {}
});

export const A = () => <HotTable licenseKey="k" cells={plainCells} />;
export const B = () => <HotTable licenseKey="k" cells={namedCells} />;
export const C = () => <HotTable licenseKey="k" cells={expressionCells} />;
export const D = () => <HotTable licenseKey="k" cells={dateCells} />;

export function Memo() {
  // TODO(handsontable-codemod 18.0.0/correct-format-removed): Deleted correctFormat here. Use valueParser or valueSetter to correct entered values. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
  const cells = useCallback(() => ({}), []);
  // TODO(handsontable-codemod 18.0.0/correct-format-removed): Deleted correctFormat here. Use valueParser or valueSetter to correct entered values. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
  const reactCells = React.useCallback(() => ({}), []);

  return (
    <>
      <HotTable licenseKey="k" cells={cells} />
      <HotTable licenseKey="k" cells={reactCells} />
    </>
  );
}

new Handsontable(document.body, { licenseKey: 'k', cells: vanillaCells });
