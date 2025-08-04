<template>
  <div class="breadcrumbs">
    <a :href="getBaseFrameworkUrl">
      <i class="ico i-home"></i>
      <span v-if="Boolean(getVersion)">{{ getVersion }}<span></span>{{$page.frameworkName}} Data Grid</span>
    </a>
    <a :href="getPageUrl">
      <span v-if="$page.frontmatter.category">{{$page.frontmatter.category}}</span>
      <span>{{$page.frontmatter.title}}</span>
    </a>
  </div>
</template>

<script>
export default {
  name: 'Breadcrumbs',
  computed: {
    getVersion() {
      // return latest version in a format major.minor.patch
      const versions = this.$page.versionsWithPatches?.size
        ? [...this.$page.versionsWithPatches]
        : [];

      if (this.$page.currentVersion !== 'next') {
        const findVersion = versions.find(version => version[0] === this.$page.currentVersion);

        if (findVersion) {
          return findVersion[1][0];
        }
      }

      if (versions.length && versions[0].length >= 2 && versions[0][1].length) {
        return `${versions[0][1][0]}`;
      }

      if (versions.length && versions[1].length >= 2 && versions[1][1].length) {
        return `${versions[1][1][0]}`;
      }

      return ' ';
    },
    getBaseUrl() {
      return `${this.$page.hostname}${this.$site.base}`;
    },
    getBaseFrameworkUrl() {
      // eslint-disable-next-line max-len
      return `${this.getBaseUrl}${this.$page.currentFramework}${this.$page.frameworkSuffix}/${this.$page.path.includes('/api') ? 'api/' : ''}`;
    },
    getPageUrl() {
      return `${this.getBaseUrl}${this.$page.frontmatter.permalink.substring(1)}`;
    }
  }
};
</script>
