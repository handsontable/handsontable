<template>
  <main class="page" v-bind:class="{ 'api': isApi }">
    <slot name="top" />

    <Content class="theme-default-content" />
    <PageEdit />

    <PageNav v-bind="{ sidebarItems }" />

    <slot name="bottom" />
  </main>
</template>

<script>
/* global instanceRegister */
import PageEdit from '@theme/components/PageEdit.vue';
import PageNav from '@theme/components/PageNav.vue';

export default {
  components: { PageEdit, PageNav },
  props: ['sidebarItems'],
  watch: {
    $route(to, from) {
      // Do not reset the `activatedExamples` array when the anchor is changed.
      if (to.path !== from.path) {
        this.activatedExamples = [];
      }
    }
  },
  data() {
    return {
      activatedExamples: [],
    };
  },
  computed: {
    isApi() {
      return this.$route.fullPath.match(/([^/]*\/)?api\//);
    },
  },
  methods: {
    codePreviewTabChanged(selectedTab, exampleId) {
      if (selectedTab.tab.computedId.startsWith('preview-tab')) {
        this.activatedExamples.push(exampleId);
      } else {
        instanceRegister.destroyExample(exampleId);
        this.activatedExamples = this.activatedExamples.filter(activatedExample => activatedExample !== exampleId);
      }
    },
    addClassIfPreviewTabIsSelected(exampleId, className) {
      return this.activatedExamples.includes(exampleId) ? className : '';
    },
    isScriptLoaderActivated(exampleId) {
      return this.activatedExamples.includes(exampleId);
    },
    submitCodesandbox(submitEvent) {
      // form data values
      const html = submitEvent.target.elements.html.value;
      const js = submitEvent.target.elements.js.value;
      const css = submitEvent.target.elements.css.value;
      const formatVersion = version => (/^\d+\.\d+$/.test(version) ? version : 'latest');

      const hyperformula = js.includes('hyperformula') ? { hyperformula: 'latest' } : {};

      const cssObj = css
        ? {
          'style.css': {
            content: css,
          }
        }
        : {};

      // generate codesandbox demo id
      fetch('https://codesandbox.io/api/v1/sandboxes/define?json=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          files: {
            'package.json': {
              content: {
                name: 'handsontable-demo',
                dependencies: {
                  // eslint-disable-next-line
                  handsontable: formatVersion(DOCS_VERSION),
                  ...hyperformula
                }
              },
            },
            'public/index.html': {
              content: html,
            },
            'index.js': {
              content: js,
            },
            ...cssObj
          },
        }),
      })
        .then(x => x.json())
        .then((data) => {
          // redirect to codesandbox demo
          if (data.sandbox_id) {
            window.open(`https://codesandbox.io/p/sandbox/${data.sandbox_id}`, '_blank', 'noreferrer');
          }
        });
    }
  },
};
</script>
