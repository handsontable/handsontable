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
<<<<<<< HEAD
      const link = this.item.link;

      const framework = this.$page.currentFramework ?
        `/${this.$page.currentFramework}${this.$page.frameworkSuffix}` : '';

      // Already have version and framework placed in the url for some reason and a `RouterLink` process it properly.
      if (this.$page.DOCS_VERSION && (this.$page.DOCS_FRAMEWORK || this.$page.isFrameworked === false)) {
        return ensureExt(link);

      } else if (this.$page.currentVersion === this.$page.latestVersion) {
        return ensureExt(`${framework}${link}`);

=======
      if (this.$page.currentVersion === this.$page.latestVersion) {
        return ensureExt(this.item.link);
>>>>>>> develop
      } else {
        return ensureExt(`/${this.$page.currentVersion}${framework}${link}`);
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
