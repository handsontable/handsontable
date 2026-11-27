import { HotTable, HotColumn } from '@handsontable/react-wrapper';

export function Grid(props) {
  return (
    <HotTable licenseKey="non-commercial-and-evaluation">
      <HotColumn data="a" type="date" />
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
