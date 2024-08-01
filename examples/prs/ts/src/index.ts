import Handsontable from "handsontable/base";
import "handsontable/dist/handsontable.full.min.css";
import { registerAllModules } from "handsontable/registry";

// Register all available Handsontable modules
registerAllModules();

import {data} from "./data";

const container = document.querySelector("#handsontable-grid");

if (!container) {
  throw new Error("No container element found");
}
new Handsontable(container, {
  data: data,
  colHeaders: [
    "ID",
    "Item Name",
    "Item No.",
    "Lead Engineer",
    "Cost",
    "In Stock",
    "Category",
    "Item Quality",
    "Origin",
    "Quantity",
    "Value Stock",
    "Repairable",
    "Supplier Name",
    "Restock Date",
    "Operational Status",
  ],
  rowHeaders: true,
  height: 340,
  width: 800,
  autoWrapRow: true,
  autoWrapCol: true,
  dropdownMenu: true,
  filters: true,
  multiColumnSorting: true,
  hiddenColumns: {
    columns: [0, 2], // Hides the ID and Item No. columns
    indicators: true,
  },
  columns: [
    { data: "id", type: "numeric", width: 150 },
    {
      data: "itemName",
      type: "text",
      headerClassName: "htLeft",
      className: "htLeft",
      width: 150,
    },
    {
      data: "itemNo",
      type: "text",
      headerClassName: "htLeft",
      className: "htLeft",
      width: 150,
    }, // Hidden column
    {
      data: "leadEngineer",
      type: "text",
      headerClassName: "htLeft",
      className: "htLeft",
      width: 150,
    },
    {
      data: "cost",
      type: "numeric",
      numericFormat: { pattern: "$0 0" },
      headerClassName: "htRight",
      className: "htRight",
      width: 150,
    },
    {
      data: "inStock",
      type: "checkbox",
      headerClassName: "htCenter",
      className: "htCenter",
      width: 100,
    },
    {
      data: "category",
      type: "text",
      headerClassName: "htLeft",
      className: "htLeft",
      width: 150,
    },
    {
      data: "itemQuality",
      type: "numeric",
      numericFormat: { pattern: "0%" },
      headerClassName: "htRight",
      className: "htRight",
      width: 150,
    },
    {
      data: "origin",
      type: "text",
      headerClassName: "htLeft",
      className: "htLeft",
      width: 150,
    },
    {
      data: "quantity",
      type: "numeric",
      headerClassName: "htRight",
      className: "htRight",
      width: 150,
    },
    {
      data: "valueStock",
      type: "numeric",
      numericFormat: { pattern: "$0 0" },
      headerClassName: "htRight",
      className: "htRight",
      width: 150,
    },
    {
      data: "repairable",
      type: "checkbox",
      headerClassName: "htCenter",
      className: "htCenter",
      width: 100,
    },
    {
      data: "supplierName",
      type: "text",
      headerClassName: "htLeft",
      className: "htLeft",
      width: 150,
    },
    {
      data: "restockDate",
      type: "date",
      dateFormat: "YYYY-MM-DD",
      headerClassName: "htRight",
      className: "htRight",
      width: 150,
    },
    {
      data: "operationalStatus",
      type: "text",
      headerClassName: "htLeft",
      className: "htLeft",
      width: 180,
    },
  ],
  licenseKey: "non-commercial-and-evaluation",
});
