import { Component, ViewEncapsulation } from "@angular/core";
import { getData } from "./utils/data";

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: "data-grid",
  templateUrl: "./data-grid.component.html",
  styleUrls: ["./data-grid.scss"],
})
export class DataGridComponent {
  dataset = getData();
   colHeaders = [
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
  ];
  hiddenColumns = {
    columns: [0, 2], 
    indicators: true,
  };
  licenseKey = "non-commercial-and-evaluation";
}
