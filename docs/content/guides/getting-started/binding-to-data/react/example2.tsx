import React from "react";
import { HotTable } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import "handsontable/dist/handsontable.full.min.css";

// register Handsontable's modules
registerAllModules();

const data: Array<Array<string | number>> = [
  ["", "Tesla", "Nissan", "Toyota", "Honda", "Mazda", "Ford"],
  ["2017", 10, 11, 12, 13, 15, 16],
  ["2018", 10, 11, 12, 13, 15, 16],
  ["2019", 10, 11, 12, 13, 15, 16],
  ["2020", 10, 11, 12, 13, 15, 16],
  ["2021", 10, 11, 12, 13, 15, 16],
];

const ExampleComponent: React.FC = () => (
  <HotTable
    data={data}
    colHeaders={true}
    minSpareRows={1}
    height="auto"
    width="auto"
    columns={[
      { data: 0 },
      // skip the second column
      { data: 2 },
      { data: 3 },
      { data: 4 },
      { data: 5 },
      { data: 6 },
    ]}
    autoWrapRow={true}
    autoWrapCol={true}
    licenseKey="non-commercial-and-evaluation"
  />
);

export default ExampleComponent;
