import { defineConfig } from '@vue/cli-service';

export default defineConfig({
  runtimeCompiler: true,
  configureWebpack: {
    resolve: {
      extensions: ['.ts', '.js', '.vue', '.json']
    },
    entry: './src/main.ts'
  }
});