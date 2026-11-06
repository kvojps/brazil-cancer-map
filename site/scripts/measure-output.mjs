import { readdir, readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { resolve, relative } from 'node:path';

const root = resolve(process.argv[2] ?? 'dist');
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory()
    ? files(resolve(directory, entry.name)) : [resolve(directory, entry.name)]))).flat();
}
const paths = await files(root);
const groups = {};
for (const path of paths) {
  const name = relative(root, path);
  const group = name.startsWith('municipio/') ? 'municipal_documents' : name.startsWith('dados/') ? name.split('/').slice(0, 2).join('/') : name.split('/')[0];
  groups[group] ??= { files: 0, bytes: 0 };
  groups[group].files++;
  groups[group].bytes += (await stat(path)).size;
}
const initial = ['index.html', 'dados/municipalities.json', 'dados/map/within_60_days/all.json', 'dados/municipalities.topojson'];
const resources = [...paths.filter(path => relative(root, path).startsWith('_astro/') || path.endsWith('.woff2')), ...initial.map(path => resolve(root, path))];
const estimates = [];
for (const path of resources) {
  const content = await readFile(path);
  estimates.push({ path: relative(root, path), bytes: content.length, gzip: gzipSync(content).length });
}
console.log(JSON.stringify({ method: 'File sizes and independent local gzip, all shared assets included once; not HTTP transfer.', groups, totalBytes: Object.values(groups).reduce((sum, group) => sum + group.bytes, 0), initialEstimate: estimates, initialGzipBytes: estimates.reduce((sum, entry) => sum + entry.gzip, 0) }, null, 2));
