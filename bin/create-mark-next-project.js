#!/usr/bin/env node

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const readline = require('readline');

const TEMPLATE_DIR = path.join(__dirname, '..', 'templates', 'base');
const ROOT_PACKAGE_PATH = path.join(__dirname, '..', 'package.json');
const SEMANTIC_RELEASE_PACKAGES = [
  'semantic-release',
  '@semantic-release/changelog',
  '@semantic-release/commit-analyzer',
  '@semantic-release/git',
  '@semantic-release/github',
  '@semantic-release/release-notes-generator'
];

function getTemplateVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(ROOT_PACKAGE_PATH, 'utf8'));
    if (pkg && typeof pkg.version === 'string' && pkg.version.trim()) {
      return pkg.version.trim();
    }
  } catch (err) {
    console.warn('⚠️  Unable to read CLI version from package.json, falling back to 0.1.0.');
  }
  return '0.1.0';
}

const TEMPLATE_VERSION = getTemplateVersion();

function parseArgs(rawArgs) {
  const args = [];
  const options = {
    yes: false,
    help: false,
    semanticRelease: null
  };

  for (const arg of rawArgs) {
    if (arg === '--yes' || arg === '-y') {
      options.yes = true;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }
    if (arg === '--semantic-release') {
      options.semanticRelease = true;
      continue;
    }
    if (arg === '--no-semantic-release') {
      options.semanticRelease = false;
      continue;
    }
    if (arg.startsWith('-')) {
      console.warn(`Unknown option: ${arg}`);
      continue;
    }
    args.push(arg);
  }

  return { targetDir: args[0], options };
}

function ask(question, initialValue = '') {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(initialValue ? `${question} (${initialValue}): ` : `${question}: `, answer => {
      rl.close();
      resolve(answer || initialValue);
    });
  });
}

function askYesNo(question, defaultValue = true) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  const hint = defaultValue ? 'Y/n' : 'y/N';

  return new Promise(resolve => {
    rl.question(`${question} (${hint}): `, answer => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      if (!normalized) {
        resolve(defaultValue);
        return;
      }
      resolve(normalized === 'y' || normalized === 'yes');
    });
  });
}

function toValidPackageName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .replace(/-{2,}/g, '-');
}

function isDirectoryEmpty(dirPath) {
  const files = fs.readdirSync(dirPath);
  return files.length === 0;
}

function copyTemplate(targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
  fs.cpSync(TEMPLATE_DIR, targetDir, {
    recursive: true
  });
}

function removeSemanticReleaseArtifacts(targetDir) {
  const targets = [
    '.releaserc.json',
    'CHANGELOG.md',
    path.join('.github', 'workflows', 'release.yml')
  ];

  for (const relativePath of targets) {
    const absolutePath = path.join(targetDir, relativePath);
    if (fs.existsSync(absolutePath)) {
      const stats = fs.statSync(absolutePath);
      if (stats.isDirectory()) {
        fs.rmSync(absolutePath, { recursive: true, force: true });
      } else {
        fs.rmSync(absolutePath, { force: true });
      }
    }
  }

  const workflowsDir = path.join(targetDir, '.github', 'workflows');
  if (fs.existsSync(workflowsDir) && isDirectoryEmpty(workflowsDir)) {
    fs.rmdirSync(workflowsDir);
  }
  const githubDir = path.join(targetDir, '.github');
  if (fs.existsSync(githubDir) && isDirectoryEmpty(githubDir)) {
    fs.rmdirSync(githubDir);
  }
}

function stripDeps(pkg, dependencyGroups, targets) {
  let removed = false;
  for (const group of dependencyGroups) {
    if (!pkg[group]) continue;
    for (const dep of targets) {
      if (pkg[group][dep]) {
        delete pkg[group][dep];
        removed = true;
      }
    }
    if (Object.keys(pkg[group]).length === 0) {
      delete pkg[group];
    }
  }
  return removed;
}

async function updatePackageJson(targetDir, packageName, description, author, options = {}) {
  const pkgPath = path.join(targetDir, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    return { removedSemanticReleaseDeps: false };
  }

  const pkg = JSON.parse(await fsp.readFile(pkgPath, 'utf8'));
  pkg.name = packageName;
  pkg.version = TEMPLATE_VERSION;
  if (description) {
    pkg.description = description;
  }
  if (author) {
    pkg.author = author;
  }

  let removedSemanticReleaseDeps = false;
  if (options.removeSemanticReleaseDeps) {
    removedSemanticReleaseDeps = stripDeps(pkg, ['devDependencies', 'dependencies'], SEMANTIC_RELEASE_PACKAGES);
  }

  await fsp.writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  return { removedSemanticReleaseDeps };
}

async function updateReadmeHeading(targetDir, heading) {
  const readmePath = path.join(targetDir, 'README.md');
  if (!fs.existsSync(readmePath)) {
    return;
  }

  const raw = await fsp.readFile(readmePath, 'utf8');
  const updated = raw.replace(/^#\s+.*/m, `# ${heading}`);
  await fsp.writeFile(readmePath, updated);
}

function maybeRemoveLockfile(targetDir, shouldRemove) {
  if (!shouldRemove) {
    return;
  }
  const lockPath = path.join(targetDir, 'pnpm-lock.yaml');
  if (fs.existsSync(lockPath)) {
    fs.rmSync(lockPath);
    console.log('ℹ️  Removed pnpm-lock.yaml because semantic-release dependencies were stripped. Run pnpm install to regenerate it.');
  }
}

function replaceInFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) {
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = content;
  for (const { search, replacement } of replacements) {
    updated = updated.replace(search, replacement);
  }
  if (updated !== content) {
    fs.writeFileSync(filePath, updated);
  }
}

function removeSemanticReleaseDocs(targetDir) {
  const readmePath = path.join(targetDir, 'README.md');
  if (!fs.existsSync(readmePath)) {
    return;
  }

  const raw = fs.readFileSync(readmePath, 'utf8');
  let updated = raw;

  // Remove bullets about semantic-release in feature list and commit section
  updated = updated.replace(/^\s*-\s+GitHub Actions `release\.yml`.*semantic-release.*\n?/m, '');
  updated = updated.replace(/^\s*-\s+如果保留 `semantic-release`.*\n?/m, '');
  updated = updated.replace(/^\s*-\s+`semantic-release` 会根据 commit 类型.*\n?/m, '');

  // Remove release workflow section entirely
  updated = updated.replace(/## 版本发布流程[\s\S]*?(?=^##\s)/m, '');

  // Collapse excessive blank lines introduced by removals
  updated = updated.replace(/\n{3,}/g, '\n\n');

  if (updated !== raw) {
    fs.writeFileSync(readmePath, updated);
  }
}

function updateProjectBasePath(targetDir, projectSlug) {
  const safeSlug = projectSlug || 'next-modern-starter';
  const basePath = `/${safeSlug}`;
  const basePathWithTrailing = `${basePath}/`;
  const baseUrl = `http://localhost:8081${basePathWithTrailing}`;
  const replacementsByFile = new Map([
    [
      path.join(targetDir, 'tools', 'nginx-local-project.conf'),
      [{ search: /\/next-modern-starter\//g, replacement: basePathWithTrailing }]
    ],
    [
      path.join(targetDir, 'tools', 'nginx-local.conf'),
      [
        { search: /\/next-modern-starter\//g, replacement: basePathWithTrailing }
      ]
    ],
    [
      path.join(targetDir, 'tools', 'nginx-start.sh'),
      [
        {
          search: /http:\/\/localhost:8081\/next-modern-starter\//g,
          replacement: baseUrl
        }
      ]
    ],
    [
      path.join(targetDir, 'tools', 'preview-verify.sh'),
      [
        { search: /\/next-modern-starter\//g, replacement: basePathWithTrailing },
        { search: /\/next-modern-starter/g, replacement: basePath }
      ]
    ],
    [
      path.join(targetDir, 'next.config.mjs'),
      [{ search: /'next-modern-starter'/g, replacement: `'${safeSlug}'` }]
    ],
    [
      path.join(targetDir, 'README.md'),
      [
        {
          search: /http:\/\/localhost:8081\/next-modern-starter\//g,
          replacement: baseUrl
        },
        { search: /\/next-modern-starter/g, replacement: basePath }
      ]
    ]
  ]);

  for (const [filePath, replacements] of replacementsByFile.entries()) {
    replaceInFile(filePath, replacements);
  }
}

async function main() {
  const { targetDir: cliArgTargetDir, options } = parseArgs(process.argv.slice(2));

  if (options.help) {
    console.log('Usage:');
    console.log('  npx create-mark-next-project <project-name> [--yes]');
    console.log();
    console.log('Options:');
    console.log('  -y, --yes    Skip interactive prompts and use default values');
    console.log('  -h, --help   Show this help message');
    console.log('  --semantic-release        Force enable semantic-release assets');
    console.log('  --no-semantic-release     Skip semantic-release assets');
    console.log();
    console.log('Notes:');
    console.log('  - Install pnpm before running project scripts.');
    console.log('  - Release workflow uses RELEASE_GITHUB_TOKEN (repo PAT) when semantic-release is enabled.');
    process.exit(0);
  }

  let projectDirName = cliArgTargetDir;
  if (!projectDirName) {
    if (options.yes) {
      projectDirName = 'next-modern-app';
    } else {
      projectDirName = await ask('Project name', 'next-modern-app');
    }
  }

  if (!projectDirName) {
    console.error('✖ Project name is required.');
    process.exit(1);
  }

  const targetDirectory = path.resolve(process.cwd(), projectDirName);
  const inferredPackageName = toValidPackageName(path.basename(targetDirectory));
  if (!inferredPackageName) {
    console.error('✖ Project name must contain at least one alphanumeric character.');
    process.exit(1);
  }

  if (fs.existsSync(targetDirectory)) {
    const stats = fs.statSync(targetDirectory);
    if (!stats.isDirectory()) {
      console.error(`✖ Target path "${projectDirName}" exists and is not a directory.`);
      process.exit(1);
    }
    if (!isDirectoryEmpty(targetDirectory)) {
      console.error(`✖ Target directory "${projectDirName}" is not empty. Please choose a new directory or empty it first.`);
      process.exit(1);
    }
  } else {
    fs.mkdirSync(targetDirectory, { recursive: true });
  }

  let description = 'A Next.js project built with create-mark-next-project';
  let author = '';
  let useSemanticRelease = options.semanticRelease ?? true;

  if (!options.yes) {
    description = await ask('Project description', description);
    author = await ask('Author (optional)', '');
    if (options.semanticRelease === null) {
      useSemanticRelease = await askYesNo('Include semantic-release workflows', true);
    }
  }

  if (options.yes && options.semanticRelease === null) {
    useSemanticRelease = true;
  }

  console.log('⏳ Creating project...');
  copyTemplate(targetDirectory);

  const { removedSemanticReleaseDeps } = await updatePackageJson(
    targetDirectory,
    inferredPackageName,
    description,
    author,
    { removeSemanticReleaseDeps: !useSemanticRelease }
  );
  await updateReadmeHeading(targetDirectory, projectDirName);
  updateProjectBasePath(targetDirectory, inferredPackageName);
  if (!useSemanticRelease) {
    removeSemanticReleaseArtifacts(targetDirectory);
    maybeRemoveLockfile(targetDirectory, removedSemanticReleaseDeps);
    console.log('ℹ️  Semantic-release files have been skipped as requested.');
    removeSemanticReleaseDocs(targetDirectory);
  } else {
    console.log('ℹ️  Release workflow expects RELEASE_GITHUB_TOKEN (repo PAT) or edit workflow to use GITHUB_TOKEN.');
  }

  console.log('✅ Project scaffold created successfully!');
  console.log();
  console.log('Next steps:');
  console.log(`  1. cd ${projectDirName}`);
  console.log('  2. pnpm install');
  console.log('  3. pnpm dev');
  console.log();
  console.log('Requirements: pnpm installed; configure RELEASE_GITHUB_TOKEN if you keep semantic-release.');
  console.log();
  console.log('Additional commands:');
  console.log('  pnpm lint        # Run ESLint');
  console.log('  pnpm lint:style  # Run Stylelint');
  console.log('  pnpm format      # Format files with Prettier');
}

main().catch(err => {
  console.error('Unexpected error while creating the project.');
  console.error(err);
  process.exit(1);
});
