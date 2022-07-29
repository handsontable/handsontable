<template>
  <nav class="nav-frameworks nav-links">
    <img :src="imageUrl"/>
    <!-- user links -->
    <nav class="nav-item" >
      <DropdownLink :item="item"></DropdownLink>
    </nav>
  </nav>
</template>

<script>
import DropdownLink from '@theme/components/DropdownLink.vue';
import { getLinkTransformed } from '../../components/utils';

const frameworkIdToFullName = new Map([
  ['javascript', 'JavaScript'],
  ['react', 'React'],
]);

export default {
  name: 'FrameworksDropdown',
  components: {
    DropdownLink
  },
  methods: {
    getLink(framework) {
      if (this.$page.currentVersion === this.$page.latestVersion) {
        return `/docs/${framework}${this.$page.frameworkSuffix}/`;
      }

      return `/docs/${this.$page.currentVersion}/${framework}${this.$page.frameworkSuffix}/`;
    },
    getFrameworkName(id) {
      return frameworkIdToFullName.get(id);
    },
    getFrameworkItems() {
      return Array.from(frameworkIdToFullName.entries()).map(([id, fullName]) => {
        return {
          text: fullName,
          link: this.getLink(id),
          target: '_self',
          isHtmlLink: true
        };
      });
    }
  },
  computed: {
    imageUrl() {
      const currentVersion = this.$page.currentVersion;
      const frameworkWithoutNumber = this.$page.currentFramework.replace(/\d+$/, '');
      const src = this.$withBase(`/img/pages/introduction/${frameworkWithoutNumber}.svg`);

      return getLinkTransformed(src, currentVersion, this.$page.latestVersion);
    },
    item() {
      return {
        text: this.getFrameworkName(this.$page.currentFramework),
        items: this.getFrameworkItems(),
      };
    }
  }
};
</script>

<style lang="stylus">
.nav-frameworks
  margin-left 1.25rem
  margin-right 1.5rem
  display inline-block
  position relative
  top -1px
  text-transform capitalize

  img
    height: 12px

  .nav-item
    margin-left: 0.25rem

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
