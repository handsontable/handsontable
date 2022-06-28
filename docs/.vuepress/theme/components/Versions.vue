<template>
    <nav class="nav-versions nav-links" >
      <!-- user links -->
      <nav class="nav-item" >
        <DropdownLink :item="item"></DropdownLink>
      </nav>
  </nav>
</template>

<script>
import DropdownLink from '@theme/components/DropdownLink.vue';
import { fetchDocsData } from '../utils/remoteDocsData';

export default {
  name: 'Versions',
  components: {
    DropdownLink
  },
  data() {
    return {
      item: [],
      latestVersion: null,
    };
  },
  methods: {
    addLatest(version) {
      if (version === this.latestVersion) {
        return `${version} (Current)`;
      }

      return version;
    },
    getLink(version) {
      if (version === this.latestVersion) {
        return '/docs/';
      }

      return `/docs/${version}/`;
    },
    getLegacyVersions() {
      return [
        '8.4.0',
        '8.3.2',
        '8.2.0',
        '8.1.0',
        '8.0.0',
        '7.4.2',
        '7.3.0',
        '7.2.2',
        '7.1.1',
        '7.0.3',
        '6.2.2',
        '6.1.1',
        '6.0.1',
        '5.0.2',
        '4.0.0',
      ].map(version => ({
        text: version.replace(/\.\d+$/, ''),
        link: `${this.$page.baseUrl}/docs/${version}/`
      }));
    }
  },
  async mounted() {
    const docsData = await fetchDocsData({
      buildMode: this.$page.buildMode,
      currentVersion: this.$page.currentVersion,
    });

    this.latestVersion = docsData.latestVersion;
    this.item = {
      text: this.addLatest(this.$page.currentVersion),
      items:
        [
          ...docsData.versions.map(v => ({
            text: `${this.addLatest(v)}`,
            link: this.getLink(v),
            target: '_self',
            isHtmlLink: true
          })),
          ...this.getLegacyVersions()
        ]
    };
  }
};
</script>

<style lang="stylus">
.nav-versions
  margin-right 1.5rem
  display inline-block
  position relative
  top -1px
  text-transform capitalize

  .dropdown-title {
    text-transform capitalize
  }

  .icon.outbound
    display none

  .dropdown-wrapper
    height 1.8rem

  .dropdown-wrapper .nav-dropdown
    min-width 150px
    height auto !important
    box-sizing border-box
    max-height calc(100vh - 2.7rem)
    overflow-y auto
    position absolute
    top 100%
    left 0
    background-color #fff
    padding 0.6rem 0
    border 1px solid #ddd
    border-bottom-color #ccc
    text-align left
    border-radius 0.25rem
    white-space nowrap
    margin 0
.dropdown-wrapper .dropdown-title .arrow, .dropdown-wrapper .mobile-dropdown-title .arrow
  margin-left 0.1rem

</style>
