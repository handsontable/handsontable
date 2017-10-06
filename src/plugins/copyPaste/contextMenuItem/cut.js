export default function cutItem(copyPastePlugin) {
  return {
    key: 'cut',
    name: 'Cut',
    callback() {
      copyPastePlugin.cut();
    },
    disabled() {
      return !copyPastePlugin.hot.getSelected();
    },
    hidden: false
  };
}
