import { HotTable } from '@handsontable/react-wrapper';

export function Grid({ tracking }) {
  return (
    <>
      {/* TODO(handsontable-codemod 19.0.0/hook-set-to-null): Leave the hook out of the settings, or pass the callback again, if it has to keep running. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#a-hook-set-to-null-through-updatesettings-is-removed */}
      <HotTable afterChange={tracking ? logChange : null} />
      {/* TODO(handsontable-codemod 19.0.0/hook-set-to-null): Leave the hook out of the settings, or pass the callback again, if it has to keep running. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#a-hook-set-to-null-through-updatesettings-is-removed */}
      <HotTable afterChange={null} />
      <HotTable afterChange={logChange} />
      <HotTable afterChange={tracking ? logChange : undefined} />
      <Other afterChange={null} />
    </>
  );
}
