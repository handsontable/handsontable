<template>
  <div>
    <tabs :options="{ useUrlFragment: false }"  @changed="tabClicked">
      <tab name="JavaScript" id="js">
        <iframe v-if="selected === 'js'" :src="jsSrc"
          :style="styleAttribute"
          :allow="allowAttribute"
          :sandbox="sandboxAttribute"
          title="Handsontable JavaScript Data Grid - Hello World App"
        ></iframe>
      </tab>
      <tab name="TypeScript" id="typescript">
        <iframe v-if="selected === 'typescript'" :src="tsSrc"
          :style="styleAttribute"
          :allow="allowAttribute"
          :sandbox="sandboxAttribute"
          title="Handsontable TypeScript Data Grid - Hello World App"
        ></iframe>
      </tab>
      <tab name="React" id="react">
        <iframe v-if="selected === 'react'" :src="reactSrc"
          :style="styleAttribute"
          :allow="allowAttribute"
          :sandbox="sandboxAttribute"
          title="Handsontable React Data Grid - Hello World App"
        ></iframe>
      </tab>
      <tab name="Vue" id="vue" :is-disabled="true"></tab>
      <tab name="Angular" id="angular" :is-disabled="true"></tab>
   </tabs>
  </div>
</template>

<script>
const hrefStart = 'https://codesandbox.io/embed/';
const hrefEnd = '?fontsize=14&hidenavigation=1&theme=dark&view=preview&runonclick=1';

export default {
  name: 'HelloWorld',
  data() {
    const getUrl = id => `${hrefStart}${id}${hrefEnd}`;

    return {
      selected: 'js',
      jsSrc: getUrl('handsontable-javascript-data-grid-hello-world-app-dzx8f'),
      tsSrc: getUrl('handsontable-typescript-data-grid-hello-world-app-145es'),
      reactSrc: getUrl('handsontable-react-data-grid-hello-world-app-yt46w'),
      styleAttribute: 'width: 100%; height: 500px; border: 0; border-radius: 4px; overflow: hidden;',
      allowAttribute: 'accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; ' +
        'microphone; midi; payment; usb; vr; xr-spatial-tracking',
      sandboxAttribute: 'allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts',
    };
  },
  methods: {
    tabClicked(event) {
      this.selected = event.tab.id;
    }
  }

};
</script>
