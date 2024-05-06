<template>
  <header class="navbar">
    <div class="navbar-wrapper">
      <RouterLink
          :to="frameworkUrlPrefix"
          class="home-link"
          aria-label="Docs Homepage Link"
      >
        <Logo />
      </RouterLink>

      <div class="top-bar">
        <div class="top-bar_left">
          <div class="framework-and-version">
            <FrameworksDropdown/>
            <!--<VersionsDropdown></VersionsDropdown>-->
          </div>
        </div>

        <AlgoliaSearch
          v-if="isAlgoliaSearch"
          :options="algolia"
        />

        <div class="menu">
          <NavLinks/>
          <ExternalNavLinks/>

          <nav class="icons-nav">
            <!--<ThemeSwitcher />-->
            <span class="news"><i class="ico i-bell"></i></span>
            <a href="https://github.com/handsontable/handsontable" class="github-stars" target="_blank">
              <i class="ico i-github"></i>
              <span v-if="stars">{{ stars }}</span>
            </a>
            <button class="menuButton" id="mobileSearch" aria-label="Search"><i class="ico i-search"></i></button>
            <button @click="$emit('toggle-sidebar')" class="menuButton" aria-label="Menu button">
              <i class="ico i-menu"></i>
              <i class="ico i-close"></i>
            </button>
          </nav>
        </div>
      </div>

    </div>
  </header>
</template>

<script>
/* global Headway */
import AlgoliaSearch from '@theme/components/AlgoliaSearch.vue';
import Logo from '@theme/components/Logo.vue';
import SidebarButton from '@theme/components/SidebarButton.vue';
import NavLinks from '@theme/components/NavLinks.vue';
// import VersionsDropdown from '@theme/components/VersionsDropdown.vue';
// import ThemeSwitcher from '@theme/components/ThemeSwitcher.vue';
import FrameworksDropdown from '@theme/components/FrameworksDropdown.vue';
import ExternalNavLinks from '@theme/components/ExternalNavLinks.vue';
import SidebarLinks from '@theme/components/SidebarLinks.vue';

export default {
  name: 'Navbar',
  components: {
    Logo,
    FrameworksDropdown,
    SidebarButton,
    NavLinks,
    AlgoliaSearch,
    // VersionsDropdown,
    // ThemeSwitcher,
    ExternalNavLinks,
    SidebarLinks
  },
  data() {
    return {
      linksWrapMaxWidth: null,
      stars: 0
    };
  },
  computed: {
    algolia() {
      return this.$themeLocaleConfig.algolia || this.$site.themeConfig.algolia || {};
    },
    isAlgoliaSearch() {
      return this.algolia && this.algolia.apiKey && this.algolia.indexName;
    },
    frameworkUrlPrefix() {
      return `/${this.$page.currentFramework}${this.$page.frameworkSuffix}/`;
    }
  },
  methods: {
    kFormatter(num) {
      return Math.abs(num) > 999
        ? `${Math.sign(num) * (Math.abs(num) / 1000).toFixed(1)}k`
        : Math.sign(num) * Math.abs(num);
    },
    async getStars() {
      try {
        const response = await fetch(
          'https://api.github.com/repos/handsontable/handsontable'
        );
        const data = await response.json();

        this.stars = this.kFormatter(data?.stargazers_count ?? 0);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log(error);
      }
    },
    handleSearchClick() {
      const btnAlgolia = document.querySelector('.DocSearch');

      if (btnAlgolia) {
        btnAlgolia.click();
      }
    },
  },
  mounted() {
    // Initialize Headway widget
    const config = {
      selector: '.news',
      account: 'xaD6ry'
    };

    Headway.init(config);
    this.getStars();

    // Add click event to #search
    const searchElement = document.getElementById('mobileSearch');

    if (searchElement) {
      searchElement.addEventListener('click', this.handleSearchClick);
    }
  }
};
</script>
