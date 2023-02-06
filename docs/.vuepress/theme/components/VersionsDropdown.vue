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
  computed: {
    item() {
      return {
        text: this.addLatest(this.$page.currentVersion),
        items:
          [
            ...(this.$page.versionsWithPatches ? Array.from(this.$page.versionsWithPatches.keys()).map(v => ({
              text: v,
              subTexts: this.$page.versionsWithPatches.get(v),
              link: this.getLink(v),
              target: '_self',
              isHtmlLink: true,
            })) : []),
          ]
      };
    }
  },
  methods: {
    addLatest(version) {
      const latestMinor = this.$page.latestVersion;

      if (version === latestMinor) {
        if (version !== 'next') {
          version = this.$page.versionsWithPatches.get(latestMinor)[0]; // Latest version in a format major.minor.patch
        }

        return `${version} (Latest)`;
      }

      return version;
    },
    getLink(version) {
      if (version === this.$page.currentVersion) {
        const isLatest = version === this.$page.latestVersion;

        return `/docs${isLatest ? '' : `/${version}`}${this.$route.path}`;
      }

      // Using `location.origin` disables injecting `.html` postfix at the end of the URL
      return `${location.origin}/docs/${version}/redirect?pageId=${this.$page.frontmatter.id}`;
    },
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
