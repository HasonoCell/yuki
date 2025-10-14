/**
 * 主要用于在打包或构建过程中，根据一个 import 或 require 的路径（如 'react'、'./utils.js'）
 * 定位到它在文件系统中的真实位置，并提取相关元信息（比如是否是 npm 包、入口文件等）。
 * 这里先只考虑 react，react/dom，相对导入，绝对导入这四种情况吧
 */

import path from "node:path";
import fs from "node:fs/promises";
import type {
  PackageInfo,
  ResolveResult,
  DependencyResolver,
} from "../../types/dependency.js";

// 判断是否为 NPM 包，如果不是以以下这些字符开头则为 NPM 包
const isNpmPackage = (importPath: string): boolean => {
  return !importPath.startsWith(".") && !importPath.startsWith("/");
};

// 在项目根目录的 node_modules 中查找包
const findPackageJson = async (
  pkgName: string,
  projectRoot: string
): Promise<string | null> => {
  const pkgJsonPath = path.join(
    projectRoot,
    "node_modules",
    pkgName,
    "package.json"
  );

  try {
    await fs.access(pkgJsonPath);
    return pkgJsonPath;
  } catch {
    return null;
  }
};

// 读取 package.json 信息
const readPackageInfo = async (pkgJsonPath: string): Promise<PackageInfo> => {
  const raw = await fs.readFile(pkgJsonPath, "utf-8");
  const json = JSON.parse(raw);

  return {
    name: json.name,
    version: json.version,
    main: json.main,
    module: json.module,
  };
};

// 解析包的入口文件
const resolvePackageEntry = async (packageRoot: string): Promise<string> => {
  const pkgJsonPath = path.join(packageRoot, "package.json");
  const pkgInfo = await readPackageInfo(pkgJsonPath);

  // 优先使用 module 字段（ESM），其次 main（CommonJS）
  const entry = pkgInfo.module || pkgInfo.main || "index.js";
  return path.join(packageRoot, entry);
};

// 解析依赖路径
const resolveDependency = async (
  importPath: string,
  importer?: string,
  projectRoot?: string
): Promise<ResolveResult> => {
  // 1. NPM 包
  if (isNpmPackage(importPath)) {
    const root = projectRoot || process.cwd();
    const pkgJsonPath = await findPackageJson(importPath, root);

    if (!pkgJsonPath) {
      throw new Error(
        `Cannot find package "${importPath}" in ${root}/node_modules`
      );
    }

    const pkgInfo = await readPackageInfo(pkgJsonPath);
    const packageRoot = path.dirname(pkgJsonPath);
    const resolved = await resolvePackageEntry(packageRoot);

    return {
      resolved,
      external: false,
      type: "npm",
      packageInfo: pkgInfo,
    };
  }

  // 2. 相对路径
  if (importPath.startsWith(".")) {
    const resolved = importer
      ? path.resolve(path.dirname(importer), importPath)
      : path.resolve(importPath);
    return {
      resolved,
      external: false,
      type: "relative",
    };
  }

  // 3. 绝对路径
  if (importPath.startsWith("/")) {
    const resolved = path.resolve(importPath);
    return {
      resolved,
      external: false,
      type: "absolute",
    };
  }

  // 4. 其他情况视为外部依赖
  return {
    resolved: importPath,
    external: true,
    type: "npm", // 默认类型
  };
};

// 检查文件是否存在
const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

export const resolver: DependencyResolver = {
  resolveDependency,
  resolvePackageEntry,
  readPackageInfo,
  fileExists,
};
