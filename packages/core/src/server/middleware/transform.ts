import { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
import { transform as esbuildTransform } from 'esbuild';

const shouldTransform = (url: string) => {
  const reg = /\.(ts|tsx|js|jsx)$/;
  return reg.test(url);
};

const rewriteImports = (code: string) => {
  // 重写 node_modules 导入：import React from 'react' -> import React from '/@modules/react'
  code = code.replace(
    /import\s+([^'"]*)\s+from\s+['"]([^'"./][^'"]*)['"];?/g,
    'import $1 from "/@modules/$2";'
  );

  // 重写相对路径导入：import App from './App' -> import App from '/src/App.tsx'
  code = code.replace(
    /import\s+([^'"]*)\s+from\s+['"](\.[^'"]*)['"];?/g,
    (match, imports, path) => {
      // 如果没有扩展名，默认添加 .tsx
      if (!/\.(ts|tsx|js|jsx)$/.test(path)) {
        path += '.tsx';
      }
      return `import ${imports} from "${path}";`;
    }
  );

  return code;
};

export const createTransformMiddleware = (root: string) => {
  return async (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void
  ) => {
    const url = req.url;

    // 如果不是以 .ts .tsx .jsx .js 结尾的文件，直接放行
    if (!url || !shouldTransform(url)) {
      return next();
    }

    try {
      // 构建文件的完整路径
      const filePath = path.join(root, url);

      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        return next();
      }

      // 读取源文件
      const sourceCode = fs.readFileSync(filePath, 'utf-8');

      // 使用 esbuild 转换代码
      const result = await esbuildTransform(sourceCode, {
        loader: path.extname(filePath).slice(1) as 'ts' | 'tsx' | 'js' | 'jsx',
        target: 'esnext',
        format: 'esm',
        jsx: 'automatic', // 使用新的 JSX 转换
        jsxImportSource: 'react',
      });

      // 重写导入语句
      const transformedCode = rewriteImports(result.code);

      // 设置响应头
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Cache-Control', 'no-cache');

      // 返回转换后的代码
      res.end(transformedCode);
    } catch (error) {
      console.error(`❌ Transform error for ${url}:`, error);
      res.statusCode = 500;
      res.end(`// Transform error: ${error}`);
    }
  };
};
