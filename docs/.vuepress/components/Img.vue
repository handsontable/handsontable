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
      const withBaseMatches = new RegExp(/\$withBase\('(.*)'\)/).exec(this.src);
      let src = this.src;

      if (withBaseMatches) {
        src = this.$withBase(withBaseMatches[1]);
      }

      return src;
    },
  },

  methods: {
    focusoutAction() {
      this.$emit('focusout');
    }
  },
};
</script>
