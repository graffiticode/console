import { exec } from 'child_process';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { basename, resolve } from 'path';

const BATCH_SIZE = 5;
const BASE_DIR = resolve(process.cwd(), '..');

function run(cmd: string, cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) reject(new Error((stdout || '') + (stderr || '')));
      else resolve(stdout);
    });
  });
}

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

async function upgradeAndDeploy(dir: string): Promise<{ name: string; ok: boolean; error?: string }> {
  const name = basename(dir);
  try {
    console.log(`[${name}] Starting upgrade + deploy...`);
    const apiDir = resolve(dir, 'packages/api');
    await run('npm i @graffiticode/basis@latest', apiDir);
    // Ensure graphql peer dep is present if graphql-request is used
    const apiPkg = readFileSync(resolve(apiDir, 'package.json'), 'utf-8');
    if (apiPkg.includes('graphql-request') && !apiPkg.includes('"graphql"')) {
      await run('npm i graphql', apiDir);
    }
    await run('npm run gcp:build', dir);
    console.log(`[${name}] Done`);
    return { name, ok: true };
  } catch (err: any) {
    console.error(`[${name}] FAILED`);
    return { name, ok: false, error: (err.message || '').slice(-500) };
  }
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
