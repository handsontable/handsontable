<template>
  <nav
    class="nav-links"
  >
    <!-- user links -->
    <div class="nav-item">
      <NavVersionedLink :item="guideLink"/>
    </div>
    <div class="nav-item">
      <NavVersionedLink :item="examplesLink"/>
    </div>
    <div class="nav-item">
      <NavVersionedLink :item="apiLink"/>
    </div>
    <div
      v-for="item in userLinks"
      :key="item.link"
      class="nav-item"
    >
      <DropdownLink
        v-if="item.type === 'links'"
        :item="item"
      />
      <NavLink
        v-else
        :item="item"
      />
    </div>
  </nav>
</template>

<script>
import DropdownLink from '@theme/components/DropdownLink.vue';
import NavLink from '@theme/components/NavLink.vue';
import NavVersionedLink from '@theme/components/NavVersionedLink.vue';
import ThemeSwitcher from '@theme/components/ThemeSwitcher.vue';
import { resolveNavLinkItem } from './util';

export default {
  name: 'NavLinks',

  components: {
    NavLink,
    DropdownLink,
    NavVersionedLink,
    ThemeSwitcher
  },
  computed: {
    guideLink() {
      return {
        link: '/',
        text: 'Guides'
      };
    },
    examplesLink() {
      return {
        link: '/examples/',
        text: 'Examples'
      };
    },
    apiLink() {
      return {
        link: '/api/',
        text: 'API Reference'
      };
    },
    userNav() {
      return this.$themeLocaleConfig.nav || this.$site.themeConfig.nav || [];
    },

    nav() {
      const { locales } = this.$site;

      if (locales && Object.keys(locales).length > 1) {
        const currentLink = this.$page.path;
        const routes = this.$router.options.routes;
        const themeLocales = this.$site.themeConfig.locales || {};
        const languageDropdown = {
          text: this.$themeLocaleConfig.selectText || 'Languages',
          ariaLabel: this.$themeLocaleConfig.ariaLabel || 'Select language',
          items: Object.keys(locales).map((path) => {
            const locale = locales[path];
            const text = themeLocales[path] && themeLocales[path].label || locale.lang;
            let link;

            // Stay on the current page
            if (locale.lang === this.$lang) {
              link = currentLink;
            } else {
              // Try to stay on the same page
              link = currentLink.replace(this.$localeConfig.path, path);

              // fallback to homepage
              if (!routes.some(route => route.path === link)) {
                link = path;
              }
            }

            return { text, link };
          })
        };

        return [...this.userNav, languageDropdown];
      }

      return this.userNav;
    },

    userLinks() {
      return (this.nav || []).map((link) => {
        return Object.assign(resolveNavLinkItem(link), {
          items: (link.items || []).map(resolveNavLinkItem)
        });
      });
    },

  }
};
</script>

<style lang="stylus">
.nav-links
  display inline-block
  a
    line-height 1.4rem
    color inherit
    &:hover, &.router-link-active
      color $accentColor
  .nav-item
    position relative
    display inline-block
    margin-left 1.5rem
    line-height 2rem
    &:first-child
      margin-left 0
  .repo-link
    margin-left 1.5rem

@media (max-width: $MQMobile)
  .nav-links
    .nav-item, .repo-link
      margin-left 0

@media (min-width: $MQMobile)
  .nav-links a
    &:hover, &.router-link-active
      color $textColor
  .nav-item > a
    &.external > span
      display none
    &.router-link-active
      margin-bottom -2px
      border-bottom 2px solid lighten($accentColor, 8%)

</style>
