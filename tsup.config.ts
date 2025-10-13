import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli/index.ts"], // 主入口文件，可根据实际情况调整
  format: ["esm"], // 输出 ESM 格式
  dts: true, // 生成类型声明文件
  sourcemap: true, // 生成 sourcemap
  clean: true, // 构建前清理输出目录
  splitting: false, // 简化产物结构，后期可根据需要开启
  outDir: "dist",
  target: "esnext",
  shims: false,
  minify: false,
  skipNodeModulesBundle: true, // 不打包 node_modules
});
