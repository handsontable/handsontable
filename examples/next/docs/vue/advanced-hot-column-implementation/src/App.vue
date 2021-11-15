<template>
  <div id="advanced-editor-example" class="hot">
    <hot-table :settings="hotSettings">
      <hot-column :width="150">
        <stars-rating hot-renderer></stars-rating>
      </hot-column>
      <hot-column v-for="n in 2" :width="150" v-bind:key="'col' + n">
        <color-picker hot-editor hot-renderer></color-picker>
      </hot-column>
    </hot-table>
  </div>
</template>
<script>
import Vue from "vue";
import Vuex from "vuex";
import { HotTable, HotColumn } from "@handsontable/vue";
import ColorPicker from "./components/ColorPicker.vue";
import StarsRating from "./components/StarsRating.vue";

Vue.use(Vuex);

export default Vue.extend({
  data: function() {
    return {
      hotSettings: {
        data: [
          [1, "#2269EC", "#E1E7F3"],
          [2, "#A1E3CD", "#E5ECE4"],
          [3, "#A7DEA2", "#E4E8DA"],
          [4, "#ABE025", "#D4E1E6"],
          [5, "#018FC5", "#E8D3D7"],
          [5, "#FF1E49", "#D0D7E4"]
        ],
        fillHandle: false,
        copyPaste: false,
        licenseKey: "non-commercial-and-evaluation",
        rowHeaders: true,
        colHeaders: ["Rating", "Active star color", "Inactive star color"],
        autoRowSize: false,
        autoColumnSize: false
      }
    };
  },
  created: function() {
    this.$store.commit("initStarColors", this.hotSettings.data);
  },
  methods: {},
  store: new Vuex.Store({
    state: {
      activeColors: [],
      inactiveColors: []
    },
    mutations: {
      initStarColors(state, hotData) {
        for (var i = 0; i < hotData.length; i++) {
          state.activeColors[i] = hotData[i][1];
          state.inactiveColors[i] = hotData[i][2];
        }
      },
      setActiveStarColor(state, payload) {
        Vue.set(state.activeColors, payload.row, payload.newColor);
      },
      setInactiveStarColor(state, payload) {
        Vue.set(state.inactiveColors, payload.row, payload.newColor);
      }
    }
  }),
  components: {
    HotTable,
    HotColumn,
    ColorPicker,
    StarsRating
  }
});
</script>

<style>
button {
  width: 100%;
  height: 33px;
  margin-top: 10px;
}

.vc-chrome {
  box-shadow: none;
}
</style>
