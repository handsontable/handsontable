import Handsontable from "handsontable/base";
import { registerAllModules } from "handsontable/registry";
registerAllModules();
const CATEGORY_COL = 0;
const SUBCATEGORY_COL = 1;
/** Parent value -> allowed child dropdown labels */
const dependencyMap = {
    Fruit: ["Apple", "Banana", "Orange"],
    Vegetable: ["Carrot", "Pea", "Broccoli"],
    Grain: ["Rice", "Wheat", "Oats"],
};
function optionsForCategory(category) {
    return dependencyMap[category] ?? [];
}
/* start:skip-in-preview */
const data = [
    ["Fruit", "Apple"],
    ["Vegetable", "Carrot"],
    ["Grain", ""],
];
/* end:skip-in-preview */
const container = document.querySelector("#example1");
// eslint-disable-next-line no-unused-vars -- instance kept for recipe preview
const hot = new Handsontable(container, {
    data,
    colHeaders: ["Category", "Subcategory"],
    columns: [
        { type: "dropdown", source: Object.keys(dependencyMap) },
        { type: "dropdown", source: optionsForCategory(String(data[0][CATEGORY_COL])) },
    ],
    rowHeaders: true,
    height: 200,
    width: "100%",
    licenseKey: "non-commercial-and-evaluation",
    afterInit() {
        for (let row = 0; row < this.countRows(); row++) {
            const category = String(this.getDataAtCell(row, CATEGORY_COL) ?? "");
            this.setCellMeta(row, SUBCATEGORY_COL, "source", optionsForCategory(category));
        }
        this.render();
    },
    afterChange(changes, source) {
        if (source === "loadData" || !changes) {
            return;
        }
        for (const change of changes) {
            const [row, prop, oldVal, newVal] = change;
            if (prop !== CATEGORY_COL || oldVal === newVal) {
                continue;
            }
            const next = optionsForCategory(String(newVal));
            this.setCellMeta(row, SUBCATEGORY_COL, "source", next);
            this.setDataAtCell(row, SUBCATEGORY_COL, next[0] ?? "");
        }
        this.render();
    },
});
