import Handsontable from "handsontable/base";
import { registerAllModules } from "handsontable/registry";
registerAllModules();
const STATUS_ROW_CLASSES = {
    active: "ht-demo-row-status-active",
    pending: "ht-demo-row-status-pending",
    inactive: "ht-demo-row-status-inactive",
};
function statusToRowClass(status) {
    if (typeof status !== "string") {
        return undefined;
    }
    return STATUS_ROW_CLASSES[status];
}
/* start:skip-in-preview */
const data = [
    { task: "Invoice export", owner: "A. Lee", status: "active" },
    { task: "SSO rollout", owner: "M. Costa", status: "pending" },
    { task: "Legacy reports", owner: "J. Park", status: "inactive" },
    { task: "API docs", owner: "R. Singh", status: "active" },
    { task: "Mobile parity", owner: "T. Nguyen", status: "pending" },
];
/* end:skip-in-preview */
const container = document.querySelector("#example1");
const hotOptions = {
    data,
    licenseKey: "non-commercial-and-evaluation",
    rowHeaders: true,
    colHeaders: ["Task", "Owner", "Status"],
    height: "auto",
    width: "100%",
    columns: [
        { data: "task", type: "text", width: 220 },
        { data: "owner", type: "text", width: 120 },
        {
            data: "status",
            type: "dropdown",
            width: 120,
            source: ["active", "pending", "inactive"],
            strict: true,
            allowInvalid: false,
        },
    ],
    cells(row, _column, _prop) {
        const hot = this.instance;
        const visualRow = hot.toVisualRow(row);
        if (visualRow === null || visualRow < 0) {
            return {};
        }
        const status = hot.getDataAtRowProp(visualRow, "status");
        const rowClass = statusToRowClass(status);
        if (!rowClass) {
            return {};
        }
        return { className: rowClass };
    },
    afterValidate(isValid, _value, row, prop) {
        if (isValid) {
            return;
        }
        const col = this.propToCol(prop);
        const td = this.getCell(row, col);
        if (!td) {
            return;
        }
        td.classList.add("ht-demo-invalid-flash");
        setTimeout(() => td.classList.remove("ht-demo-invalid-flash"), 800);
    },
};
// eslint-disable-next-line no-unused-vars
const hot = new Handsontable(container, hotOptions);
