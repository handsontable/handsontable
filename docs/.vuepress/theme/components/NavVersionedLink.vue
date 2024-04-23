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

export default {
  name: 'NavLink',

  props: {
    item: {
      required: true
    }
  },
  watch: { $route() { } }, // force rerender on route changed
  computed: {
    /*
    link() {
      return ensureExt(this.item.link);
    },
    versionedLink() {
      const link = this.item.link;
      const framework = `/${this.$page.currentFramework}${this.$page.frameworkSuffix}`;

      if (this.$page.currentVersion === this.$page.latestVersion) {
        return ensureExt(link);

      } else {
        return ensureExt(`/${this.$page.currentVersion}${framework}${link}`);
      }
    },
    */
    exact() {
      if (this.link === '/' && this.$route.fullPath.match(/([^/]*\/)?(api)\//)) {
        return true;
      }

      return false;
    },
  },

  methods: {
    focusoutAction() {
      this.$emit('focusout');
    }
  }
};
</script>
