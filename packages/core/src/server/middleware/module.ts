import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
import { transform as esbuildTransform } from 'esbuild';

export const createModuleMiddleware = (root: string) => {
  return async (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void
  ) => {
    let url = req.url;

    // 检查是否是 /@modules/ 请求
    if (!url || !url.startsWith('/@modules/')) {
      return next();
    }

    // 如果是 /@modules/ 请求，打印并处理
    console.log('📦 Module request:', url);

    // 去掉 "/@modules/" 前缀，获取请求的包名
    url = url.slice(10);

    // 分割请求路径
    const parts = url.split('/');

    // 获取包名
    const packageName = parts[0];

    // 获取子路径
    const subPath = parts.slice(1).join('/');

    console.log('📦 Package name:', packageName);
    console.log('📂 Sub path:', subPath);

    // 获取 node_modules 和依赖包的路径
    const nodeModulesPath = path.join(root, 'node_modules');
    const packagePath = path.join(nodeModulesPath, packageName);

    if (!fs.existsSync(packagePath)) {
      console.log('❌ Package not found:', packageName);
      res.statusCode = 404;
      res.end(`Package ${packageName} not found`);
      return;
    }

    console.log('📍 Found package at:', packagePath);

    // 读取 package.json
    const packageJsonPath = path.join(packagePath, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      console.log('❌ package.json not found');
      res.statusCode = 404;
      res.end('package.json not found');
      return;
    }

    // 读取文件内容并解析
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    console.log('📋 Package.json loaded for:', packageJson.name);

    // 确定要读取的文件路径
    let entryFile = '';
    if (subPath) {
      // 如果有子路径，直接使用（如 jsx-runtime）
      entryFile = path.join(packagePath, subPath + '.js'); // 尝试 .js
      if (!fs.existsSync(entryFile)) {
        entryFile = path.join(packagePath, subPath, 'index.js'); // 尝试 index.js
      }
    } else {
      // 如果没有子路径，使用 package.json 的入口
      const mainEntry = packageJson.module || packageJson.main || 'index.js';
      entryFile = path.join(packagePath, mainEntry);
    }

    console.log('📄 Entry file:', entryFile);

    // 检查文件是否存在
    if (!fs.existsSync(entryFile)) {
      console.log('❌ Entry file not found');
      res.statusCode = 404;
      res.end('Entry file not found');
      return;
    }

    // 使用 esbuild 转换并返回
    console.log('✅ Ready to transform and return file');

    const sourceCode = fs.readFileSync(entryFile, 'utf-8');

    try {
      const result = await esbuildTransform(sourceCode, {
        loader: 'js',
        target: 'esnext',
        format: 'esm',
      });

      // 设置响应头并返回转换后的代码
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Cache-Control', 'no-cache');
      res.end(result.code);
    } catch (error) {
      console.error('❌ Transform error:', error);
      res.statusCode = 500;
      res.end(`// Transform error: ${error}`);
    }
  };
};
