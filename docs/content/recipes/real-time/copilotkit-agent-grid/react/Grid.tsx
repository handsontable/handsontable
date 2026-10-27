import { RefObject, memo } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { HyperFormula } from 'hyperformula';
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';

registerAllModules();

export type GridProps = {
  // Lifted to the parent so the agent tools and the snapshot bridge can reach the live instance
  // (setDataAtCell, alter, getPlugin('undoRedo'), getSourceData, and so on).
  hotRef: RefObject<HotTableRef>;
  // Passed once, at mount, and never fed back. After this the grid owns its data: every later
  // change goes through the instance, not through this prop. See the memo note below.
  initialColumns: string[];
  initialData: (string | number)[][];
  themeName?: string;
  // Runs after any change that touches the source data, so the parent can re-snapshot for the agent.
  onMutate: () => void;
};

function GridImpl({ hotRef, initialColumns, initialData, themeName = 'ht-theme-main', onMutate }: GridProps) {
  return (
    <HotTable
      ref={hotRef}
      themeName={themeName}
      // Passed once, then left alone. All mutations go through the instance; the grid is the source
      // of truth for the data, and React keeps only a read-only snapshot (see the canvas in Step 3).
      data={initialData}
      colHeaders={initialColumns.length ? initialColumns : true}
      rowHeaders={true}
      height="auto"
      width="100%"
      stretchH="all"
      formulas={{ engine: HyperFormula }}
      licenseKey="non-commercial-and-evaluation"
      // Formula-safe interactive features: none of these reorder rows or columns, so the in-grid
      // formulas and the source-data snapshot stay correct.
      contextMenu={true}
      manualColumnResize={true}
      manualRowResize={true}
      // columnSorting, filters, dropdownMenu, manualRowMove, and manualColumnMove are off on purpose.
      // Reordering rewrites in-grid aggregate formulas: a sort turns a totals row's =SUM(D1:D3) into
      // =SUM(#REF!), and a manual row move silently mangles the range. See "Known limitations".
      afterChange={(_changes, source) => {
        if (source !== 'loadData') onMutate();
      }}
      afterCreateRow={onMutate}
      afterRemoveRow={onMutate}
      afterCreateCol={onMutate}
      afterRemoveCol={onMutate}
      afterUpdateData={onMutate}
    />
  );
}

// Memoized with referentially stable props so the parent's snapshot re-renders never re-render the
// grid. This is load-bearing: @handsontable/react-wrapper re-applies the data prop through
// updateSettings on every render, which would overwrite the instance-owned data and reset the undo
// stack. Keep the initial data in a ref and the handlers in useCallback so these props never change.
export const Grid = memo(GridImpl);
