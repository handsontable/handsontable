<template>
  <main class="page" v-bind:class="{ api: isApi }">
    <Breadcrumbs />

    <Content class="theme-default-content" />
    <slot name="top" />
    <PageEdit />

    <slot name="bottom" />
  </main>
</template>

<script>
import PageEdit from '@theme/components/PageEdit.vue';
import Breadcrumbs from '@theme/components/Breadcrumbs.vue';

export default {
  components: {
    PageEdit,
    Breadcrumbs,
  },
  props: ['sidebarItems'],
  computed: {
    isApi() {
      return this.$route.fullPath.match(/([^/]*\/)?api\//);
    },
  },
  methods: {
    copyCode(e) {
      const button = e.target;
      const preTag = button.parentElement;
      const codeTag = preTag.querySelector('code');

      navigator.clipboard.writeText(codeTag.innerText);
      button.classList.add('check');
      setTimeout(() => {
        button.classList.remove('check');
      }, 2000);
    },
    reportCode() {
      // eslint-disable-next-line max-len
      window.open(`https://github.com/handsontable/handsontable/issues/new?link=${window.location}&template=improve_docs.yaml`, '_blank');
    },
    showCodeButton(e) {
      e.target.parentElement?.classList.toggle('active');
    },
    setActiveElement(id) {
      const items = document.querySelectorAll('.table-of-contents > ul li');

      items.forEach((item) => {
        item.classList.remove('active');
      });
      const activeItem = document.querySelector(
        `.table-of-contents > ul li a[href="${id}"]`
      );

      if (activeItem) activeItem.parentElement.classList.add('active');
    },

    checkSectionInView() {
      const sections = document.querySelectorAll(
        '.theme-default-content h2, .theme-default-content h3'
      );
      const visibleElements = [];

      sections.forEach((section) => {
        const topDistance = section.getBoundingClientRect().top;

        if (topDistance > 0 && topDistance < window.innerHeight) {
          visibleElements.push(section);
        }
      });

      if (visibleElements[0]) {
        this.setActiveElement(`#${visibleElements[0].id}`);
      }
    },
  },
  mounted() {
    this.checkSectionInView();
    window.addEventListener('scroll', this.checkSectionInView);
  },
  unmounted() {
    window.removeEventListener('scroll', this.checkSectionInView);
  }
};
</script>
