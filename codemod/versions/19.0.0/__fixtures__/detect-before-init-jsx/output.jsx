import { HotTable } from '@handsontable/react-wrapper';

// TODO(handsontable-codemod 19.0.0/before-init-option): Check what this beforeInit callback does, because 19.0 runs it. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#a-beforeinit-callback-in-your-settings-now-runs
export const Grid = () => <HotTable data={[[1]]} beforeInit={() => {}} afterInit={() => {}} />;
