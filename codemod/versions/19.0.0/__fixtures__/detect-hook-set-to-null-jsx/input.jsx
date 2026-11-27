import { HotTable } from '@handsontable/react-wrapper';

export function Grid({ tracking }) {
  return (
    <>
      <HotTable afterChange={tracking ? logChange : null} />
      <HotTable afterChange={null} />
      <HotTable afterChange={logChange} />
      <HotTable afterChange={tracking ? logChange : undefined} />
      <Other afterChange={null} />
    </>
  );
}
