"use client";

import { HotColumn, HotTable } from "@handsontable/react-wrapper";
import { registerAllModules } from "handsontable/registry";
import { CellThreadProvider } from "./CellThreadContext";
import { CommentCell } from "./CommentCell";

registerAllModules();

type RowData = { id: string; name: string; price: number };

const ROW_DATA: RowData[] = [
  { id: "1", name: "Laptop", price: 1000 },
  { id: "2", name: "Phone", price: 500 },
  { id: "3", name: "Tablet", price: 300 },
];

export function CollaborativeApp() {
  return (
    <CellThreadProvider>
      <HotTable
        data={ROW_DATA}
        colHeaders={["Name", "Price"]}
        rowHeaders={false}
        height={200}
        width={500}
        licenseKey="non-commercial-and-evaluation"
        autoWrapRow={true}
        autoWrapCol={true}
        stretchH="all"
        minRowHeights={50}
      >
        {/* Use the custom comment cell renderer */}
        <HotColumn renderer={CommentCell} data="name" readOnly />
        <HotColumn renderer={CommentCell} data="price" readOnly />
      </HotTable>
    </CellThreadProvider>
  );
}
