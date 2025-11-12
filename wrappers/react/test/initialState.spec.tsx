import React, { useState, useEffect, useRef } from "react";
import { HotTable } from "../src/hotTable";
import { HotTableRef } from "../src/types";
import { mountComponent } from "./_helpers";

describe("Initial state", () => {
  it("should be possible to set the initial state for nested headers, columns, and collapsible columns", async () => {
    let instance = null;
    const data = [
      {
        A: "A1",
        B: "B1",
        C: "C1",
        D: "D1",
        E: "E1",
        F: "F1",
        G: "G1",
        H: "H1",
        I: "I1",
        J: "J1",
      },
      {
        A: "A2",
        B: "B2",
        C: "C2",
        D: "D2",
        E: "E2",
        F: "F2",
        G: "G2",
        H: "H2",
        I: "I2",
        J: "J2",
      },
      {
        A: "A3",
        B: "B3",
        C: "C3",
        D: "D3",
        E: "E3",
        F: "F3",
        G: "G3",
        H: "H3",
        I: "I3",
        J: "J3",
      },
      {
        A: "A4",
        B: "B4",
        C: "C4",
        D: "D4",
        E: "E4",
        F: "F4",
        G: "G4",
        H: "H4",
        I: "I4",
        J: "J4",
      },
      {
        A: "A5",
        B: "B5",
        C: "C5",
        D: "D5",
        E: "E5",
        F: "F5",
        G: "G5",
        H: "H5",
        I: "I5",
        J: "J5",
      },
    ];

    function ExampleComponent() {
      type TableRow = {
        A: string;
        B: string;
        C: string;
        D: string;
        E: string;
        F: string;
        G: string;
        H: string;
        I: string;
        J: string;
      };
      const hotRef = useRef<HotTableRef>(null);
      const [tableData, setTableData] = useState<TableRow[]>([]);

      useEffect(() => {
        setTableData(data);

        instance = hotRef.current!.hotInstance!;
      }, []);

      return (
        <HotTable
          ref={hotRef}
          themeName="ht-theme-main"
          colHeaders={true}
          rowHeaders={true}
          colWidths={60}
          height="auto"
          data={tableData}
          initialState={{
            nestedHeaders: [
              ["H", { label: "BCDE", colspan: 4 }, { label: "FGHIJ", colspan: 5 }],
              [
                "H",
                { label: "BC", colspan: 2 },
                { label: "DE", colspan: 2 },
                { label: "FG", colspan: 2 },
                { label: "IJ", colspan: 2 },
                "M",
              ],
              ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],
            ],
            columns: [
              { data: "A", type: "text" },
              { data: "B", type: "text" },
              { data: "C", type: "text" },
              { data: "D", type: "text" },
              { data: "E", type: "text" },
              { data: "F", type: "text" },
              { data: "G", type: "text" },
              { data: "H", type: "text" },
              { data: "I", type: "text" },
              { data: "J", type: "text" },
            ],
            collapsibleColumns: [
              { row: -2, col: 1, collapsible: true },
              { row: -2, col: 3, collapsible: true },
              { row: -2, col: 5, collapsible: true },
              { row: -2, col: 7, collapsible: true },
            ],
          }}
          autoWrapRow={true}
          autoWrapCol={true}
          licenseKey="non-commercial-and-evaluation"
        />
      );
    }

    mountComponent(<ExampleComponent />);

    const parsedDataToArray = data.map(item => Object.values(item));
  
    expect((instance as any).getData()).toEqual(parsedDataToArray);
    expect((instance as any).getColHeader()).toEqual(["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]);
  });
});
