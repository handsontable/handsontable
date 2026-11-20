import { HotTable, HotColumn } from '@handsontable/react-wrapper';

export function Grid(props) {
  return (
    <HotTable licenseKey="non-commercial-and-evaluation">
      {/* TODO(handsontable-codemod 18.0.0/date-default-format): Check the source data of this date column, which sets no dateFormat. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-date-and-time-cells-to-iso-8601-format */}
      <HotColumn data="a" type="date" />
      {/* TODO(handsontable-codemod 18.0.0/time-default-format): Check the source data of this time column, which sets no timeFormat. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-date-and-time-cells-to-iso-8601-format */}
      <HotColumn data="b" type="time" />
      <HotColumn data="c" type="date" dateFormat={{ year: 'numeric', month: '2-digit', day: '2-digit' }} />
      <HotColumn data="d" type="time" timeFormat={{ hour: 'numeric' }} />
      <HotColumn data="e" type="date" {...props} />
      <HotColumn data="f" type="text" />
    </HotTable>
  );
}

export const Formatted = () => (
  <HotTable dateFormat={{ year: 'numeric' }} timeFormat={{ hour: 'numeric' }}>
    <HotColumn data="a" type="date" />
    <HotColumn data="b" type="time" />
  </HotTable>
);
