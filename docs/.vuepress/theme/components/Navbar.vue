<!-- /* eslint-disable */ -->

<!-- eslint-disable -->
<template>
  <header class="navbar">
    <!-- jsnation 2025 -->
    <aside class="jsnation2025" id="jsnation2025">
      <div class="navbar-wrapper">
      <div class="jsnation2025__icon">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clip-path="url(#clip0_1113_25468)">
          <path d="M6.66797 3.33333C6.66797 2.97971 6.80844 2.64057 7.05849 2.39052C7.30854 2.14048 7.64768 2 8.0013 2C8.35492 2 8.69406 2.14048 8.94411 2.39052C9.19416 2.64057 9.33464 2.97971 9.33464 3.33333C10.1002 3.69535 10.7529 4.25888 11.2227 4.96353C11.6924 5.66818 11.9616 6.48738 12.0013 7.33333V9.33333C12.0515 9.7478 12.1983 10.1447 12.4298 10.4921C12.6614 10.8395 12.9713 11.1276 13.3346 11.3333H2.66797C3.03126 11.1276 3.34117 10.8395 3.57276 10.4921C3.80435 10.1447 3.95113 9.7478 4.0013 9.33333V7.33333C4.04101 6.48738 4.31017 5.66818 4.77994 4.96353C5.2497 4.25888 5.90236 3.69535 6.66797 3.33333Z" stroke="#1A42E8" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M6 11.3333V11.9999C6 12.5304 6.21071 13.0391 6.58579 13.4141C6.96086 13.7892 7.46957 13.9999 8 13.9999C8.53043 13.9999 9.03914 13.7892 9.41421 13.4141C9.78929 13.0391 10 12.5304 10 11.9999V11.3333" stroke="#1A42E8" stroke-linecap="round" stroke-linejoin="round"/>
          </g>
          <defs>
          <clipPath id="clip0_1113_25468">
          <rect width="16" height="16" fill="white"/>
          </clipPath>
          </defs>
        </svg>

      </div>
      <div class="jsnation2025__content">
        <h5>JSNation Amsterdam 2025</h5>
        <h6>Let’s meet at Circa on June 12 - drop by our booth to discover our latest grid innovation
          <a href="https://handsontable.com/blog/handsontable-at-jsnation-2025-lets-connect">Learn more</a>
        </h6>
      </div>
      <button class="jsnation2025__close" v-on:click="this.hideJSNation2025">
        <i class="ico i-close"></i>
        </button>
      </div>
      <style>
      .sidebar.with-jsnation2025 { top: calc(72px + 56px)}
      aside.jsnation2025 { padding: 8px;	display: none;	flex-direction: row;	flex-wrap: nowrap;	justify-content: flex-start;	align-items: center;	align-content: center; background: #E0E0E3; }
      .jsnation2025__icon { width: 40px; height: 40px; display: flex; justify-content: center; align-items: center; background: #F7F7F9; border-radius: 8px; margin-right: 12px; }
      aside.jsnation2025 h5 { font-size: 12px; font-weight: normal; color: #000; }
      aside.jsnation2025 h6 { font-size: 10px; font-weight: normal; color: #343436; }
      aside.jsnation2025 h6 a { color: #1A42E8; text-decoration: none; display: inline-block; margin-left:8px; }
      aside.jsnation2025 h6 a:hover { text-decoration: underline; }
      aside.jsnation2025 .navbar-wrapper { padding: 0; height: auto; justify-content: flex-start;	align-items: center;	align-content: center; width: 100%; }
      .jsnation2025__close { margin-left: auto; border:none; background: transparent; cursor: pointer; }
      .jsnation2025__close:hover { opacity: 0.5; }

      .theme-dark aside.jsnation2025 { background: #222326; }
      .theme-dark .jsnation2025__icon { background: #121212; stroke: #27C2FF; }
      .theme-dark .jsnation2025__icon path { stroke: #27C2FF; }
      .theme-dark aside.jsnation2025 h5 { color: #FFFFFF; }
      .theme-dark aside.jsnation2025 h6 { color: #D1D1D2; }
      </style>
    </aside>
    <!-- jsnation 2025 -->

    <div class="navbar-wrapper">
      <a
        href="/"
        class="home-link"
        aria-label="Handsontable Main Page"
      >
        <Logo />
    </a>

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
            <span class="news"><i class="ico i-bell"></i></span>
            <ThemeSwitcher />
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
import ThemeSwitcher from '@theme/components/ThemeSwitcher.vue';
import FrameworksDropdown from '@theme/components/FrameworksDropdown.vue';
import ExternalNavLinks from '@theme/components/ExternalNavLinks.vue';
import SidebarLinks from '@theme/components/SidebarLinks.vue';
import { doc } from 'prettier';

export default {
  name: 'Navbar',
  components: {
    Logo,
    FrameworksDropdown,
    SidebarButton,
    NavLinks,
    AlgoliaSearch,
    // VersionsDropdown,
    ThemeSwitcher,
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
    hideJSNation2025() {
      console.log('Hiding JSNation 2025 banner');
      localStorage.setItem('hideJSNation2025', true);
      document.getElementById('jsnation2025').style.display = 'none';
      document.querySelector('aside.sidebar').classList.remove('with-jsnation2025');
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

    const dateNow = new Date();
    const dateJSEvent = new Date('2025-06-13');

    const showJSNation2025 = !localStorage.getItem('hideJSNation2025') || dateNow > dateJSEvent;

    if (showJSNation2025) {
      document.getElementById('jsnation2025').style.display = 'flex';
      document.querySelector('aside.sidebar').classList.add('with-jsnation2025');
    }

  }
};
</script>
