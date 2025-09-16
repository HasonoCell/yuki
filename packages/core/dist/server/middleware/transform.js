import fs from 'fs';
import path from 'path';
import { transform as esbuildTransform } from 'esbuild';
const shouldTransform = (url) => {
  const reg = /\.(ts|tsx|js|jsx)$/;
  return reg.test(url);
};
const rewriteImports = (code) => {
  code = code.replace(
    /import\s+([^'"]*)\s+from\s+['"]([^'"./][^'"]*)['"];?/g,
    'import $1 from "/@modules/$2";'
  );
  code = code.replace(
    /import\s+([^'"]*)\s+from\s+['"](\.[^'"]*)['"];?/g,
    (match, imports, path2) => {
      if (!/\.(ts|tsx|js|jsx)$/.test(path2)) {
        path2 += '.tsx';
      }
      return `import ${imports} from "${path2}";`;
    }
  );
  return code;
};
const createTransformMiddleware = (root) => {
  return async (req, res, next) => {
    const url = req.url;
    if (!url || !shouldTransform(url)) {
      return next();
    }
    try {
      const filePath = path.join(root, url);
      if (!fs.existsSync(filePath)) {
        return next();
      }
      const sourceCode = fs.readFileSync(filePath, 'utf-8');
      const result = await esbuildTransform(sourceCode, {
        loader: path.extname(filePath).slice(1),
        target: 'esnext',
        format: 'esm',
        jsx: 'automatic',
        // 使用新的 JSX 转换
        jsxImportSource: 'react',
      });
      const transformedCode = rewriteImports(result.code);
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Cache-Control', 'no-cache');
      res.end(transformedCode);
    } catch (error) {
      console.error(`\u274C Transform error for ${url}:`, error);
      res.statusCode = 500;
      res.end(`// Transform error: ${error}`);
    }
  };
};
export { createTransformMiddleware };
