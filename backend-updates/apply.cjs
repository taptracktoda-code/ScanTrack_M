const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../../webappreviveeeee');
const baseline = JSON.parse(fs.readFileSync(path.join(__dirname, 'baseline.json')));
const lastFile = path.join(__dirname, 'applied.json');
const last = fs.existsSync(lastFile) ? JSON.parse(fs.readFileSync(lastFile)) : {};
const hash = buffer => crypto.createHash('sha256').update(buffer).digest('hex');
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filename = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(filename) : [filename];
  });
}
const files = ['app', 'routes', 'database', 'tests'].flatMap(dir => {
  const folder = path.join(__dirname, dir);
  return fs.existsSync(folder) ? walk(folder) : [];
});
// Check every target before writing anything; preserve concurrent/unrelated edits.
for (const file of files) {
  const relative = path.relative(__dirname, file).replaceAll('\\', '/');
  const destination = path.join(root, relative);
  const current = fs.existsSync(destination) ? hash(fs.readFileSync(destination)) : null;
  if (current && ![baseline[relative], last[relative], hash(fs.readFileSync(file))].includes(current)) throw new Error('Backend changed since inspection: '+relative);
}
for (const file of files) {
  const relative = path.relative(__dirname, file).replaceAll('\\', '/');
  const buffer = fs.readFileSync(file);
  fs.mkdirSync(path.dirname(path.join(root, relative)), { recursive: true });
  fs.writeFileSync(path.join(root, relative), buffer);
  last[relative] = hash(buffer);
}
fs.writeFileSync(lastFile, JSON.stringify(last, null, 2));
console.log('Applied '+files.length+' reviewed backend files to '+root);
