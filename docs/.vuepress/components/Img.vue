<template>
  <img
    :src="parsedSrc"
    @focusout="focusoutAction" />
</template>

<script>
export default {
  name: 'Img',

  props: {
    src: {
      required: true
    },
  },

  computed: {
    parsedSrc() {
      return this.$withBase(this.src);
    },
  },

  methods: {
    focusoutAction() {
      this.$emit('focusout');
    }
  },
};
</script>
