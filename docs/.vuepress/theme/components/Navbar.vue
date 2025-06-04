
<template>
  <header class="navbar">
    <!-- jsnation 2025 -->
    <aside class="jsnation2025" id="jsnation2025">
      <div class="navbar-wrapper">
      <div class="jsnation2025__icon">
        <img src="data:image/png;base64,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" alt="JSNation 2025" />

      </div>
      <div class="jsnation2025__content">
        <h5>JSNation Amsterdam 2025</h5>
        <h6>Let's meet at Circa on June 12<span class="no-mobile"> - drop by our booth to discover our latest grid innovation</span>
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
      .jsnation2025__icon img { width: 100%; height: 100%; object-fit: contain; border-radius: 8px; }
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
      .theme-dark aside.jsnation2025 h6 a { color: #27C2FF }
      /* Layout fix */
      .page { margin-top: calc(56px + 80px);}
      .page .theme-default-content .table-of-contents { top: calc(56px + 80px);}

      /* Dark mode link fix */
      html.theme-dark aside.jsnation2025 h6 a { color: var(--color-lightblue); }

      /* Content align to header */
      aside.jsnation2025 .navbar-wrapper { padding: 0 48px; }
      @media (max-width: 1480px) {
        aside.jsnation2025 .navbar-wrapper {
          padding: 0 24px;}
      }
      @media (max-width: 992px) {
        /* no-mobile */
        .no-mobile { display:none }
          aside.jsnation2025 .navbar-wrapper {
          padding: 0 16px}
      }

      /* Typo */
      aside.jsnation2025 h5 { line-height: 20px}

      /* Flex Fix */
      .jsnation2025__icon { min-widht:40px}

      
      
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
