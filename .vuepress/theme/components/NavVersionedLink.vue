<template>

  <RouterLink
    v-else
    class="nav-link"
    :to="this.versionedLink"
    :exact="exact"
    @focusout.native="focusoutAction"
  >
    {{ item.text }}
  </RouterLink>
</template>

<script>
import { ensureExt } from './util'

export default {
  name: 'NavLink',

  props: {
    item: {
      required: true
    }
  },
  watch: { $route(){ } }, // force rerender on route changed
  computed: {
    link () {
      return ensureExt(this.item.link)
    },
    versionedLink() {
      return ensureExt('/'+this.$page.currentVersion+this.item.link)
    },
    exact() {
      if ((this.link === '/' || this.link === '/next/') && this.$route.fullPath.match(/([^/]*\/)?api\//)) {
        return true;
      }
      return false;
    },
  },

  methods: {
    focusoutAction () {
      this.$emit('focusout')
    },

  }
}
</script>
