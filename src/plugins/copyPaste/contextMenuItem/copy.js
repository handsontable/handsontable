export default function copyItem(copyPastePlugin) {
  return {
    key: 'copy',
    name: 'Copy',
    callback() {
      copyPastePlugin.setCopyableText();
      copyPastePlugin.copy(true);
    },
    disabled: false,
    hidden: false
  };
}
