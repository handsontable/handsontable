<template>
  <div> 
    <tabs :options="{ useUrlFragment: false }"  @changed="tabClicked">
      <tab name="TypeScript" id="typescript">
        <iframe src="https://codesandbox.io/embed/handsontable-typescript-data-grid-hello-world-app-145es?fontsize=14&hidenavigation=1&theme=dark&view=split&runonclick=1" 
          style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;" 
          title="Handsontable React Data Grid - Hello World App"
          allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
          sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts">
        </iframe>
      </tab>
      <tab name="React" id="react">
        <iframe src="https://codesandbox.io/embed/handsontable-react-data-grid-hello-world-app-yt46w?fontsize=14&hidenavigation=1&theme=dark&view=split"
          style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
          title="Handsontable React Data Grid - Hello World App"
          allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
          sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts">
        </iframe>
      </tab>
      <tab name="Vue" id="vue" :is-disabled="true"></tab>
      <tab name="Angular" id="angular" :is-disabled="true"></tab>
   </tabs>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  data(){
    return {
      selected: 'asd'
    }
  },
  methods:{
    tabClicked(event){
      this.selected = event.tab.id;
      console.log(event.tab, event.tab.id, this.selected, 'c');
    }
  }

}
</script>
