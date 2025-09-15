import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  {
    // 全局忽略文件
    ignores: ['**/node_modules/', '**/dist/', '.husky/'],
  },
  // 默认配置，适用于所有文件
  tseslint.configs.base,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  // Prettier 插件，必须放在最后
  eslintPluginPrettierRecommended
);
