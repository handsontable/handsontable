<template>
  <img
    :src="versionedSrc"
    :class="className"
    :alt="alt"
  />
</template>

<script>
import { getLinkTransformed } from './utils';

export default {
  name: 'ImageVersioned',
  props: {
    src: {
      required: true
    },
    className: {
      required: false
    },
    alt: {
      required: false
    },
  },

  computed: {
    versionedSrc() {
      const currentVersion = this.$page.currentVersion;
      const frameworkDir = `${this.$page.currentFramework}${this.$page.frameworkSuffix}`;

      let src = this.src;

      if (this.$page.currentFramework !== void 0) {
        src = src.replace(currentVersion, `${currentVersion}/${frameworkDir}`);
      }

      return getLinkTransformed(src, currentVersion, this.$page.latestVersion);
    },
  },
};
</script>
