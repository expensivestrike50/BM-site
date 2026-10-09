// Publishes dist/client (from `npm run build:pages`) to the gh-pages branch,
// which GitHub Pages serves. Run with `npm run deploy:pages`.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, cpSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: 'inherit' });
const remote = execFileSync('git', ['remote', 'get-url', 'origin']).toString().trim();
const commit = execFileSync('git', ['rev-parse', '--short', 'HEAD']).toString().trim();

const dir = mkdtempSync(join(tmpdir(), 'bm-pages-'));
try {
  cpSync('dist/client', dir, { recursive: true });
  run('git', ['init', '-q', '-b', 'gh-pages'], dir);
  run('git', ['add', '-A'], dir);
  run('git', ['-c', 'user.name=Better Materials', '-c', 'user.email=pages@users.noreply.github.com', 'commit', '-q', '-m', `Deploy ${commit}`], dir);
  run('git', ['push', '-q', '--force', remote, 'gh-pages'], dir);
  console.log(`Deployed ${commit} to gh-pages.`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
