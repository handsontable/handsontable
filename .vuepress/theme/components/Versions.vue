<template>
  <div class="nav-versions">
    <DropdownLink :item="item"></DropdownLink>
  </div>
</template>

<script>
import DropdownLink from '@theme/components/DropdownLink.vue';

export default {
  name: 'Versions',
  components: {
    DropdownLink
  },
  methods: {
    addLatest (version) {
      if (version === this.$page.latestVersion) {
        return `${version} (latest)`;
      }

      return version;
    }
  },
  computed: {
    item () {
      return {
        text: this.addLatest(this.$page.currentVersion),
        items: this.$page.versions.map(v => ({ text: `${this.addLatest(v)}`, link: `/${v}/` }))
      }
    }
  }
};
</script>

<style lang="stylus">
.nav-versions
  display inline-block
  position relative
  line-height 2rem
</style>
