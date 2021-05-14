<template>
  <div> 
    {{ selected }}
    <tabs :options="{ useUrlFragment: false }"  @changed="tabClicked">
      <tab name="First tab" id="angular">
        <iframe v-if="selected==='angular'" src="https://handsontable.com/" width="500" height="500"></iframe>
        This is the content of the first tab
      </tab>
      <tab name="Second tab">
        This is the content of the second tab
      </tab>
      <tab name="Disabled tab" :is-disabled="true">
        This content will be unavailable while :is-disabled prop set to true
      </tab>
      <tab id="oh-hi-mark" name="Custom fragment">
        The fragment that is appended to the url can be customized
      </tab>
      <tab prefix="<span class='glyphicon glyphicon-star'></span> "
           name="Prefix and suffix"
           suffix=" <span class='badge'>4</span>">
        A prefix and a suffix can be added
      </tab>
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
