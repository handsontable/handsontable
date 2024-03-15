<template>
  <footer class="footer">
    <div class="footer-support">
      <div
        v-if="lastUpdated"
        class="last-updated"
      >
        <span class="prefix">{{ lastUpdatedText }}:</span>
        <span class="time">{{ lastUpdated }}</span>
      </div>

      <div
        v-if="editLink"
        class="edit-link"
      >
        <a
          :href="editLink"
          target="_blank"
          rel="noopener noreferrer"
        >{{ editLinkText }} <i class="ico i-github"></i></a>
      </div>
    </div>

    <div class="rate-post">
      <p>Was this page helpful?</p>
      <div class="btn-group">
        <button>Yes</button>
        <button>No</button>
      </div>
    </div>

    <div class="footer-links">
      <div class="socail-links">
        <a href="https://github.com/handsontable/handsontable" target="_blank"><i class="ico i-github"></i></a>
        <a href="https://www.linkedin.com/company/handsontable/" target="_blank"><i class="ico i-linkedin"></i></a>
      </div>
      
      <div>
        <p>2012 - 2024 © Handsoncode </p>
        <!--<a href="https://handsontable.com/pricing" target="_blank">Pricing</a>
        <a href="https://handsontable.com/contact?category=technical_support" target="_blank">Contact support</a>-->
      </div>
      <ThemeSwitcher />
    </div>
  </footer>
</template>

<script>
import isNil from 'lodash/isNil';
import { endingSlashRE, outboundRE } from '@vuepress/theme-default/util';
import ThemeSwitcher from '@theme/components/ThemeSwitcher.vue';

export default {
  name: 'PageEdit',
  components: {
    ThemeSwitcher
  },

  computed: {
    lastUpdated() {
      return this.$page.lastUpdatedFormat;
    },

    lastUpdatedText() {
      if (typeof this.$themeLocaleConfig.lastUpdated === 'string') {
        return this.$themeLocaleConfig.lastUpdated;
      }
      if (typeof this.$site.themeConfig.lastUpdated === 'string') {
        return this.$site.themeConfig.lastUpdated;
      }

      return 'Last update';
    },

    editLink() {
      const showEditLink = isNil(this.$page.frontmatter.editLink)
        ? this.$site.themeConfig.editLinks
        : this.$page.frontmatter.editLink;

      const {
        repo,
        docsDir = '',
        docsBranch = 'master',
        docsRepo = repo
      } = this.$site.themeConfig;

      if (showEditLink && docsRepo && this.$page.originRelativePath) {
        return this.createEditLink(
          repo,
          docsRepo,
          docsDir,
          docsBranch,
          this.$page.originRelativePath
        );
      }

      return null;
    },

    editLinkText() {
      return (
        this.$themeLocaleConfig.editLinkText
        || this.$site.themeConfig.editLinkText
        || 'Edit this page'
      );
    }
  },

  methods: {
    createEditLink(repo, docsRepo, docsDir, docsBranch, path) {
      const bitbucket = /bitbucket.org/;

      if (bitbucket.test(docsRepo)) {
        const base = docsRepo;

        return (
          `${base.replace(endingSlashRE, '')}/src/${docsBranch}/${docsDir
            ? `${docsDir.replace(endingSlashRE, '')}/`
            : ''}${path}?mode=edit&spa=0&at=${docsBranch}&fileviewer=file-view-default`
        );
      }

      const gitlab = /gitlab.com/;

      if (gitlab.test(docsRepo)) {
        const base = docsRepo;

        return (
          `${base.replace(endingSlashRE, '')}/-/edit/${docsBranch}/${docsDir
            ? `${docsDir.replace(endingSlashRE, '')}/`
            : ''}${path}`
        );
      }

      const base = outboundRE.test(docsRepo)
        ? docsRepo
        : `https://github.com/${docsRepo}`;

      return (
        `${base.replace(endingSlashRE, '')}/edit/${docsBranch}/${docsDir
          ? `${docsDir.replace(endingSlashRE, '')}/`
          : ''}${path}`
      );
    }
  }
};
</script>