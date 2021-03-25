<template>
  <div class="layout-container">
    <ParentLayout>
      <template #page-top>
        <div v-if="show" class="page-top">
          <div class="version-alert">
            <p v-if="isNext">This is an unreleased documentation for the next version of Handsontable.</p>
            <p v-else-if="!isLatest">You're viewing a documentation of a previous version of Handsontable.</p>
          </div>
        </div>
      </template>
    </ParentLayout>
  </div>
</template>

<script>
import ParentLayout from '@parent-theme/layouts/Layout.vue';
import NavLinks from '@theme/components/NavLinks.vue';
import NavLink from '@theme/components/NavLink.vue';
import Sidebar from '@theme/components/Sidebar.vue';

export default {
  name: 'Layout',
  components: {
    ParentLayout,
    NavLinks,
    NavLink,
    Sidebar
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
  margin-top 2rem
  padding 1.2rem 1.2rem
  border-radius 6px
  color #fff
  p
    padding 0
    margin 0
    line-height 1
</style>
