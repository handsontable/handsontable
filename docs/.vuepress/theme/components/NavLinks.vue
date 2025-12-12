<template>
  <nav class="nav-links">
    <!-- user links -->
    <div :class="{'nav-item': true, 'no-active': isChangelogLinkActive || isRecipesLinkActive}">
      <NavLink :item="guideLink"/>
    </div>
    <div class="nav-item">
      <NavLink :item="apiLink"/>
    </div>
    <div class="nav-item">
      <NavLink :item="recipesLink"/>
    </div>
    <div class="nav-item changelog">
      <NavLink :item="changelogLink"/>
    </div>
  </nav>
</template>

<script>
import NavLink from '@theme/components/NavLink.vue';

export default {
  name: 'NavLinks',

  components: {
    NavLink
  },
  computed: {
    frameworkUrlPrefix() {
      return `/${this.$page.currentFramework}${this.$page.frameworkSuffix}`;
    },
    guideLink() {
      return {
        link: `${this.frameworkUrlPrefix}/`,
        text: 'Guides'
      };
    },
    apiLink() {
      return {
        link: `${this.frameworkUrlPrefix}/api/`,
        text: 'API'
      };
    },
    recipesLink() {
      return {
        link: `${this.frameworkUrlPrefix}/recipes/`,
        text: 'Recipes'
      };
    },
    changelogLink() {
      return {
        link: `${this.frameworkUrlPrefix}/changelog/`,
        text: 'Changelog'
      };
    },
    isChangelogLinkActive() {
      return this.$route.path.includes('/changelog');
    },
    isRecipesLinkActive() {
      return this.$route.path.includes('/recipes');
    }
  }
};

</script>
