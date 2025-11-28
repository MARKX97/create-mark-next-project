import nextConfig from 'eslint-config-next/core-web-vitals';
import prettierConfig from 'eslint-config-prettier/flat';
import tseslint from 'typescript-eslint';

const tsRecommended = tseslint.configs.recommended.map(config => ({
  ...config,
  files: config.files ?? ['**/*.ts', '**/*.tsx'],
}));

const config = [...nextConfig, ...tsRecommended, prettierConfig];

export default config;
