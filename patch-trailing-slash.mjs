import fs from 'fs';
const f = 'node_modules/editsaurus/dist/cli.js';
let s = fs.readFileSync(f, 'utf8');

const old = '        if (doc.path === route) {';
const neu = '        if (doc.path === route || doc.path === route.replace(/\\/$/, "")) {';

if (!s.includes(old)) {
  console.error('找不到匹配点');
  process.exit(1);
}
s = s.replace(old, neu);
fs.writeFileSync(f, s);
console.log('已 patch 去尾斜杠');
