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
      let href = this.href;

      if (!this.isExternal && this.hideLatestVersion && this.$page.currentVersion === this.$page.latestVersion) {
        href = href.replace(this.$page.currentVersion + '/', '');
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
