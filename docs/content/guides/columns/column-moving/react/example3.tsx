import { HotTable } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import "handsontable/dist/handsontable.full.min.css";

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        ["A1", "B1", "C1"],
        ["A2", "B2", "C2"],
        ["A3", "B3", "C3"],
      ]}
      colHeaders={["One", "Two", "Three"]}
      rowHeaders={true}
      manualColumnMove={true}
      autoWrapRow={true}
      autoWrapCol={true}
      height="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
