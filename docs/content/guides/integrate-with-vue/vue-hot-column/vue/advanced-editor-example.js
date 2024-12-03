import Vue from "vue";
import Vuex from "vuex";
import { HotTable, HotColumn, BaseEditorComponent } from "@handsontable/vue";
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';
import StarRating from "vue-star-rating";
import { Chrome } from "vue-color";

// ColorPicker.vue
const ColorPicker = {
  name: "ColorPicker",
  template: "#color-picker-template",
  extends: BaseEditorComponent,
  data() {
    return {
      hotInstance: null,
      TD: null,
      row: null,
      col: null,
      prop: null,
      value: "",
      cellProperties: null,
      isEditor: null,
      isRenderer: null,
      editorElement: null,
      cellProperties: null,
      isVisible: false,
      style: {
        position: "absolute",
        padding: "15px",
        background: "#fff",
        zIndex: 999,
        border: "1px solid #000",
        left: "0px",
        top: "0px",
      },
    };
  },
  methods: {
    stopMousedownPropagation(e) {
      e.stopPropagation();
    },
    prepare(row, col, prop, td, originalValue, cellProperties) {
      BaseEditorComponent.options.methods.prepare.call(
        this,
        row,
        col,
        prop,
        td,
        originalValue,
        cellProperties
      );

      const tdPosition = td.getBoundingClientRect();

      this.style.left = tdPosition.left + window.pageXOffset + "px";
      this.style.top = tdPosition.top + window.pageYOffset + "px";
    },
    updateColor(info) {
      this.setValue(info.hex);
    },
    applyColor() {
      if (this.col === 1) {
        this.$store.commit("setActiveStarColor", {
          row: this.row,
          newColor: this.getValue(),
        });
      } else if (this.col === 2) {
        this.$store.commit("setInactiveStarColor", {
          row: this.row,
          newColor: this.getValue(),
        });
      }
      this.finishEditing();
    },
    open() {
      this.isVisible = true;
    },
    close() {
      this.applyColor();
      this.isVisible = false;
    },
    setValue(value) {
      this.value = value;
    },
    getValue() {
      return this.value;
    },
  },
  components: {
    Chrome,
  },
};

// StarsRenderer.vue
const StarsRenderer = {
  name: "StarsRenderer",
  template: "#star-rating-template",
  extends: Vue,
  data() {
    return {
      hotInstance: null,
      row: null,
      col: null,
      value: 0,
    };
  },
  computed: {
    rating: {
      set: function (newValue) {
        this.value = parseInt(newValue, 10);
      },
      get: function () {
        return parseInt(this.value, 10);
      },
    },
  },
  methods: {
    saveRating(newRating) {
      this.hotInstance.setDataAtCell(this.row, this.col, newRating);
    },
  },
  components: {
    StarRating,
  },
};

Vue.use(Vuex);

const ExampleComponent = {
  data() {
    return {
      hotSettings: {
        data: [
          [1, "#2269EC", "#E1E7F3"],
          [2, "#A1E3CD", "#E5ECE4"],
          [3, "#A7DEA2", "#E4E8DA"],
          [4, "#ABE025", "#D4E1E6"],
          [5, "#018FC5", "#E8D3D7"],
          [5, "#FF1E49", "#D0D7E4"],
        ],
        fillHandle: false,
        copyPaste: false,
        licenseKey: "non-commercial-and-evaluation",
        rowHeaders: true,
        colHeaders: ["Rating", "Active star color", "Inactive star color"],
        autoRowSize: false,
        autoColumnSize: false,
        autoWrapRow: true,
        autoWrapCol: true,
        height: "auto",
      },
    };
  },
  created() {
    this.$store.commit("initStarColors", this.hotSettings.data);
  },
  store: new Vuex.Store({
    state: {
      activeColors: [],
      inactiveColors: [],
    },
    mutations: {
      initStarColors(state, hotData) {
        for (let i = 0; i < hotData.length; i++) {
          state.activeColors[i] = hotData[i][1];
          state.inactiveColors[i] = hotData[i][2];
        }
      },
      setActiveStarColor(state, payload) {
        Vue.set(state.activeColors, payload.row, payload.newColor);
      },
      setInactiveStarColor(state, payload) {
        Vue.set(state.inactiveColors, payload.row, payload.newColor);
      },
    },
  }),
  components: {
    HotTable,
    HotColumn,
    ColorPicker,
    StarsRenderer,
  },
};

export default ExampleComponent;
