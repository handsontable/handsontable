"use client";

import { shallow } from "@liveblocks/client";
import { HotTable } from "@handsontable/react-wrapper";
import { registerAllModules } from "handsontable/registry";
import { textRenderer } from "handsontable/renderers";
import type { CellChange, ChangeSource } from "handsontable/common";
import {
  useMutation,
  useOthersListener,
  useStorage,
} from "@liveblocks/react/suspense";
import { useCallback, useRef } from "react";
import type { HotTableRef } from "@handsontable/react-wrapper";
import { GRID_COLS, GRID_ROWS } from "./liveblocks.config";

registerAllModules();

export function Table() {
  const hotRef = useRef<HotTableRef>(null);

  // Get the realtime grid contents from Liveblocks Storage
  const data = useStorage(
    (root) =>
      root.grid.map((row) =>
        Array.from({ length: GRID_COLS }, (_, c) => String(row[c] ?? ""))
      ),
    shallow
  );

  // Update a cell's value
  const updateCell = useMutation(
    ({ storage }, rowIndex: number, colIndex: number, value: string) => {
      const grid = storage.get("grid");
      const row = grid.get(rowIndex);
      if (row) {
        row.set(colIndex, value);
      }
    },
    []
  );

  // Update the grid when a cell is changed
  const afterChange = useCallback(
    (changes: CellChange[] | null, source: ChangeSource) => {
      if (!changes || source === "loadData") {
        return;
      }

      for (const [row, prop, , newVal] of changes) {
        if (typeof prop !== "number") {
          continue;
        }

        updateCell(
          row,
          prop,
          newVal === null || newVal === undefined ? "" : String(newVal)
        );
      }
    },
    [updateCell]
  );

  // Sync selected cell to presence
  const syncSelectedCellToPresence = useMutation(
    ({ setMyPresence }, row: number, col: number) => {
      setMyPresence({
        selectedCell: { row: row < 0 ? 0 : row, col: col < 0 ? 0 : col },
      });
    },
    []
  );

  const clearSelectedCellPresence = useMutation(({ setMyPresence }) => {
    setMyPresence({ selectedCell: null });
  }, []);

  // Render presence inside cells
  const renderDataCell = useMutation(
    ({ others }, ...props: Parameters<typeof textRenderer>) => {
      textRenderer(...props);
      const [, td, row, col] = props;

      // Find users who have selected this cell
      const selectedOthers = others.filter(
        (o) =>
          o.presence.selectedCell?.row === row &&
          o.presence.selectedCell?.col === col
      );

      if (!selectedOthers.length) {
        td.style.boxShadow = "";
        return;
      }

      // Add inner borders for selected users
      td.style.boxShadow = selectedOthers
        .map((p, i) => `inset 0 0 0 ${2 + i * 2}px ${p.info.color}`)
        .join(", ");
    },
    []
  );

  // Re-render the table when others update their presence
  useOthersListener(({ type }) => {
    if (type === "update") {
      hotRef.current?.hotInstance?.render();
    }
  });

  return (
    <HotTable
      ref={hotRef}
      data={data}
      hotRenderer={renderDataCell}
      afterChange={afterChange}
      afterSelection={syncSelectedCellToPresence}
      afterDeselect={clearSelectedCellPresence}
      colHeaders={true}
      rowHeaders={true}
      height={400}
      width={600}
      licenseKey="non-commercial-and-evaluation"
      autoWrapRow={true}
      autoWrapCol={true}
    />
  );
}
