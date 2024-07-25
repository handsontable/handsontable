import Handsontable from "handsontable";
import "handsontable/dist/handsontable.min.css";
import "@handsontable/pikaday/css/pikaday.css";

import { data } from "./constants";

import { addClassesToRows } from "./hooksCallbacks";

const example = document.getElementById("example1");
if (example) {
  new Handsontable(example, {
    data,
    height: 450,
    colWidths: [170, 222, 130, 120, 120, 130, 156],
    colHeaders: [
      "Company name",
      "Name",
      "Sell date",
      "In stock",
      "Qty",
      "Order ID",
      "Country",
    ],
    columns: [
      { data: 1, type: "text" },
      { data: 3, type: "text" },
      {
        data: 4,
        type: "date",
        allowInvalid: false,
      },
      {
        data: 6,
        type: "checkbox",
        className: "htCenter",
        headerClassName: "htCenter"
      },
      {
        data: 7,
        type: "numeric",
        headerClassName: "htRight"
      },
      { data: 5, type: "text" },
      { data: 2, type: "text" },
    ],
    autoWrapRow: true,
    dropdownMenu: true,
    hiddenColumns: {
      indicators: true,
    },
    contextMenu: true,
    multiColumnSorting: true,
    filters: true,
    rowHeaders: true,
    headerClassName: "htLeft",
    beforeRenderer: addClassesToRows,
    licenseKey: "non-commercial-and-evaluation",
  });


console.log(
  `Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`
);

} else {
  console.error("Element with ID 'example1' not found.");
}
