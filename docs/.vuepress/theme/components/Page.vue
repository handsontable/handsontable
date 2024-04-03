<template>
  <main class="page" v-bind:class="{ 'api': isApi }">
    <div class="breadcrumbs ">
      <a href="#"><i class="ico i-home"></i> 14.2.0</a>
      <a href="#">Getting started</a>
      <span>Introduction</span>
    </div>

    <Content class="theme-default-content" />
    <slot name="top" />
    <PageEdit />

    <slot name="bottom" />
  </main>
</template>

<script>
/* global instanceRegister */
import PageEdit from '@theme/components/PageEdit.vue';
//import PageNav from '@theme/components/PageNav.vue';

export default {
  components: { 
    PageEdit 
    //,PageNav 
  },
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
    }
  },
  updated() {
    // ToC
    const listItems = document.querySelectorAll('.table-of-contents > ul > li');
    const sections = document.querySelectorAll('.theme-default-content h2');

    // Function to add active class to list item
    function setActiveNavItem(id) {
        // Remove active class from all list items
        listItems.forEach(item => {
            item.classList.remove('active');
        });
        // Add active class to the corresponding list item
        const activeItem = document.querySelector(`.table-of-contents > ul li a[href="#${id}"]`);
        if (activeItem) {
            activeItem.parentElement?.classList.add('active');
        }
    }

    // Function to check which section is in view
    function checkSectionInView() {
        const scrollPosition = window.scrollY;

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 0;
            const sectionHeight = section.clientHeight;

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
              setActiveNavItem(section.id);
            }
        });
    }

    // Function for smooth scrolling
    function smoothScroll(target) {
        target.scrollIntoView({ behavior: 'smooth' });
    }

    // Listen for scroll event
    window.addEventListener('scroll', checkSectionInView);

    // Call checkSectionInView on page load with timeout
    window.addEventListener('load', () => {
        setTimeout(() => {
            checkSectionInView();
        }, 400); // Adjust the delay time (e.g., 1000 milliseconds)
    });

  }
};
</script>
