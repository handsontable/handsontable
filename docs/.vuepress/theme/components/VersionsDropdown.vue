<template>
    <nav class="nav-versions nav-links" >
      <nav class="nav-item" >
        <DropdownLink :item="item"></DropdownLink>
      </nav>
  </nav>
</template>

<script>
import DropdownLink from '@theme/components/DropdownLink.vue';

export default {
  name: 'VersionsDropdown',
  components: {
    DropdownLink
  },
  data() {
    return {
      item: [],
    };
  },
  methods: {
    addLatest(version, showPatch) {
      const latestMinor = this.$page.latestVersion;

      if (version === latestMinor) {
        const patches = this.$page.versionsWithPatches.get(latestMinor);

        // It will show patches only when we have at least two versions for certain minor.
        if (showPatch === true && patches?.length > 1) {
          version = patches[0];
        }

        return `${version} (Latest)`;
      }

      return version;
    },
    getLink(version) {
      if (version === this.$page.latestVersion) {
        return '/docs/';
      }

      return `/docs/${version}/`;
    },
  },
  mounted() {
    this.item = {
      text: this.addLatest(this.$page.currentVersion, true),
      items:
        [
          ...Array.from(this.$page.versionsWithPatches.keys()).map(v => ({
            text: `${this.addLatest(v, false)}`,
            link: this.getLink(v),
            target: '_self',
            isHtmlLink: true,
            subitems: this.$page.versionsWithPatches.get(v),
          })),
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

  .dropdown-title, .mobile-dropdown-title
    text-transform capitalize

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
    background-color #fff
    padding 0.6rem 0
    border 1px solid #ddd
    border-bottom-color #ccc
    text-align left
    border-radius 6px
    white-space nowrap
    margin 0
    z-index 100
.dropdown-wrapper .dropdown-title .arrow, .dropdown-wrapper .mobile-dropdown-title .arrow
  margin-left 0.1rem

</style>
