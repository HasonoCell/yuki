// 依赖类型
export type DependencyType = "npm" | "relative" | "absolute";

// Import 语句解析结果
export interface ImportStatement {
  /** 原始导入路径 */
  readonly source: string;
  /** 导入类型 */
  readonly type: DependencyType;
  /** 导入方式：default | namespace | named */
  readonly importKind: "default" | "namespace" | "named";
  /** 具名导入的标识符列表 */
  readonly specifiers: string[];
  /** 在源文件中的位置信息 */
  readonly loc: {
    readonly start: number;
    readonly end: number;
    readonly line: number;
  };
}

// 单个依赖的详细信息
export interface DependencyInfo {
  readonly name: string;
  readonly version: string;
  readonly type: DependencyType;
  /** 是否需要预构建 */
  readonly needsPreBundle: boolean;
  /** 包的入口文件路径 */
  readonly entry: string;
  /** 解析后的绝对路径 */
  readonly resolved: string;
  /** 导入该依赖的文件列表 */
  readonly importers: string[];
}

// 包的 package.json 基础信息
export interface PackageInfo {
  readonly name: string;
  readonly version: string;
  /** CJS 入口文件 */
  readonly main?: string;
  /** ESM 入口文件 */
  readonly module?: string;
}

// 依赖关系图
export interface DependencyGraph {
  /** 所有发现的依赖信息 */
  readonly dependencies: Map<string, DependencyInfo>;
  /** 项目入口文件列表 */
  readonly entryPoints: string[];
  /** 需要预构建的依赖列表 */
  readonly preBundleDeps: string[];
}

// 依赖扫描选项
export interface ScanOptions {
  /** 项目根目录 */
  readonly root: string;
  /** 入口文件列表 */
  readonly entries: string[];
}

// 依赖解析结果
export interface ResolveResult {
  /** 解析后的文件路径 */
  readonly resolved: string;
  /** 是否为外部依赖（不参与打包） */
  readonly external: boolean;
  /** 依赖类型 */
  readonly type: DependencyType;
  /** 包信息（如果是 npm 包） */
  readonly packageInfo?: PackageInfo;
}

// 依赖扫描器
export interface DependencyScanner {
  scan(options: ScanOptions): Promise<DependencyGraph>;

  parseImports(filePath: string): Promise<ImportStatement[]>;
}

// 依赖解析器
export interface DependencyResolver {
  resolveDependency: (
    importPath: string,
    importer?: string,
    projectRoot?: string
  ) => Promise<ResolveResult>;

  resolvePackageEntry(packageRoot: string): Promise<string>;

  readPackageInfo(packageRoot: string): Promise<PackageInfo>;

  fileExists(filePath: string): Promise<boolean>;
}
