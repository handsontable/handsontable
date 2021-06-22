<template>
  <nav
    class="nav-links"
  >
    <!-- user links -->
    <div class="nav-item theme-switcher-nav-item">
      <ThemeSwitcher />
    </div>
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
import { resolveNavLinkItem } from './util';
import ThemeSwitcher from '@theme/components/ThemeSwitcher.vue';

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
