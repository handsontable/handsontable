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

  computed: {
    parsedHref() {
      const currentVersion = this.$page.currentVersion;
      const frameworkDir = `${this.$page.currentFramework}${this.$page.frameworkSuffix}`;
      let href = this.href;

      if (this.$page.currentFramework !== void 0) {
        href = href.replace(currentVersion, `${currentVersion}/${frameworkDir}`);
      }

      if (!this.isExternal && this.hideLatestVersion && currentVersion === this.$page.latestVersion) {
        href = href.replace(`${currentVersion}/`, '');
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
  }
};
</script>
