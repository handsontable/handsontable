<template>
  <div class="layout-container">
    <ParentLayout>
      <template #page-top>
        <div v-if="show" class="page-top">
          <div class="version-alert">
            <p v-if="isNext">This is unreleased documentation for Handsontable <strong>Next</strong> version.</p>
            <p v-else-if="!isLatest">You're viewing a documentation of a previous version of Handsontable.</p>
          </div>
        </div>
      </template>
    </ParentLayout>
    <LayoutFooter />
  </div>
</template>

<script>
import ParentLayout from '@parent-theme/layouts/Layout.vue';
import LayoutFooter from '@theme/components/LayoutFooter.vue';
import NavLinks from '@theme/components/NavLinks.vue';
import NavLink from '@theme/components/NavLink.vue';

export default {
  name: 'Layout',
  components: {
    ParentLayout,
    LayoutFooter,
    NavLinks,
    NavLink
  },
  computed: {
    isLatest() {
      return this.$page.currentVersion === this.$page.latestVersion;
    },

    isNext() {
      return this.$page.currentVersion === 'next';
    },

    show() {
      return !this.isLatest || this.isNext;
    }
  }
}
</script>

<style lang="stylus">
.layout-container
  min-height 100%

.version-alert
  background #104bcd
  margin-top 40px
  padding 30px 20px
  border-radius 12px
  color #ffffff
  p
    padding 0
    margin 0
    line-height 1
</style>
