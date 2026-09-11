import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = process.cwd();
const variant = process.env.PAYDEMO_VARIANT ?? 'fixed-v2';
const allowedVariants = new Set(['buggy-v1', 'fixed-v2']);

if (!allowedVariants.has(variant)) {
  throw new Error(`Unsupported PAYDEMO_VARIANT: ${variant}`);
}

const git = (args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

const listFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) return listFiles(absolutePath);
    if (entry.isFile()) return [absolutePath];
    throw new Error(`PayDemo build provenance rejected non-regular source: ${absolutePath}`);
  }));
  return files.flat();
};

const canonicalTreeHash = async (baseDirectory, files) => {
  const hash = createHash('sha256');
  for (const file of [...files].sort()) {
    hash.update(file);
    hash.update('\0');
    hash.update(await readFile(join(baseDirectory, file)));
    hash.update('\0');
  }
  return `sha256:${hash.digest('hex')}`;
};

const provenancePaths = ['apps/paydemo', 'scripts/build-paydemo.mjs'];
const assertCleanProvenance = (expectedCommit) => {
  const actualCommit = git(['rev-parse', '--verify', 'HEAD']);
  if (!/^[a-f0-9]{40}$/.test(actualCommit) || actualCommit !== expectedCommit) {
    throw new Error(
      `PayDemo build provenance changed during build: expected commit ${expectedCommit}, received ${actualCommit}`,
    );
  }
  const status = git([
    'status',
    '--porcelain=v1',
    '--untracked-files=all',
    '--ignored=matching',
    '--',
    ...provenancePaths,
  ]);
  if (status !== '') {
    throw new Error(`PayDemo build provenance requires clean tracked and untracked source:\n${status}`);
  }
};

const commit = git(['rev-parse', '--verify', 'HEAD']);
if (!/^[a-f0-9]{40}$/.test(commit)) {
  throw new Error(`PayDemo build provenance requires an exact 40-character commit, received: ${commit}`);
}
assertCleanProvenance(commit);
execFileSync(process.execPath, ['--check', 'apps/paydemo/server.mjs'], { stdio: 'inherit' });

const sourceFiles = (await listFiles(join(root, 'apps/paydemo')))
  .map((file) => relative(root, file))
  .sort();
const sourceHash = await canonicalTreeHash(root, sourceFiles);

const outputDirectory = join(root, 'dist/paydemo');
await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
await cp(join(root, 'apps/paydemo/public'), join(outputDirectory, 'public'), { recursive: true });
const distributedAppPath = join(outputDirectory, 'public/app.mjs');
const distributedApp = await readFile(distributedAppPath, 'utf8');
await writeFile(
  distributedAppPath,
  `globalThis.PAYDEMO_VARIANT = ${JSON.stringify(variant)};\n${distributedApp}`,
);
const contentFiles = (await listFiles(join(outputDirectory, 'public')))
  .map((file) => relative(outputDirectory, file))
  .sort();
const contentHash = await canonicalTreeHash(outputDirectory, contentFiles);
assertCleanProvenance(commit);

const manifest = {
  app: 'PayDemo',
  variant,
  commit,
  sourceHash,
  sourceFiles,
  contentHash,
  contentFiles,
};

await writeFile(join(outputDirectory, 'build-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Built PayDemo ${manifest.variant} ${manifest.contentHash}`);
