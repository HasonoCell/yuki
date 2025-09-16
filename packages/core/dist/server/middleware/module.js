import fs from 'fs';
import path from 'path';
import { transform as esbuildTransform } from 'esbuild';
const createModuleMiddleware = (root) => {
  return async (req, res, next) => {
    let url = req.url;
    if (!url || !url.startsWith('/@modules/')) {
      return next();
    }
    console.log('\u{1F4E6} Module request:', url);
    url = url.slice(10);
    const parts = url.split('/');
    const packageName = parts[0];
    const subPath = parts.slice(1).join('/');
    console.log('\u{1F4E6} Package name:', packageName);
    console.log('\u{1F4C2} Sub path:', subPath);
    const nodeModulesPath = path.join(root, 'node_modules');
    const packagePath = path.join(nodeModulesPath, packageName);
    if (!fs.existsSync(packagePath)) {
      console.log('\u274C Package not found:', packageName);
      res.statusCode = 404;
      res.end(`Package ${packageName} not found`);
      return;
    }
    console.log('\u{1F4CD} Found package at:', packagePath);
    const packageJsonPath = path.join(packagePath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      console.log('\u274C package.json not found');
      res.statusCode = 404;
      res.end('package.json not found');
      return;
    }
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    console.log('\u{1F4CB} Package.json loaded for:', packageJson.name);
    let entryFile = '';
    if (subPath) {
      entryFile = path.join(packagePath, subPath + '.js');
      if (!fs.existsSync(entryFile)) {
        entryFile = path.join(packagePath, subPath, 'index.js');
      }
    } else {
      const mainEntry = packageJson.module || packageJson.main || 'index.js';
      entryFile = path.join(packagePath, mainEntry);
    }
    console.log('\u{1F4C4} Entry file:', entryFile);
    if (!fs.existsSync(entryFile)) {
      console.log('\u274C Entry file not found');
      res.statusCode = 404;
      res.end('Entry file not found');
      return;
    }
    console.log('\u2705 Ready to transform and return file');
    const sourceCode = fs.readFileSync(entryFile, 'utf-8');
    try {
      const result = await esbuildTransform(sourceCode, {
        loader: 'js',
        target: 'esnext',
        format: 'esm',
      });
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Cache-Control', 'no-cache');
      res.end(result.code);
    } catch (error) {
      console.error('\u274C Transform error:', error);
      res.statusCode = 500;
      res.end(`// Transform error: ${error}`);
    }
  };
};
export { createModuleMiddleware };
