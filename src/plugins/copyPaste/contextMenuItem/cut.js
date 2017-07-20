export default function cutItem(copyPastePlugin) {
  return {
    key: 'cut',
    name: 'Cut',
    callback() {
      copyPastePlugin.setCopyableText();
      copyPastePlugin.cut(true);
    },
    disabled() {
      return !copyPastePlugin.hot.getSelected();
    },
    hidden: false
  };
}
