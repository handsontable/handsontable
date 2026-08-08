import Handsontable from "handsontable";
import { HyperFormula } from "hyperformula";
import "handsontable/styles/handsontable.min.css";
import "handsontable/styles/ht-theme-main.min.css";
import "./styles.css";

const data = [
  ["", "Tesla", "Volvo", "Toyota", "Ford"],
  ["2019", 10, 11, 12, 13],
  ["2020", 20, 11, 14, 13],
  ["2021", 30, 15, 12, 13],
];

const container = document.getElementById("example");

const hot = new Handsontable(container, {
  data,
  width: "100%",
  height: "auto",
  rowHeaders: true,
  colHeaders: true,
  theme: "ht-theme-main",
  injectCoreCss: false,
  licenseKey: "non-commercial-and-evaluation",
  formulas: {
    engine: HyperFormula.buildEmpty({
      licenseKey: "internal-use-in-handsontable",
    }),
    sheetName: "Sheet1",
  },
});

console.log(`Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`);
