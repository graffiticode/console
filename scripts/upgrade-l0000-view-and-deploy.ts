import { spawn } from 'child_process';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { basename, resolve } from 'path';

const PKG_NAME = '@graffiticode/l0000-view';
const COMMIT_MSG = 'Upgrade l0000-view to latest';
// Which package within the repo owns the dependency we upgrade. The shared View
// harness is inherited by language-specific view packages, so the dep lives in
// packages/view (the sibling `upgrade-l0000-and-deploy.ts` targets packages/core
// for @graffiticode/l0000; `upgrade-basis-and-deploy.ts` targets packages/api).
// Running `npm i <pkg>@latest` inside the workspace member updates the single
// root package-lock.json, which is what the Dockerfile's `npm ci` installs from.
const TARGET_PKG = 'packages/view';

const BATCH_SIZE = 5;
const FORCE_DEPLOY = !process.argv.includes('--no-force');
const VERBOSE = process.argv.includes('--verbose');
const BASE_DIR = resolve(process.cwd(), '..');

function parseLangs(): string[] | null {
  const idx = process.argv.indexOf('--lang');
  if (idx === -1) return null;
  const langs: string[] = [];
  for (let i = idx + 1; i < process.argv.length; i++) {
    if (process.argv[i].startsWith('--')) break;
    langs.push(process.argv[i].replace(/^l/i, ''));
  }
  return langs.length > 0 ? langs : null;
}
const LANGS = parseLangs();

function run(cmd: string, cwd: string, timeoutMs = 10 * 60 * 1000): Promise<string> {
  return new Promise((resolve, reject) => {
    const stdio = VERBOSE ? 'inherit' as const : 'pipe' as const;
    const child = spawn('bash', ['-c', cmd], { cwd, stdio });
    const timer = setTimeout(() => { child.kill(); reject(new Error('Timed out')); }, timeoutMs);
    let output = '';
    if (!VERBOSE) {
      child.stdout?.on('data', d => output += d);
      child.stderr?.on('data', d => output += d);
    }
    child.on('close', code => {
      clearTimeout(timer);
      if (code !== 0) reject(new Error(output.slice(-500) || `Exit code ${code}`));
      else resolve(output);
    });
  });
}

function isDeprecated(dir: string): boolean {
  const pkg = readFileSync(resolve(dir, 'package.json'), 'utf-8');
  return /gcp:build.*deprecated/i.test(pkg);
}

function findRepos(): string[] {
  return readdirSync(BASE_DIR)
    .filter(name => /^l0\d{3}$/.test(name))
    .filter(name => !LANGS || LANGS.includes(name.slice(1)))
    .map(name => resolve(BASE_DIR, name))
    .filter(dir => {
      if (!existsSync(resolve(dir, `${TARGET_PKG}/package.json`))) return false;
      if (!existsSync(resolve(dir, 'package.json'))) return false;
      const pkg = readFileSync(resolve(dir, 'package.json'), 'utf-8');
      if (!pkg.includes('"gcp:build"')) return false;
      // Only upgrade repos that actually depend on PKG_NAME, and skip the
      // package itself (would be self-referential).
      const targetPkg = readFileSync(resolve(dir, `${TARGET_PKG}/package.json`), 'utf-8');
      try {
        if (JSON.parse(targetPkg).name === PKG_NAME) return false;
      } catch {
        // fall through; treat unparseable as not-self
      }
      return targetPkg.includes(`"${PKG_NAME}"`);
    })
    .sort();
}

async function upgradeAndDeploy(dir: string): Promise<{ name: string; ok: boolean; error?: string }> {
  const name = basename(dir);
  try {
    console.log(`[${name}] Starting upgrade + deploy...`);
    const targetDir = resolve(dir, TARGET_PKG);
    await run(`npm i ${PKG_NAME}@latest`, targetDir);
    const status = await run('git status --porcelain', dir);
    if (status.trim()) {
      await run(`git add -A && git commit -m "${COMMIT_MSG}"`, dir);
      await run('git push', dir);
      await run('npm run gcp:build', dir, 20 * 60 * 1000);
      console.log(`[${name}] Done`);
    } else if (FORCE_DEPLOY && !isDeprecated(dir)) {
      console.log(`[${name}] Already up to date, force deploying...`);
      await run('npm run gcp:build', dir, 20 * 60 * 1000);
      console.log(`[${name}] Done`);
    } else if (FORCE_DEPLOY) {
      console.log(`[${name}] Deprecated, skipping deploy`);
    } else {
      console.log(`[${name}] Already up to date, skipping deploy`);
    }
    return { name, ok: true };
  } catch (err: any) {
    console.error(`[${name}] FAILED`);
    return { name, ok: false, error: (err.message || '').slice(-500) };
  }
}

async function main() {
  const repos = findRepos();
  console.log(`Found ${repos.length} repos to upgrade (depend on ${PKG_NAME})`);
  repos.forEach(r => console.log(`  ${basename(r)}`));
  console.log('');

  const failed: { name: string; error?: string }[] = [];

  for (let i = 0; i < repos.length; i += BATCH_SIZE) {
    const batch = repos.slice(i, i + BATCH_SIZE);
    console.log(`--- Batch: ${batch.map(d => basename(d)).join(' ')} ---`);

    const results = await Promise.all(batch.map(upgradeAndDeploy));
    for (const r of results) {
      if (!r.ok) failed.push(r);
    }
    console.log('');
  }

  if (failed.length > 0) {
    console.error(`FAILED (${failed.length}):`);
    for (const f of failed) {
      console.error(`  ${f.name}`);
      if (f.error) console.error(`    ${f.error.split('\n').slice(-3).join('\n    ')}`);
    }
    process.exit(1);
  } else {
    console.log(`All ${repos.length} repos upgraded and deployed successfully`);
  }
}

main();
