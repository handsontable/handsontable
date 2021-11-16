<template>
  <div class="rating-renderer">
    <star-rating
      v-on:rating-selected="saveRating"
      :rating="rating"
      :star-size="15"
      :show-rating="false"
      :active-color="this.$store.state.activeColors[this.row]"
      :inactive-color="this.$store.state.inactiveColors[this.row]"
    ></star-rating>
  </div>
</template>

<script>
import Vue from "vue";
import StarRating from "vue-star-rating";
import Component from "vue-class-component";

@Component({
  components: {
    StarRating,
  },
})
class StarsRenderer extends Vue {
  hotInstance = null;
  row = null;
  col = null;
  value = 0;

  get rating() {
    return parseInt(this.value, 10);
  }

  set rating(newValue) {
    this.value = parseInt(newValue, 10);
  }

  saveRating(newRating) {
    this.hotInstance.setDataAtCell(this.row, this.col, newRating);
  }
}

export default StarsRenderer;
export { StarsRenderer };
</script>

<style scoped>
.rating-renderer div {
  padding: 0;
}
</style>
