import Handsontable from "handsontable";
import "handsontable/dist/handsontable.min.css";
import "pikaday/css/pikaday.css";

import { data } from "./constants";

import { addClassesToRows } from "./hooksCallbacks";

const example = document.getElementById("handsontable");
if (example) {
  const handsontable = new Handsontable(example, {
    preventWheel: true,
    data,
    height: 450,
    colWidths: [170, 156, 222, 130, 130, 120, 120],
    colHeaders: [
      "Company name",
      "Country",
      "Name",
      "Sell date",
      "Order ID",
      "In stock",
      "Qty",
    ],
    columns: [
      { data: 1, type: "text" },
      { data: 2, type: "text" },
      { data: 3, type: "text" },
      {
        data: 4,
        type: "date",
        allowInvalid: false,
      },
      { data: 5, type: "text" },
      {
        data: 6,
        type: "checkbox",
        className: "htCenter",
        headerClassName: "htCenter",
      },
      {
        data: 7,
        type: "numeric",
        headerClassName: "htRight",
      },
    ],
    dropdownMenu: true,
    hiddenColumns: {
      indicators: true,
    },
    contextMenu: true,
    multiColumnSorting: true,
    filters: true,
    rowHeaders: true,
    autoWrapCol: true,
    autoWrapRow: true,
    headerClassName: "htLeft",
    beforeRenderer: addClassesToRows,
    licenseKey: "non-commercial-and-evaluation",
  });

  console.log(handsontable);
}
