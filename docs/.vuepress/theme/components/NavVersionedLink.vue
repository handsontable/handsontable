<template>
  <RouterLink
    class="nav-link"
    :to="this.versionedLink"
    :exact="exact"
    @focusout.native="focusoutAction"
  >
    {{ item.text }}
  </RouterLink>
</template>

<script>
import { ensureExt } from '@vuepress/theme-default/util';

export default {
  name: 'NavLink',

  props: {
    item: {
      required: true
    }
  },
  watch: { $route() { } }, // force rerender on route changed
  computed: {
    link() {
      return ensureExt(this.item.link);
    },
    versionedLink() {
      if (this.$page.isThisTheLatestVersion) {
        return ensureExt(this.item.link);
      } else {
        return ensureExt(`/${this.$page.currentVersion}${this.item.link}`);
      }
    },
    exact() {
      if (this.link === '/' && this.$route.fullPath.match(/([^/]*\/)?(api|examples)\//)) {
        return true;
      }

      return false;
    },
  },

  methods: {
    focusoutAction() {
      this.$emit('focusout');
    },

  }
};
</script>
