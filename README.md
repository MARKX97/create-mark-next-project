# create-mark-next-project

`create-mark-next-project` 是一个脚手架 CLI，可以通过一条命令生成完整的 Next.js 16 + React 19 应用模板，默认集成 Tailwind CSS、shadcn/ui 风格组件、Zustand、ESLint、Stylelint、Prettier、Commitlint、semantic-release 以及 GitHub Actions 发布/部署流程。

## 快速开始

```bash
npx create-mark-next-project my-app
cd my-app
pnpm install
pnpm dev
```

### 可选参数

- `-y` / `--yes`：跳过交互式提问，直接使用默认描述。
- `--semantic-release` / `--no-semantic-release`：强制包含或跳过 semantic-release 相关配置与依赖（默认包含，也可在交互中选择；跳过时会删除 `release.yml`、`.releaserc.json`、`CHANGELOG.md` 以及相关依赖并移除预置锁文件）。
- `--template <path|git-url>`：使用本地路径或 Git 仓库作为模板来源（Git 仓库会被浅克隆后使用）。
- `--template-ref <ref>`：指定模板 Git 仓库的分支/tag。
- `--ci` / `--no-ci`：是否包含 `.github/workflows` CI 配置（默认包含）。
- `--preview-tools` / `--no-preview-tools`：是否包含 nginx 预览脚本与相关 npm scripts（默认包含）。
- `--verify` / `--no-verify`：生成完成后是否运行基础校验（默认开启）。
- 如果保留 semantic-release 相关文件，GitHub Actions `release` 工作流需要仓库 Secret `RELEASE_GITHUB_TOKEN`（具备 `repo` 权限的 PAT）；也可以自行改成使用内置的 `GITHUB_TOKEN`。

## 模板特性

- Next.js 16 App Router，演示 Partial Pre-rendering、动态路由与 `generateStaticParams`
- React 19、TypeScript、Zustand 客户端状态示例
- Tailwind CSS + shadcn/ui 风格组件
- ESLint（Next 官方规则 + typescript-eslint + Prettier 集成）
- Stylelint（支持 CSS Modules 与 Tailwind 特殊 at-rule）
- Prettier、lint-staged、Husky
- semantic-release（自动生成 `CHANGELOG.md` 并创建 GitHub Release）
- GitHub Actions：`release.yml`（版本发布）与 `deploy.yml`（静态站点部署）

## 模板更新

`templates/base` 目录包含实际的 Next.js 模板。更新原始项目后，同步替换该目录即可让 CLI 创建新的模板版本。

## 本地调试 CLI

```bash
pnpm install
node bin/create-mark-next-project.js my-app-dev
```

## 发布到 npm

```bash
pnpm publish --access public
```

发布前请确保：

1. `package.json` 版本号已更新
2. `templates/base` 中的依赖与配置已验证可用
3. README 与 LICENSE 信息准确
4. 如果使用预置的 GitHub Actions 进行发布，请在目标仓库设置 `RELEASE_GITHUB_TOKEN`（具备 `repo` 权限的 PAT），否则 release workflow 会失败

## License

MIT
