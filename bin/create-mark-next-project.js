#!/usr/bin/env node

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const readline = require('readline');
const os = require('os');
const { execSync } = require('child_process');

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
    semanticRelease: null,
    template: null,
    templateRef: null,
    ci: null,
    previewTools: null,
    verify: null,
    packageManager: null
  };

  for (let i = 0; i < rawArgs.length; i += 1) {
    const arg = rawArgs[i];
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
    if (arg === '--template') {
      options.template = rawArgs[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith('--template=')) {
      options.template = arg.split('=')[1];
      continue;
    }
    if (arg === '--template-ref') {
      options.templateRef = rawArgs[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith('--template-ref=')) {
      options.templateRef = arg.split('=')[1];
      continue;
    }
    if (arg === '--ci') {
      options.ci = true;
      continue;
    }
    if (arg === '--no-ci') {
      options.ci = false;
      continue;
    }
    if (arg === '--preview-tools') {
      options.previewTools = true;
      continue;
    }
    if (arg === '--no-preview-tools') {
      options.previewTools = false;
      continue;
    }
    if (arg === '--verify') {
      options.verify = true;
      continue;
    }
    if (arg === '--no-verify') {
      options.verify = false;
      continue;
    }
    if (arg === '--use-pnpm') {
      options.packageManager = 'pnpm';
      continue;
    }
    if (arg === '--use-npm') {
      options.packageManager = 'npm';
      continue;
    }
    if (arg === '--use-yarn') {
      options.packageManager = 'yarn';
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

function isCommandAvailable(cmd) {
  try {
    execSync(`command -v ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function removeDirectoryIfExists(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

function isLikelyGitUrl(input) {
  return /^(https?:\/\/|git@|ssh:\/\/)/i.test(input);
}

function resolveTemplateSource(templateOption, templateRef) {
  if (!templateOption) {
    return { sourcePath: TEMPLATE_DIR, cleanupPath: null };
  }

  const resolvedLocal = path.resolve(templateOption);
  if (fs.existsSync(resolvedLocal)) {
    return { sourcePath: resolvedLocal, cleanupPath: null };
  }

  if (!isLikelyGitUrl(templateOption)) {
    throw new Error(`Template path "${templateOption}" does not exist and is not a git URL.`);
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cmnp-template-'));
  const args = ['clone', '--depth', '1'];
  if (templateRef) {
    args.push('-b', templateRef);
  }
  args.push(templateOption, tempDir);

  try {
    execSync(`git ${args.join(' ')}`, { stdio: 'inherit' });
  } catch (err) {
    removeDirectoryIfExists(tempDir);
    throw new Error(`Failed to clone template from ${templateOption}: ${err.message}`);
  }

  return { sourcePath: tempDir, cleanupPath: tempDir };
}

function copyTemplate(sourceDir, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
  fs.cpSync(sourceDir, targetDir, {
    recursive: true
  });

  // Ensure no git metadata leaks into generated project.
  removeDirectoryIfExists(path.join(targetDir, '.git'));
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

function stripScripts(pkg, scripts) {
  if (!pkg.scripts) return false;
  let removed = false;
  for (const name of scripts) {
    if (pkg.scripts[name]) {
      delete pkg.scripts[name];
      removed = true;
    }
  }
  if (Object.keys(pkg.scripts).length === 0) {
    delete pkg.scripts;
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
  if (options.removePreviewScripts) {
    stripScripts(pkg, ['preview', 'preview:stop', 'preview:verify', 'preview:check']);
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

function removePnpmLockIfDifferentPM(targetDir, packageManager) {
  if (packageManager === 'pnpm') return;
  const lockPath = path.join(targetDir, 'pnpm-lock.yaml');
  if (fs.existsSync(lockPath)) {
    fs.rmSync(lockPath);
    console.log(`ℹ️  Removed pnpm-lock.yaml because package manager is ${packageManager}.`);
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

function removeCIAssets(targetDir) {
  const workflowsDir = path.join(targetDir, '.github', 'workflows');
  removeDirectoryIfExists(workflowsDir);
  const githubDir = path.join(targetDir, '.github');
  if (fs.existsSync(githubDir) && isDirectoryEmpty(githubDir)) {
    fs.rmdirSync(githubDir);
  }
}

function removePreviewTools(targetDir) {
  const toolsDir = path.join(targetDir, 'tools');
  removeDirectoryIfExists(toolsDir);
}

function runPostGenerationChecks(targetDir, expectedSlug) {
  let passed = true;
  const pkgPath = path.join(targetDir, 'package.json');
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (pkg.name !== expectedSlug) {
      passed = false;
      console.warn(`⚠️  package.json name mismatch: expected "${expectedSlug}", got "${pkg.name}".`);
    }
  } catch (err) {
    passed = false;
    console.warn('⚠️  Failed to read package.json during verification.', err.message);
  }

  const readmePath = path.join(targetDir, 'README.md');
  if (fs.existsSync(readmePath)) {
    const headingLine = fs.readFileSync(readmePath, 'utf8').split('\n')[0];
    if (!headingLine.includes(expectedSlug)) {
      passed = false;
      console.warn('⚠️  README heading does not reflect the project name.');
    }
  }

  const nextConfigPath = path.join(targetDir, 'next.config.mjs');
  if (fs.existsSync(nextConfigPath)) {
    const content = fs.readFileSync(nextConfigPath, 'utf8');
    if (!content.includes(`'${expectedSlug}'`)) {
      passed = false;
      console.warn('⚠️  next.config.mjs repoName fallback was not updated.');
    }
  }

  return passed;
}

function assertNodeVersion(minVersion = '18.18.0') {
  const current = process.versions.node;
  const toParts = v => v.split('.').map(n => parseInt(n, 10));
  const [cMaj, cMin, cPatch] = toParts(current);
  const [mMaj, mMin, mPatch] = toParts(minVersion);
  const isOk =
    cMaj > mMaj ||
    (cMaj === mMaj && cMin > mMin) ||
    (cMaj === mMaj && cMin === mMin && cPatch >= mPatch);
  if (!isOk) {
    console.error(`✖ Node ${minVersion}+ required. Detected ${current}. Please upgrade Node to continue.`);
    process.exit(1);
  }
}

function selectPackageManager(optionPm) {
  if (optionPm) {
    if (!isCommandAvailable(optionPm)) {
      console.warn(`⚠️  ${optionPm} not found on PATH. Falling back to auto-detection.`);
    } else {
      return optionPm;
    }
  }
  if (isCommandAvailable('pnpm')) return 'pnpm';
  if (isCommandAvailable('yarn')) return 'yarn';
  return 'npm';
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
    console.log('  --template <path|git-url> Use a local folder or git repo as template source');
    console.log('  --template-ref <ref>      When using git template, checkout this branch/tag');
    console.log('  --ci / --no-ci            Include or skip GitHub Actions workflows');
    console.log('  --preview-tools / --no-preview-tools  Include or skip nginx preview tools/scripts');
    console.log('  --verify / --no-verify    Run post-generation sanity checks (default on)');
    console.log('  --use-pnpm | --use-npm | --use-yarn  Choose package manager (auto-detect if omitted)');
    console.log();
    console.log('Notes:');
    console.log('  - Install pnpm before running project scripts.');
    console.log('  - Release workflow uses RELEASE_GITHUB_TOKEN (repo PAT) when semantic-release is enabled.');
    process.exit(0);
  }

  assertNodeVersion();

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
  let includeCI = options.ci ?? true;
  let includePreviewTools = options.previewTools ?? true;
  let runVerify = options.verify ?? true;
  const packageManager = selectPackageManager(options.packageManager);

  if (!options.yes) {
    description = await ask('Project description', description);
    author = await ask('Author (optional)', '');
    if (options.semanticRelease === null) {
      useSemanticRelease = await askYesNo('Include semantic-release workflows', true);
    }
    if (options.ci === null) {
      includeCI = await askYesNo('Include GitHub Actions workflows', true);
    }
    if (options.previewTools === null) {
      includePreviewTools = await askYesNo('Include nginx preview tools/scripts', true);
    }
    if (options.verify === null) {
      runVerify = await askYesNo('Run post-generation verification', true);
    }
  }

  if (options.yes && options.semanticRelease === null) {
    useSemanticRelease = true;
  }

  const { sourcePath, cleanupPath } = resolveTemplateSource(options.template, options.templateRef);

  console.log('⏳ Creating project...');
  copyTemplate(sourcePath, targetDirectory);

  const { removedSemanticReleaseDeps } = await updatePackageJson(
    targetDirectory,
    inferredPackageName,
    description,
    author,
    {
      removeSemanticReleaseDeps: !useSemanticRelease,
      removePreviewScripts: !includePreviewTools
    }
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
  if (!includeCI) {
    removeCIAssets(targetDirectory);
    console.log('ℹ️  CI workflows removed as requested.');
  }
  if (!includePreviewTools) {
    removePreviewTools(targetDirectory);
    console.log('ℹ️  Preview tools removed as requested.');
  }

  if (cleanupPath) {
    removeDirectoryIfExists(cleanupPath);
  }

  removePnpmLockIfDifferentPM(targetDirectory, packageManager);

  if (runVerify) {
    const ok = runPostGenerationChecks(targetDirectory, inferredPackageName);
    if (ok) {
      console.log('✅ Verification passed.');
    } else {
      console.log('⚠️  Verification found potential mismatches. Please review warnings above.');
    }
  }

  console.log('✅ Project scaffold created successfully!');
  console.log();
  console.log('Next steps:');
  console.log(`  1. cd ${projectDirName}`);
  console.log(`  2. ${packageManager} ${packageManager === 'pnpm' ? 'install' : 'install'}`);
  console.log(`  3. ${packageManager} ${packageManager === 'npm' ? 'run ' : ''}dev`);
  console.log();
  console.log(`Requirements: Node >=18.18.0; ${packageManager} installed; configure RELEASE_GITHUB_TOKEN if you keep semantic-release.`);
  console.log();
  console.log('Additional commands:');
  const runner = packageManager === 'npm' ? 'npm run' : packageManager;
  console.log(`  ${runner} lint        # Run ESLint`);
  console.log(`  ${runner} lint:style  # Run Stylelint`);
  console.log(`  ${runner} format      # Format files with Prettier`);
}

main().catch(err => {
  console.error('Unexpected error while creating the project.');
  console.error(err);
  process.exit(1);
});
