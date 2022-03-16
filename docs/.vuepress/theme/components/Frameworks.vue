<template>
  <nav class="nav-versions nav-links" >
    <img :src="imageUrl"/>
    <!-- user links -->
    <nav class="nav-item" >
      <DropdownLink :item="item"></DropdownLink>
    </nav>
  </nav>
</template>

<script>
import DropdownLink from '@theme/components/DropdownLink.vue';

export default {
  name: 'Frameworks',
  components: {
    DropdownLink
  },
  methods: {
    getLink(framework) {
      if (this.$page.currentVersion === this.$page.latestVersion) {
        return `/docs/${framework}-data-grid/`;
      }

      return `/docs/${this.$page.currentVersion}/${framework}-data-grid/`;
    },
  },
  computed: {
    imageUrl() {
      return `/docs/${this.$page.currentVersion}/img/pages/introduction/${this.$page.framework}.svg`;
    },
    item() {
      return {
        text: 'JavaScript',
        items:
          [
            {
              text: 'JavaScript',
              link: this.getLink('javascript'),
              target: '_self',
              isHtmlLink: true
            },
            {
              text: 'React',
              link: this.getLink('react'),
              target: '_self',
              isHtmlLink: true
            },
            {
              text: 'Angular',
              link: this.getLink('angular'),
              target: '_self',
              isHtmlLink: true
            },
            {
              text: 'Vue 2',
              link: this.getLink('vue2'),
              target: '_self',
              isHtmlLink: true
            },
            {
              text: 'Vue 3',
              link: this.getLink('vue3'),
              target: '_self',
              isHtmlLink: true
            },
          ]
      };
    }
  }
};
</script>

<style lang="stylus">
.nav-versions
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
