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
      const frameworkDir = `${this.$page.currentFramework}${this.$page.frameworkSuffix}`;
      let src = this.src;

      if (this.$page.currentVersion === this.$page.latestVersion && this.$page.buildMode === 'production') {
        src = src.replace('/{docsVersion}/', `/${frameworkDir}/`);
      } else {
        src = src.replace('/{docsVersion}/', `/${this.$page.currentVersion}/${frameworkDir}/`);
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
