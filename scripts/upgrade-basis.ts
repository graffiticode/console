import { execSync } from 'child_process';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { basename, resolve } from 'path';

const BATCH_SIZE = 5;
const BASE_DIR = resolve(process.cwd(), '..');

function findRepos(): string[] {
  return readdirSync(BASE_DIR)
    .filter(name => /^l0\d{3}$/.test(name))
    .map(name => resolve(BASE_DIR, name))
    .filter(dir => {
      if (!existsSync(resolve(dir, 'packages/api/package.json'))) return false;
      if (!existsSync(resolve(dir, 'package.json'))) return false;
      const pkg = readFileSync(resolve(dir, 'package.json'), 'utf-8');
      return pkg.includes('"gcp:build"');
    })
    .sort();
}

function upgradeAndDeploy(dir: string): Promise<{ name: string; ok: boolean; error?: string }> {
  const name = basename(dir);
  return new Promise(resolve => {
    try {
      console.log(`[${name}] Starting upgrade + deploy...`);
      execSync('npm i @graffiticode/basis@latest', {
        cwd: resolve(dir, 'packages/api'),
        stdio: 'pipe',
        timeout: 120_000,
      });
      execSync('npm run gcp:build', {
        cwd: dir,
        stdio: 'pipe',
        timeout: 900_000,
      });
      console.log(`[${name}] Done`);
      resolve({ name, ok: true });
    } catch (err: any) {
      const output = (err.stdout?.toString() || '') + (err.stderr?.toString() || '');
      console.error(`[${name}] FAILED`);
      resolve({ name, ok: false, error: output.slice(-500) });
    }
  });
}

async function main() {
  const repos = findRepos();
  console.log(`Found ${repos.length} repos to upgrade`);
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
