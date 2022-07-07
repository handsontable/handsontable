<template>
  <img
    :src="parsedSrc"
    @focusout="focusoutAction" />
</template>

<script>
import { fetchDocsData } from '../theme/utils/remote-docs-data';

export default {
  name: 'Img',

  props: {
    src: {
      required: true
    },
  },

  data() {
    return {
      latestVersion: null,
    };
  },

  computed: {
    parsedSrc() {
      let src = this.src;

      if (this.$page.currentVersion === this.latestVersion) {
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

  async mounted() {
    const docsData = await fetchDocsData();

    this.latestVersion = docsData.latestVersion;
  }
};
</script>
