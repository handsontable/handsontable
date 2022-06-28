<template>
  <a
    :href="parsedHref"
    :target="target"
    :rel="rel"
    @focusout="focusoutAction"
  >
    <slot></slot>
  </a>
</template>

<script>
import { isExternal } from '@vuepress/theme-default/util';
import NavLink from '@theme/components/NavLink.vue';
import { fetchDocsData } from '../theme/utils/remoteDocsData';

export default {
  name: 'Link',

  components: {
    NavLink,
  },
  props: {
    href: {
      required: true
    },
    target: {
      required: false
    },
    rel: {
      required: false
    },
    hideLatestVersion: {
      type: Boolean,
      required: false
    }
  },

  data() {
    return {
      latestVersion: null,
    };
  },

  computed: {
    parsedHref() {
      let href = this.href;

      if (!this.isExternal && this.hideLatestVersion && this.$page.currentVersion === this.latestVersion) {
        href = href.replace(`${this.$page.currentVersion}/`, '');
      }

      return href;
    },

    isExternal() {
      return isExternal(this.href);
    },
  },

  methods: {
    focusoutAction() {
      this.$emit('focusout');
    }
  },

  async mounted() {
    const docsData = await fetchDocsData({
      buildMode: this.$page.buildMode,
      currentVersion: this.$page.currentVersion,
    });

    this.latestVersion = docsData.latestVersion;
  }
};
</script>
