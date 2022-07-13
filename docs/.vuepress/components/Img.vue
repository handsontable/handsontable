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
      let src = this.src;

      if (this.$page.currentVersion === this.$page.latestVersion && this.$page.buildMode === 'production') {
        src = src.replace('/{docsVersion}/', '/');
      } else {
        src = src.replace('/{docsVersion}/', `/${this.$page.currentVersion}/`);
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
