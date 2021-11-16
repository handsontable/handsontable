<template>
  <div>
    <div
      v-if="isEditor && isVisible"
      id="colorPickerElement"
      :style="style"
      @mousedown="stopMousedownPropagation"
    >
      <chrome-picker :value="value" @input="updateColor"></chrome-picker>
      <button v-on:click="applyColor">Apply</button>
    </div>
    <div v-if="isRenderer">
      <div
        :style="{
          background: value,
          width: '21px',
          height: '21px',
          float: 'left',
          marginRight: '5px',
        }"
      ></div>
      <div>{{ value }}</div>
    </div>
  </div>
</template>

<script>
import { BaseEditorComponent } from "@handsontable/vue";
import { Chrome } from "vue-color";
import Component from "vue-class-component";

@Component({
  components: {
    "chrome-picker": Chrome,
  },
})
class ColorPicker extends BaseEditorComponent {
  hotInstance = null;
  TD = null;
  row = null;
  col = null;
  prop = null;
  value = "";
  cellProperties = null;
  isEditor = null;
  isRenderer = null;
  editorElement = null;
  isVisible = false;
  style = {
    position: "absolute",
    padding: "15px",
    background: "#fff",
    zIndex: 999,
    border: "1px solid #000",
    left: "0px",
    top: "0px",
  };

  stopMousedownPropagation(e) {
    e.stopPropagation();
  }

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
  }

  updateColor(info) {
    this.setValue(info.hex);
  }

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
  }

  open() {
    this.isVisible = true;
  }

  close() {
    this.applyColor();
    this.isVisible = false;
  }

  setValue(value) {
    this.value = value;
  }

  getValue() {
    return this.value;
  }
}

export default ColorPicker;
export { ColorPicker };
</script>

<style scoped>
.rating-renderer div {
  padding: 0;
}
</style>
